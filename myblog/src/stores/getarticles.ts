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
    // 初始化用户点赞状态
    async initializeLikeStatus() {
      const userStore = useUserStore()

      // 如果用户未登录，清空状态并返回
      if (!userStore.isLoggedIn) {
        this.likedArticles.clear()
        this.likeStatusInitialized = true
        return
      }

      try {
        // 等待用户信息完全加载
        let userInfo = userStore.userInfo
        if (!userInfo && userStore.token) {
          // 如果有token但没有用户信息，尝试获取用户信息
          try {
            userInfo = await userStore.fetchUserInfo()
          } catch (error) {
            console.warn('获取用户信息失败，使用空状态初始化点赞状态')
            this.likedArticles.clear()
            this.likeStatusInitialized = true
            return
          }
        }

        // 从localStorage恢复点赞状态（支持按 id 与 username 双键合并）
        const idKey = userInfo?.id
        const nameKey = userInfo?.username
        if (!idKey && !nameKey) {
          console.warn('无法获取用户标识，使用空状态初始化点赞状态')
          this.likedArticles.clear()
          this.likeStatusInitialized = true
          return
        }

        const savedById = idKey ? getLikedArticles(idKey) : []
        const savedByName = nameKey ? getLikedArticles(nameKey) : []
        const mergedSaved = Array.from(new Set([...(savedById || []), ...(savedByName || [])]))

        // 清空当前状态
        this.likedArticles.clear()

        // 如果有文章数据，同步服务器状态（与本地状态取并集，避免误清本地）
        if (this.articles.length > 0) {
          const articleIds = this.articles.map((article) => article._id)
          const response = await getBatchLikeStatus(articleIds)

          // 基于本地合并集开始
          const mergedSet = new Set<string>(mergedSaved)

          // 合并服务端为 true 的状态
          Object.entries(response).forEach(([articleId, isLiked]) => {
            if (isLiked) mergedSet.add(articleId)
          })

          // 应用合并结果到内存 Set
          this.likedArticles.clear()
          mergedSet.forEach((id) => this.likedArticles.add(id))

          // 保存合并后的状态到localStorage（双键写入，避免后续切换标识）
          const finalLikedArticles = Array.from(this.likedArticles)
          if (idKey) saveLikedArticles(finalLikedArticles, idKey)
          if (nameKey) saveLikedArticles(finalLikedArticles, nameKey)
        } else {
          // 如果没有文章数据，使用本地保存的状态（合并 id/username 两处数据）
          mergedSaved.forEach((articleId) => {
            this.likedArticles.add(articleId)
          })
        }

        this.likeStatusInitialized = true
        /* init like status synced (debug log removed) */
      } catch (error) {
        console.error('初始化点赞状态失败:', error)
        // 如果服务器请求失败，使用本地状态（合并 id 与 username）
        const idKey = userStore.userInfo?.id
        const nameKey = userStore.userInfo?.username
        const savedById = idKey ? getLikedArticles(idKey) : []
        const savedByName = nameKey ? getLikedArticles(nameKey) : []
        const merged = Array.from(new Set([...(savedById || []), ...(savedByName || [])]))
        merged.forEach((articleId) => {
          this.likedArticles.add(articleId)
        })
        this.likeStatusInitialized = true
      }
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
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }

      const now = Date.now()
      const last = this.lastActionAt.get(articleId) || 0
      if (!options?.force && now - last < this.likeCooldownMs) return
      if (!options?.force && this.likingArticles.has(articleId)) return // 防止并发

      this.lastActionAt.set(articleId, now)
      this.likingArticles.add(articleId)

      // 已点赞则直接返回，避免重复请求（force 时忽略）
      if (!options?.force && this.likedArticles.has(articleId)) {
        this.likingArticles.delete(articleId)
        return
      }

      const article = this.articles.find((a) => a._id === articleId)
      const prevLikes = Number((article as any)?.likes) || 0

      // 乐观更新本地状态 + 立即写入本地存储（按账号隔离）
      this.likedArticles.add(articleId)
      if (article) article.likes = prevLikes + 1
      const idKey = userStore.userInfo?.id
      const nameKey = userStore.userInfo?.username
      if (idKey) addLikedArticle(articleId, idKey)
      if (nameKey) addLikedArticle(articleId, nameKey)

      try {
        const result = await likeArticle(articleId)

        // 以服务端结果为准
        if (article && typeof result?.likes === 'number') {
          article.likes = result.likes
        }

        return result
      } catch (error) {
        // 回滚乐观更新 + 回滚本地存储
        this.likedArticles.delete(articleId)
        if (article) article.likes = prevLikes
        if (idKey) removeLikedArticle(articleId, idKey)
        if (nameKey) removeLikedArticle(articleId, nameKey)
        console.error('点赞失败:', error)
        throw error
      } finally {
        this.likingArticles.delete(articleId)
      }
    },

    // 取消点赞（乐观更新 + 冷却 + 并发保护）
    async unlikeArticle(articleId: string, options?: { force?: boolean }) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }

      const now = Date.now()
      const last = this.lastActionAt.get(articleId) || 0
      if (now - last < this.likeCooldownMs) return
      if (this.likingArticles.has(articleId)) return // 防止并发

      // 若当前未点赞，则无需请求
      if (!this.likedArticles.has(articleId)) return

      this.lastActionAt.set(articleId, now)
      this.likingArticles.add(articleId)

      const article = this.articles.find((a) => a._id === articleId)
      const prevLikes = Number((article as any)?.likes) || 0

      // 乐观更新
      this.likedArticles.delete(articleId)
      if (article && prevLikes > 0) article.likes = prevLikes - 1

      try {
        const result = await unlikeArticle(articleId)

        // 从localStorage移除（按用户键隔离）
        const idKey = userStore.userInfo?.id
        const nameKey = userStore.userInfo?.username
        if (idKey) removeLikedArticle(articleId, idKey)
        if (nameKey) removeLikedArticle(articleId, nameKey)

        // 以服务端结果为准
        if (article && typeof result?.likes === 'number') {
          article.likes = result.likes
        }

        return result
      } catch (error) {
        // 回滚乐观更新
        this.likedArticles.add(articleId)
        if (article) article.likes = prevLikes
        console.error('取消点赞失败:', error)
        throw error
      } finally {
        this.likingArticles.delete(articleId)
      }
    },

    // 与服务端对齐某篇文章的点赞状态，并同步到本地存储
    async reconcileLikeStatus(articleId: string): Promise<boolean> {
      try {
        const status = await getLikeStatus(articleId)
        const isLiked = !!(status as any)?.isLiked
        const userStore = useUserStore()
        const idKey = userStore.userInfo?.id
        const nameKey = userStore.userInfo?.username
        if (isLiked) {
          this.likedArticles.add(articleId)
          if (idKey) addLikedArticle(articleId, idKey)
          if (nameKey) addLikedArticle(articleId, nameKey)
        } else {
          this.likedArticles.delete(articleId)
          if (idKey) removeLikedArticle(articleId, idKey)
          if (nameKey) removeLikedArticle(articleId, nameKey)
        }
        return isLiked
      } catch (e) {
        // 如果校验失败，不改变现有状态
        return this.likedArticles.has(articleId)
      }
    },

    // 切换点赞状态（带冲突自愈：当本地与服务端不一致导致400时自动对齐后再执行期望操作）
    async toggleLike(articleId: string) {
      // 确保已初始化点赞状态，避免未初始化时误判
      if (!this.likeStatusInitialized) {
        await this.initializeLikeStatus()
      }

      const localLiked = this.likedArticles.has(articleId)
      if (localLiked) {
        try {
          return await this.unlikeArticle(articleId)
        } catch (e: any) {
          // 400 等错误时尝试自愈
          const code = e?.code || e?.response?.status
          if (code === 400) {
            const serverLiked = await this.reconcileLikeStatus(articleId)
            if (serverLiked) {
              // 服务端仍显示已点赞，用户意图是取消 -> 强制再次执行取消，忽略冷却/并发保护
              return await this.unlikeArticle(articleId, { force: true })
            }
          }
          throw e
        }
      } else {
        try {
          return await this.likeArticle(articleId)
        } catch (e: any) {
          const code = e?.code || e?.response?.status
          if (code === 400) {
            // 很可能是服务端判定已点赞，本地状态不同步
            const serverLiked = await this.reconcileLikeStatus(articleId)
            if (serverLiked) {
              // 用户意图是切换（取消），强制执行取消
              return await this.unlikeArticle(articleId, { force: true })
            } else {
              // 服务端认为未点赞，则强制重试点赞
              return await this.likeArticle(articleId, { force: true })
            }
          }
          throw e
        }
      }
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
        if (error.name === 'AbortError') {
          // console.log('请求被取消')
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
