import { defineStore } from 'pinia'
import { ArticleService } from '@/api/articles'
import type { Article } from '@/api/articles'

// 扩展文章类型
type ArticleView = Article & {
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
    subscribers: new Set<string>()
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
    // 组件订阅管理
    subscribe(componentId: string) {
      this.subscribers.add(componentId)
      console.log(`组件 ${componentId} 订阅了文章数据`)
    },
    
    unsubscribe(componentId: string) {
      this.subscribers.delete(componentId)
      console.log(`组件 ${componentId} 取消订阅文章数据`)
      
      // 如果没有组件订阅了，清理缓存
      if (this.subscribers.size === 0) {
        this.clearCache()
        console.log('所有组件已卸载，清理缓存')
      }
    },

    async fetchArticles(forceRefresh = false) {
      // 缓存策略
      if (this.articles.length > 0 && this.isDataFresh && !forceRefresh) {
        console.log('使用缓存的文章数据')
        return this.articles
      }

      // 防止重复请求
      if (this.loading) {
        console.log('请求进行中，等待结果...')
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

      this.loading = true
      this.error = null

      try {
        // 创建新的取消控制器
        this.abortController = new AbortController()
        
        console.log('发起新的文章数据请求')
        const articles = await ArticleService.getAllArticles()
        
        // 检查请求是否被取消
        if (this.abortController?.signal.aborted) {
          console.log('请求已被取消')
          return []
        }
        
        this.articles = articles
        this.lastFetchTime = Date.now()
        console.log(`获取到 ${articles.length} 篇文章`)
        return articles
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.log('请求被取消')
          return []
        }
        this.error = error.message || '获取文章失败'
        console.error('获取文章数据失败:', error)
        throw error
      } finally {
        this.loading = false
        this.abortController = null
      }
    },

    // 取消当前请求
    cancelRequest() {
      if (this.abortController) {
        this.abortController.abort()
        this.abortController = null
        console.log('已取消文章数据请求')
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
