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
      const response = await getPhotos({
        current: pagination.current,
        size: pagination.size,
        ...params,
      })

      photos.value = response.photos
      pagination.total = response.total
      pagination.current = response.currentPage
      pagination.size = response.pageSize
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '获取照片列表失败'
      console.error('获取照片列表失败:', err)
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
