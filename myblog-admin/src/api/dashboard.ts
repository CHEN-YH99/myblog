import { getArticleList, getCategories, type ArticleItem } from '@/api/articles'

// 统计数据接口类型定义
export interface DashboardStats {
  totalVisits: number      // 总访问次数（所有文章views总和）
  totalArticles: number    // 文章总数
  totalCategories: number  // 文章分类总数
  newUsers: number         // 新用户
  visitChange: string      // 访问量变化百分比
  articleChange: string    // 文章数变化百分比
  categoryChange: string   // 分类数变化百分比
  newUserChange: string    // 新用户变化百分比
}

/**
 * 获取仪表盘统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // 尝试获取文章列表数据
    const articlesRes = await getArticleList({ page: 1, size: 1000 })
    
    // 处理不同的响应格式
    let articles: ArticleItem[] = []
    let totalArticles = 0
    
    if (articlesRes) {
      // 如果响应有data属性
      if (articlesRes.data) {
        articles = articlesRes.data.articles || articlesRes.data || []
        totalArticles = articlesRes.data.total || articles.length
      } 
      // 如果响应直接是数组或包含articles属性
      else if (Array.isArray(articlesRes)) {
        articles = articlesRes
        totalArticles = articles.length
      }
      else if (articlesRes.articles) {
        articles = articlesRes.articles
        totalArticles = articlesRes.total || articles.length
      }
    }
    
    // 计算总访问次数（所有文章views的总和）
    const totalVisits = articles.reduce((sum, article) => {
      const views = article.views || 0
      return sum + views
    }, 0)
    
    // 尝试获取分类数据
    let totalCategories = 0
    try {
      const categoriesRes = await getCategories()
      
      const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.categories || [])
      totalCategories = categories.length
    } catch (categoryError) {
      console.warn('⚠️ 获取分类数据失败，使用默认值:', categoryError)
      totalCategories = 5 // 默认分类数
    }
    
    const result = {
      totalVisits: totalVisits || 0,
      totalArticles: totalArticles || 0,
      totalCategories: totalCategories || 0,
      newUsers: 156, // 保持原有的新用户数据
      visitChange: '+12.5%',
      articleChange: '+8.3%',
      categoryChange: '+5.2%',
      newUserChange: '+22.1%'
    }
    
    return result
    
  } catch (error) {
    console.error('❌ 获取仪表盘数据失败，使用模拟数据:', error)
    // 返回模拟数据
    const mockData = await getMockDashboardStats()
    return mockData
  }
}

/**
 * 获取模拟仪表盘统计数据
 */
export const getMockDashboardStats = (): Promise<DashboardStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalVisits: 12580,
        totalArticles: 25,
        totalCategories: 8,
        newUsers: 156,
        visitChange: '+12.5%',
        articleChange: '+8.3%',
        categoryChange: '+5.2%',
        newUserChange: '+22.1%'
      })
    }, 500)
  })
}