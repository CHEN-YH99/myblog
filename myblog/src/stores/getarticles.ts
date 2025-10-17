import { defineStore } from 'pinia'
import { getAllArticlesWithSignal, likeArticle, unlikeArticle, getBatchLikeStatus } from '@/api/articles'
import { useUserStore } from '@/stores/user'
import { 
  getLikedArticles, 
  saveLikedArticles, 
  addLikedArticle, 
  removeLikedArticle,
  clearUserLikeData 
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

    // 正在处理点赞的文章ID集合
    likingArticles: new Set<string>(),
    
    // 点赞状态初始化标记
    likeStatusInitialized: false,
  }),

  getters: {
    articlesCount: (state) => state.articles.length,
    isDataFresh: (state) => Date.now() - state.lastFetchTime < state.cacheTimeout,
    
    // 标签云数据
    tagslist: (state) => {
      const allTags = Array.from(
        new Set(
          state.articles
            .flatMap(article => article.tags)
            .filter((tag): tag is string => tag !== undefined)
        )
      )
      return [...allTags]
        .sort(() => Math.random() - 0.5)
        .slice(0, 20)
    },
    
    // 分页数据生成器
    getPagedArticles: (state) => (currentPage: number, pageSize: number) => {
      const start = (currentPage - 1) * pageSize
      return state.articles.slice(start, start + pageSize)
    }
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
        
        // 从localStorage恢复点赞状态（用户键：优先使用id，兜底使用username）
        const userKey = userInfo?.id || userInfo?.username
        if (!userKey) {
          console.warn('无法获取用户标识，使用空状态初始化点赞状态')
          this.likedArticles.clear()
          this.likeStatusInitialized = true
          return
        }
        
        const savedLikedArticles = getLikedArticles(userKey)
        
        // 清空当前状态
        this.likedArticles.clear()
        
        // 如果有文章数据，同步服务器状态
        if (this.articles.length > 0) {
          const articleIds = this.articles.map(article => article._id)
          const response = await getBatchLikeStatus(articleIds)
          
          // 以服务器状态为准，清空本地状态后重新设置
          Object.entries(response).forEach(([articleId, isLiked]) => {
            if (isLiked) {
              this.likedArticles.add(articleId)
            }
          })
          
          // 保存服务器状态到localStorage
          const finalLikedArticles = Array.from(this.likedArticles)
          saveLikedArticles(finalLikedArticles, userKey)
        } else {
          // 如果没有文章数据，使用本地保存的状态
          savedLikedArticles.forEach(articleId => {
            this.likedArticles.add(articleId)
          })
        }
        
        this.likeStatusInitialized = true
        console.log('文章点赞状态初始化完成，已同步服务器状态')
      } catch (error) {
        console.error('初始化点赞状态失败:', error)
        // 如果服务器请求失败，使用本地状态
        const userKey = userStore.userInfo?.id || userStore.userInfo?.username
        const savedLikedArticles = getLikedArticles(userKey)
        savedLikedArticles.forEach(articleId => {
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

    // 点赞文章
    async likeArticle(articleId: string) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      if (this.likingArticles.has(articleId)) return // 防止重复点击

      this.likingArticles.add(articleId)

      try {
        const result = await likeArticle(articleId)

        // 更新本地状态
        this.likedArticles.add(articleId)
        
        // 保存到localStorage（按用户键隔离）
        const userKey = userStore.userInfo?.id || userStore.userInfo?.username
        addLikedArticle(articleId, userKey)

        // 更新文章点赞数
        const article = this.articles.find(a => a._id === articleId)
        if (article) {
          article.likes = result.likes
        }

        return result
      } catch (error) {
        console.error('点赞失败:', error)
        throw error
      } finally {
        this.likingArticles.delete(articleId)
      }
    },
  
  // 取消点赞
    async unlikeArticle(articleId: string) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      if (this.likingArticles.has(articleId)) return
      
      this.likingArticles.add(articleId)
      
      try {
        const result = await unlikeArticle(articleId)
        
        this.likedArticles.delete(articleId)
        
        // 保存到localStorage（按用户键隔离）
        const userKey = userStore.userInfo?.id || userStore.userInfo?.username
        removeLikedArticle(articleId, userKey)
        
        const article = this.articles.find(a => a._id === articleId)
        if (article) {
          article.likes = result.likes
        }
        
        return result
      } catch (error) {
        console.error('取消点赞失败:', error)
        throw error
      } finally {
        this.likingArticles.delete(articleId)
      }
    },
    
    // 切换点赞状态
    async toggleLike(articleId: string) {
      const isLiked = this.likedArticles.has(articleId)
      return isLiked ? this.unlikeArticle(articleId) : this.likeArticle(articleId)
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
        
        const articles = await getAllArticlesWithSignal(
          this.abortController?.signal
        )
        
        if (this.abortController?.signal.aborted) {
          // console.log('请求已被取消')
          return this.articles
        }
        
        // 为每篇文章添加封面图片
        const articlesWithCover = Array.isArray(articles) ? articles.map((article: any) => ({
          ...article,
          cover: article.cover || '/default-article.jpg'
        })) : []
        
        this.articles = articlesWithCover
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
    }
  }
})


