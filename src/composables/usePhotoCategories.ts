import { ref, reactive } from 'vue'
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
    loading.value = true
    error.value = null
    
    try {
      const requestParams: Api.PhotoCategory.SearchParams = {
        current: pagination.current,
        size: pagination.size,
        ...params
      }
      // 默认仅获取前台可见分类
      if (typeof requestParams.isVisible === 'undefined') {
        requestParams.isVisible = true
      }

      const response = await getPhotoCategories(requestParams)
      
      console.log('API响应数据:', response)
      
      // HTTP工具类已经提取了data字段，response应该直接是{categories, total, currentPage, pageSize}格式
      if (response && typeof response === 'object') {
        // 检查是否包含categories属性
        if ('categories' in response && Array.isArray(response.categories)) {
          photoCategories.value = response.categories
          pagination.total = response.total || 0
          pagination.current = response.currentPage || pagination.current
          pagination.size = response.pageSize || pagination.size
          console.log('成功加载图片分类数据:', response.categories.length, '条')
        } else {
          // 如果response直接是数组格式（兼容处理）
          if (Array.isArray(response)) {
            photoCategories.value = response
            pagination.total = response.length
            console.log('成功加载图片分类数据（数组格式）:', response.length, '条')
          } else {
            console.error('API响应数据格式不正确:', response)
            error.value = 'API响应数据格式不正确'
            photoCategories.value = []
          }
        }
      } else {
        console.error('API响应数据为空或格式不正确:', response)
        error.value = 'API响应数据为空'
        photoCategories.value = []
      }
    } catch (err: any) {
      error.value = err.message || '获取图片分类列表失败'
      console.error('获取图片分类列表失败:', err)
      photoCategories.value = []
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