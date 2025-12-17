import { ref, reactive } from 'vue'
import { getPhotos } from '@/api/photos'

/**
 * 照片组合式函数
 */
export const usePhotos = () => {
  // 照片列表
  const photos = ref<Api.Photo.PhotoItem[]>([])

  // 加载状态
  const loading = ref(false)

  // 错误信息
  const error = ref<string | null>(null)

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0,
  })

  /**
   * 初始化照片列表
   */
  const initPhotos = async (params?: Api.Photo.SearchParams) => {
    loading.value = true
    error.value = null

    try {
      // 重置分页到第1页，确保新查询从第一页开始
      pagination.current = 1
      
      const response = await getPhotos({
        current: pagination.current,
        size: pagination.size,
        ...params,
      })

      // 兼容后端响应格式：records/current/size 或 photos/currentPage/pageSize
      const photoList = (response as any).records || (response as any).photos || []
      const currentPage = (response as any).current || (response as any).currentPage || 1
      const pageSize = (response as any).size || (response as any).pageSize || 20

      photos.value = photoList
      pagination.total = response.total || 0
      pagination.current = currentPage
      pagination.size = pageSize

      console.log(`获取照片列表成功: ${photoList.length} 张, 总数: ${pagination.total}`)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '获取照片列表失败'
      console.error('获取照片列表失败:', err)
      // 错误时清空照片列表
      photos.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID查找照片
   * @param id 照片ID
   * @returns 照片对象或undefined
   */
  const findPhoto = (id: string) => {
    return photos.value.find((photo: Api.Photo.PhotoItem) => photo._id === id)
  }

  /**
   * 刷新照片列表
   */
  const refreshPhotos = async () => {
    await initPhotos()
  }

  return {
    photos,
    loading,
    error,
    pagination,
    initPhotos,
    findPhoto,
    refreshPhotos,
  }
}
