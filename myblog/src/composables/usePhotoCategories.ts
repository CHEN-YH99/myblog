import { ref, reactive, computed } from 'vue'
import { getPhotoCategories } from '@/api/photoCategories'

/**
 * 图片分类组合式函数
 */
export const usePhotoCategories = () => {
  // 图片分类列表
  const photoCategories = ref<Api.PhotoCategory.PhotoCategoryItem[]>([])
  
  // 加载状态
  const loading = ref(false)
  
  // 错误信息
  const error = ref<string | null>(null)
  
  // 最后获取时间
  const lastFetchTime = ref(0)
  
  // 缓存超时时间（5分钟）
  const cacheTimeout = 5 * 60 * 1000
  
  // 数据是否新鲜
  const isDataFresh = computed(() => Date.now() - lastFetchTime.value < cacheTimeout)
  
  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  /**
   * 初始化图片分类列表
   */
  const initPhotoCategories = async (params?: Api.PhotoCategory.SearchParams) => {
    if (loading.value) return
    
    // 检查缓存是否有效
    if (photoCategories.value.length > 0 && isDataFresh.value) {
      // console.log('使用缓存的相册分类数据')
      return
    }

    loading.value = true
    error.value = null
    
    try {
      // console.log('获取相册分类数据...')
      const data = await getPhotoCategories()
      if (data && typeof data === 'object' && 'categories' in data && Array.isArray(data.categories)) {
        photoCategories.value = data.categories
        pagination.total = data.total || 0
        pagination.current = data.currentPage || 1
        pagination.size = data.pageSize || 10
      } else if (Array.isArray(data)) {
        photoCategories.value = data
      } else {
        photoCategories.value = []
      }
      lastFetchTime.value = Date.now()
      // console.log(`获取到 ${photoCategories.value.length} 个相册分类`)
    } catch (err: any) {
      error.value = err.message || '获取相册分类失败'
      console.error('获取相册分类失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID查找图片分类
   * @param id 分类ID
   * @returns 图片分类对象或undefined
   */
  const findPhotoCategory = (id: string) => {
    return photoCategories.value.find((category: Api.PhotoCategory.PhotoCategoryItem) => category._id === id)
  }

  /**
   * 刷新图片分类列表
   */
  const refreshPhotoCategories = async () => {
    await initPhotoCategories()
  }

  return {
    photoCategories,
    loading,
    error,
    pagination,
    initPhotoCategories,
    findPhotoCategory,
    refreshPhotoCategories
  }
}