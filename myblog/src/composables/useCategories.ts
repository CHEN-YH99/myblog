import { ref, computed } from 'vue'
import { getCategories, getAllArticles } from '@/api/articles'

/**
 * 分类相关的组合式函数
 * 用于管理分类数据的加载、状态等逻辑
 */
export function useCategories() {
  // 响应式数据
  const categories = ref<Api.Article.CategoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activeCategoriesCount = computed(() => 
    categories.value.filter(cat => cat.status === 'active').length
  )

  const sortedCategories = computed(() => 
    [...categories.value]
      .filter(cat => cat.status === 'active')
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  )

  // 初始化分类数据
  const initCategories = async (forceRefresh = false) => {
    if (categories.value.length > 0 && !forceRefresh) {
      // console.log('使用缓存的分类数据，数量:', categories.value.length)
      return categories.value
    }

    try {
      loading.value = true
      error.value = null
      
      // console.log('开始获取分类数据...')
      // 传递分页参数以获取详细的分类数据
      const result = await getCategories({ page: 1, size: 100 })
      // console.log('获取到分类数据:', result)
      
      categories.value = Array.isArray(result) ? result : []
      // console.log('设置分类数据完成，最终数量:', categories.value.length)
      
      // 输出每个分类的详细信息
      categories.value.forEach((cat, index) => {
        // console.log(`分类 ${index + 1}: 名称=「${cat.name}」, slug=「${cat.slug}」, 状态=${cat.status}`)
      })
      
      return categories.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取分类失败'
      console.error('获取分类失败:', err)
      categories.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取指定分类的文章
  const getCategoryArticles = async (categorySlug: string, params?: Api.Article.SearchParams) => {
    try {
      const articles = await getAllArticles({ ...params, category: categorySlug })
      return articles
    } catch (err) {
      console.error('获取分类文章失败:', err)
      throw err
    }
  }

  // 根据名称或 slug 查找分类
  const findCategory = (nameOrSlug: string) => {
    return categories.value.find(cat => 
      cat.name === nameOrSlug || cat.slug === nameOrSlug
    )
  }

  // 重置状态
  const resetCategories = () => {
    categories.value = []
    error.value = null
    loading.value = false
  }

  return {
    // 数据
    categories: computed(() => categories.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    activeCategoriesCount,
    sortedCategories,

    // 方法
    initCategories,
    getCategoryArticles,
    findCategory,
    resetCategories,
    refreshCategories: () => initCategories(true)
  }
}
