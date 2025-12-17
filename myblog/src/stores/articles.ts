import { defineStore } from 'pinia'
import {
  getAllArticlesWithSignal,
  likeArticle,
  unlikeArticle,
  getBatchLikeStatus,
  getLikeStatus,
  getArticleLikes,
} from '@/api/articles'
import { useUserStore } from '@/stores/user'
import {
  getLikedArticles,
  saveLikedArticles,
  addLikedArticle,
  removeLikedArticle,
  clearUserLikeData,
} from '@/utils/storage'
import { createLikeToolkit } from '@/stores/likeBase'
// Api 类型是全局声明的，不需要导入

// 扩展文章类型
type ArticleView = Api.Article.ArticleItem & {
  cover?: string
}

export const useArticlesStore = defineStore('articles', {
  state: () => ({
    articles: [] as ArticleView[],
    loading: false,
    error: null as string | null,
    lastFetchTime: 0,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存

    // 请求控制
    abortController: null as AbortController | null,

    // 组件订阅管理
    subscribers: new Set<string>(),

    // 用户已点赞的文章ID集合
    likedArticles: new Set<string>(),

    // 正在处理点赞的文章ID集合（防止并发）
    likingArticles: new Set<string>(),

    // 点赞状态初始化标记
    likeStatusInitialized: false,

    // 点赞/取消点赞点击冷却时间（毫秒）
    likeCooldownMs: 700,

    // 记录每篇文章最后一次点赞/取消操作的时间戳
    lastActionAt: new Map<string, number>(),
  }),

  getters: {
    articlesCount: (state) => state.articles.length,
    isDataFresh: (state) => Date.now() - state.lastFetchTime < state.cacheTimeout,

    // 便于追踪依赖的已点赞文章ID数组（相比直接使用 Set.size 更稳定触发响应）
    likedArticleIds: (state) => Array.from(state.likedArticles),
    likedArticlesCount: (state) => Array.from(state.likedArticles).length,
    likingArticleIds: (state) => Array.from(state.likingArticles),

    // 便于组件使用的查询函数
    isLiked: (state) => (articleId: string) => state.likedArticles.has(articleId),
    isLiking: (state) => (articleId: string) => state.likingArticles.has(articleId),

    // 标签云数据
    tagslist: (state) => {
      const allTags = Array.from(
        new Set(
          state.articles
            .flatMap((article) => article.tags)
            .filter((tag): tag is string => tag !== undefined),
        ),
      )
      return [...allTags].sort(() => Math.random() - 0.5).slice(0, 20)
    },
  },

  actions: {
    // 初始化点赞工具（内部使用）
    _initLikeToolkit() {
      if ((this as any)._likeToolkit) return (this as any)._likeToolkit

      const toolkit = createLikeToolkit({
        likedSet: this.likedArticles,
        likingSet: this.likingArticles,
        lastActionAt: this.lastActionAt,
        getCooldownMs: () => this.likeCooldownMs,
        api: {
          like: likeArticle,
          unlike: unlikeArticle,
          getStatus: getLikeStatus,
          getBatchStatus: getBatchLikeStatus,
        },
        storage: {
          getLiked: getLikedArticles,
          addLiked: addLikedArticle,
          removeLiked: removeLikedArticle,
          saveLiked: saveLikedArticles,
        },
        getAllKnownIds: () => this.articles.map((a) => a._id),
        onOptimisticDelta: (id: string, delta: 1 | -1) => {
          const article = this.articles.find((a) => a._id === id)
          if (article) {
            const prev = Number((article as any)?.likes) || 0
            article.likes = Math.max(0, prev + delta)
          }
        },
        onServerSync: (id: string, result: any) => {
          const article = this.articles.find((a) => a._id === id)
          if (article && typeof result?.likes === 'number') {
            article.likes = result.likes
          }
        },
      })

      ;(this as any)._likeToolkit = toolkit
      return toolkit
    },

    // 初始化用户点赞状态
    async initializeLikeStatus() {
      const toolkit = this._initLikeToolkit()
      await toolkit.initializeLikeStatus()
      this.likeStatusInitialized = true
    },

    // 重置点赞状态（用户登出时调用）
    resetLikeStatus() {
      const userStore = useUserStore()
      const id = userStore.userInfo?.id
      const username = userStore.userInfo?.username

      // 清除localStorage中的数据（同时尝试按id与username清理，避免残留）
      clearUserLikeData(id)
      clearUserLikeData(username)

      // 清除内存中的状态
      this.likedArticles.clear()
      this.likeStatusInitialized = false
    },

    // 点赞文章（乐观更新 + 冷却 + 并发保护）
    async likeArticle(articleId: string, options?: { force?: boolean }) {
      const toolkit = this._initLikeToolkit()
      return await toolkit.like(articleId, options)
    },

    // 取消点赞（乐观更新 + 冷却 + 并发保护）
    async unlikeArticle(articleId: string, options?: { force?: boolean }) {
      const toolkit = this._initLikeToolkit()
      return await toolkit.unlike(articleId, options)
    },

    // 与服务端对齐某篇文章的点赞状态，并同步到本地存储
    async reconcileLikeStatus(articleId: string): Promise<boolean> {
      const toolkit = this._initLikeToolkit()
      return await toolkit.reconcileLikeStatus(articleId)
    },

    // 切换点赞状态（带冲突自愈：当本地与服务端不一致导致400时自动对齐后再执行期望操作）
    async toggleLike(articleId: string) {
      // 确保已初始化点赞状态，避免未初始化时误判
      if (!this.likeStatusInitialized) {
        await this.initializeLikeStatus()
      }

      const toolkit = this._initLikeToolkit()
      return await toolkit.toggle(articleId)
    },

    // 组件订阅管理
    subscribe(componentId: string) {
      this.subscribers.add(componentId)
      // console.log(`组件 ${componentId} 订阅了文章数据`)
    },

    unsubscribe(componentId: string) {
      this.subscribers.delete(componentId)
      // console.log(`组件 ${componentId} 取消订阅文章数据`)

      // 如果没有组件订阅了，清理缓存
      if (this.subscribers.size === 0) {
        // console.log('所有组件已卸载，清理缓存')
        this.clearCache()
      }
    },

    async fetchArticles(forceRefresh = false) {
      // 如果有缓存且未过期，直接返回
      if (!forceRefresh && this.articles.length > 0 && this.isDataFresh) {
        // console.log('使用缓存的文章数据')
        return this.articles
      }

      // 如果正在请求中，等待当前请求完成
      if (this.loading) {
        // console.log('请求进行中，等待结果...')
        return new Promise((resolve) => {
          const checkLoading = () => {
            if (!this.loading) {
              resolve(this.articles)
            } else {
              setTimeout(checkLoading, 100)
            }
          }
          checkLoading()
        })
      }

      // 取消之前的请求
      this.cancelRequest()

      // 创建新的 AbortController
      this.abortController = new AbortController()

      try {
        this.loading = true
        this.error = null

        // console.log('发起新的文章数据请求')

        const articles = await getAllArticlesWithSignal(this.abortController?.signal)

        if (this.abortController?.signal.aborted) {
          // console.log('请求已被取消')
          return this.articles
        }

        // 为每篇文章添加封面图片
        const articlesWithCover = Array.isArray(articles)
          ? articles.map((article: any) => ({
              ...article,
              cover: article.cover || '/default-article.jpg',
              // 强制数值化，兼容历史文档 likes/views 为字符串的情况
              likes: Number((article as any)?.likes) || 0,
              views: Number((article as any)?.views) || 0,
            }))
          : []

        // 过滤不可见文章；默认可见
        const visibleArticles = articlesWithCover.filter((a: any) => a.visible !== false)
        // 置顶优先，置顶内按发布时间倒序
        const parseDate = (a: any) => {
          const d = a.publishDate || a.create_time || a.updateDate
          return d ? Date.parse(d) : 0
        }
        const sortedArticles = visibleArticles.sort((a: any, b: any) => {
          const ap = a.isTop ? 1 : 0
          const bp = b.isTop ? 1 : 0
          if (ap !== bp) return bp - ap
          return parseDate(b) - parseDate(a)
        })

        this.articles = sortedArticles
        this.lastFetchTime = Date.now()
        this.error = null

        // 如果用户已登录，初始化点赞状态
        await this.initializeLikeStatus()

        // console.log(`获取到 ${articles.length} 篇文章`)

        return this.articles
      } catch (error: any) {
        // 检查是否是取消的请求
        if (error?.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('canceled')) {
          console.debug('[Store] 文章数据请求已取消')
          // 取消的请求不算失败，直接返回已有数据
          return this.articles
        }

        this.error = error.message || '获取文章失败'
        console.error('获取文章失败:', error)
        throw error
      } finally {
        this.loading = false
        this.abortController = null
      }
    },

    cancelRequest() {
      if (this.abortController) {
        this.abortController.abort()
        // console.log('已取消文章数据请求')
      }
    },

    clearCache() {
      this.cancelRequest()
      this.articles = []
      this.lastFetchTime = 0
      this.error = null
    },
  },
})

