import { ref, computed } from 'vue'
import { getArticleList } from '@/api/articles'

// 全局文章统计状态
const articleStats = ref({
  totalArticles: 0,
  monthlyArticleData: new Array(12).fill(0),
  monthlyViewsData: new Array(12).fill(0),
  currentMonthArticles: 0,
  totalViews: 0,
  lastUpdated: Date.now()
})

// 刷新标识，用于触发组件重新渲染
const refreshKey = ref(0)

/**
 * 文章统计数据管理 Composable
 */
export function useArticleStats() {
  
  /**
   * 获取并更新文章统计数据
   */
  const fetchArticleStats = async () => {
    try {
      console.log('🔄 开始获取文章统计数据...')
      const response = await getArticleList()
      console.log('📊 文章统计API响应:', response)
      
      // 处理不同的API响应格式，确保获取到数组
      let articles = []
      if (response && response.data) {
        // 新的统一API格式
        if (response.data.articles && Array.isArray(response.data.articles)) {
          articles = response.data.articles
        } else if (Array.isArray(response.data)) {
          articles = response.data
        }
      } else if (response && response.articles && Array.isArray(response.articles)) {
        // 旧格式
        articles = response.articles
      } else if (Array.isArray(response)) {
        // 直接是数组格式
        articles = response
      }
      
      console.log('📊 处理后的文章数组:', articles.length, '篇文章')
      
      // 确保articles是数组
      if (!Array.isArray(articles)) {
        console.warn('📊 articles不是数组，使用空数组')
        articles = []
      }
      
      // 重置统计数据
      const monthlyCount = new Array(12).fill(0)
      const monthlyViews = new Array(12).fill(0)
      const currentMonth = new Date().getMonth()
      let totalViews = 0
      
      // 统计文章发布数量和访问量
      articles.forEach((article: any) => {
        const publishDate = article.publishDate || article.create_time
        const views = article.views || article.count || 0
        
        if (publishDate) {
          const date = new Date(publishDate)
          if (!isNaN(date.getTime())) {
            const month = date.getMonth() // 0-11
            monthlyCount[month]++
            monthlyViews[month] += views
          }
        }
        
        totalViews += views
      })
      
      // 更新全局状态
      articleStats.value = {
        totalArticles: articles.length,
        monthlyArticleData: monthlyCount,
        monthlyViewsData: monthlyViews,
        currentMonthArticles: monthlyCount[currentMonth],
        totalViews: totalViews,
        lastUpdated: Date.now()
      }
      
      // 触发组件重新渲染
      refreshKey.value++
      
      console.log('📊 文章统计更新完成:', {
        总文章数: articleStats.value.totalArticles,
        本月发表: articleStats.value.currentMonthArticles,
        总访问量: articleStats.value.totalViews,
        月度发布统计: monthlyCount,
        月度访问量统计: monthlyViews
      })
      
      return articleStats.value
      
    } catch (error) {
      console.error('📊 获取文章统计数据失败:', error)
      throw error
    }
  }
  
  /**
   * 手动刷新统计数据
   */
  const refreshStats = async () => {
    console.log('🔄 手动刷新文章统计数据')
    return await fetchArticleStats()
  }
  
  /**
   * 监听文章发布事件，自动更新统计
   */
  const onArticlePublished = async () => {
    console.log('📝 检测到文章发布事件，自动更新统计数据')
    await fetchArticleStats()
  }
  
  /**
   * 监听文章更新事件，自动更新统计
   */
  const onArticleUpdated = async () => {
    console.log('✏️ 检测到文章更新事件，自动更新统计数据')
    await fetchArticleStats()
  }
  
  /**
   * 监听文章删除事件，自动更新统计
   */
  const onArticleDeleted = async () => {
    console.log('🗑️ 检测到文章删除事件，自动更新统计数据')
    await fetchArticleStats()
  }
  
  // 计算属性
  const averageMonthlyArticles = computed(() => {
    return Math.round(articleStats.value.totalArticles / 12)
  })
  
  const currentMonthGrowth = computed(() => {
    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentCount = articleStats.value.monthlyArticleData[currentMonth]
    const lastCount = articleStats.value.monthlyArticleData[lastMonth]
    
    if (lastCount === 0) return '+100%'
    const growth = ((currentCount - lastCount) / lastCount * 100).toFixed(1)
    return growth > 0 ? `+${growth}%` : `${growth}%`
  })
  
  return {
    // 状态
    articleStats: computed(() => articleStats.value),
    refreshKey: computed(() => refreshKey.value),
    
    // 计算属性
    averageMonthlyArticles,
    currentMonthGrowth,
    
    // 方法
    fetchArticleStats,
    refreshStats,
    onArticlePublished,
    onArticleUpdated,
    onArticleDeleted
  }
}

// 全局事件总线，用于跨组件通信
class ArticleEventBus {
  private listeners: { [key: string]: Function[] } = {}
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }
  
  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }
  
  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args))
    }
  }
}

export const articleEventBus = new ArticleEventBus()

// 自动监听文章事件
const { onArticlePublished, onArticleUpdated, onArticleDeleted } = useArticleStats()

articleEventBus.on('article:published', onArticlePublished)
articleEventBus.on('article:updated', onArticleUpdated)
articleEventBus.on('article:deleted', onArticleDeleted)