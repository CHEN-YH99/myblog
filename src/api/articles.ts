export interface TocItem {
  id: string
  text: string
  level: number
}

export interface Article {
  _id: string
  title: string
  slug: string
  content: string
  contentFormat: 'markdown' | 'html'
  contentHtml?: string
  toc?: TocItem[]
  author: string
  category?: string
  tags?: string[]
  publishDate: string
  updateDate: string
  likes: number
  views: number
  excerpt: string
  image?: string
}

const API_BASE_URL = 'http://localhost:3001/api'

export class ArticleService {
  
  // 获取所有文章列表的静态异步方法

  static async getAllArticles(params?: { tag?: string; category?: string }): Promise<Article[]> {
    const u = new URL(`${API_BASE_URL}/articles`)
    if (params?.tag) u.searchParams.set('tag', params.tag)
    if (params?.category) u.searchParams.set('category', params.category)
    
    const res = await fetch(u)
    if (!res.ok) throw new Error('获取文章列表失败')
    
    const articles: Article[] = await res.json()
    
    // 为每篇文章初始化当前点赞数（基于数据库原始数据）
    const updatedArticles = articles.map(article => {
      const currentLikesKey = `current_likes_${article._id}`
      
      // 如果localStorage中没有当前点赞数，使用数据库的原始数据初始化
      if (!localStorage.getItem(currentLikesKey)) {
        localStorage.setItem(currentLikesKey, (article.likes || 0).toString())
      }
      
      // 获取当前存储的点赞数用于显示
      const currentLikes = parseInt(localStorage.getItem(currentLikesKey) || (article.likes || 0).toString())
      
      return {
        ...article,
        likes: currentLikes // 显示当前的点赞数
      }
    })
    
    return updatedArticles
  }

  static async getArticle(idOrSlug: string): Promise<Article> {
    const res = await fetch(`${API_BASE_URL}/articles/${idOrSlug}`)
    if (!res.ok) throw new Error('获取文章失败')
    return res.json()
  }

  static async createArticle(payload: Partial<Article>): Promise<Article> {
    const res = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('创建文章失败')
    return res.json()
  }

  static async uploadImage(file: File): Promise<{ url: string }> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE_URL}/uploads`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('上传失败')
    return res.json()
  }
  
  // ==================== 点赞功能 - 本地模拟实现 ====================
  
  //  点赞文章 - 本地模拟版本
  static async likeArticle(articleId: string): Promise<{ likes: number }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const currentLikesKey = `current_likes_${articleId}`
      const userLikedKey = `user_liked_${articleId}`

      // 防止重复点赞
      if (localStorage.getItem(userLikedKey) === 'true') {
        const currentLikes = parseInt(localStorage.getItem(currentLikesKey) || '0')
        return { likes: currentLikes }
      }

      // 获取当前点赞数（这个数已经包含了数据库原始数据）
      const currentLikes = parseInt(localStorage.getItem(currentLikesKey) || '0')
      const newLikes = currentLikes + 1

      // 更新数据
      localStorage.setItem(currentLikesKey, newLikes.toString())
      localStorage.setItem(userLikedKey, 'true')

      return { likes: newLikes }
    } catch (error) {
      throw new Error('点赞失败')
    }
  }

  // 修正后的取消点赞逻辑
  static async unlikeArticle(articleId: string): Promise<{ likes: number }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const currentLikesKey = `current_likes_${articleId}`
      const userLikedKey = `user_liked_${articleId}`

      // 如果用户没有点赞过，直接返回当前数据
      if (localStorage.getItem(userLikedKey) !== 'true') {
        const currentLikes = parseInt(localStorage.getItem(currentLikesKey) || '0')
        return { likes: currentLikes }
      }

      // 获取当前点赞数并 -1（确保不小于0）
      const currentLikes = parseInt(localStorage.getItem(currentLikesKey) || '0')
      const newLikes = Math.max(0, currentLikes - 1)

      // 保存新的点赞数和用户状态
      localStorage.setItem(currentLikesKey, newLikes.toString())
      localStorage.setItem(userLikedKey, 'false')

      return { likes: newLikes }
    } catch (error) {
      throw new Error('取消点赞失败')
    }
  }

  // 获取用户点赞状态 - 本地模拟版本
  static async getLikeStatus(articleId: string): Promise<{ isLiked: boolean }> {
    try {
      // 模拟轻微延迟
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 从localStorage检查点赞状态
      const likedArticlesKey = 'likedArticles'
      const likedArticles = JSON.parse(localStorage.getItem(likedArticlesKey) || '[]')
      
      const isLiked = likedArticles.includes(articleId)
      
      return { isLiked }
    } catch (error) {
      console.error('获取点赞状态失败:', error)
      throw new Error('获取点赞状态失败')
    }
  }

  // 批量获取文章点赞状态 - 本地模拟版本
  static async getBatchLikeStatus(articleIds: string[]): Promise<Record<string, boolean>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const likedArticlesKey = 'likedArticles'
      const likedArticles = JSON.parse(localStorage.getItem(likedArticlesKey) || '[]')
      
      const result: Record<string, boolean> = {}
      articleIds.forEach(id => {
        result[id] = likedArticles.includes(id)
      })
      
      return result
    } catch (error) {
      console.error('批量获取点赞状态失败:', error)
      throw new Error('批量获取点赞状态失败')
    }
  }

  // 获取文章的实际点赞数 - 本地模拟版本
  static async getArticleLikes(articleId: string): Promise<{ likes: number }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const likesKey = `article_likes_${articleId}`
      const likes = parseInt(localStorage.getItem(likesKey) || '0')
      
      return { likes }
    } catch (error) {
      console.error('获取文章点赞数失败:', error)
      throw new Error('获取文章点赞数失败')
    }
  }

  
  // 初始化文章点赞数据 - 本地模拟版本
  static async initializeArticleLikes(articles: Article[]): Promise<Article[]> {
    try {
      // 为每篇文章从localStorage获取点赞数
      const updatedArticles = articles.map(article => {
        const likesKey = `article_likes_${article._id}`
        const localLikes = parseInt(localStorage.getItem(likesKey) || '0')
        
        // 如果localStorage中有点赞数据，使用localStorage的数据
        // 否则保持原有的点赞数
        return {
          ...article,
          likes: localLikes > 0 ? localLikes : article.likes || 0
        }
      })
      
      return updatedArticles
    } catch (error) {
      console.error('初始化文章点赞数据失败:', error)
      return articles // 出错时返回原数据
    }
  }
 
  // 清除所有本地点赞数据 - 用于测试或重置
  static clearLocalLikeData(): void {
    try {
      const likedArticlesKey = 'likedArticles'
      localStorage.removeItem(likedArticlesKey)
      
      // 清除所有文章的点赞数据
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('article_likes_')) {
          localStorage.removeItem(key)
        }
      })
      
      console.log('本地点赞数据已清除')
    } catch (error) {
      console.error('清除本地点赞数据失败:', error)
    }
  }
}
