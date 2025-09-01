import { ref, computed } from 'vue'
import { useArticlesStore } from '@/stores/getarticles'
import { nanoid } from 'nanoid' // 或使用其他 ID 生成器

/**
 * 文章相关的组合式函数
 * 用于管理文章列表的加载、分页、状态等逻辑
 */
export function useArticles() {
  const store = useArticlesStore() // 获取文章状态管理实例
  const componentId = nanoid() // 生成唯一组件 ID
  
  // 分页状态
  const currentPage = ref(1)
  const pageSize = ref(5)
  
  // 计算属性
  const articles = computed(() => store.articles)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const total = computed(() => store.articlesCount)
  const tagslist = computed(() => store.tagslist)
  
  const pagedArticles = computed(() => 
    store.getPagedArticles(currentPage.value, pageSize.value)
  )
  
  // 初始化数据
  const initArticles = async (forceRefresh = false) => {
    try {
      store.subscribe(componentId)
      await store.fetchArticles(forceRefresh)
      currentPage.value = 1
    } catch (error) {
      console.error('初始化文章数据失败:', error)
    }
  }
  
  // 组件卸载清理
  const cleanup = () => {
    store.unsubscribe(componentId)
  }
  
  return {
    // 数据
    articles,
    loading,
    error,
    total,
    tagslist,
    pagedArticles,
    
    // 分页
    currentPage,
    pageSize,
    
    // 方法
    initArticles,
    cleanup,
    refreshArticles: () => store.fetchArticles(true)
  }
}
