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
    total: 0,
  })

  /**
   * 初始化图片分类列表
   */
  const normalizeCategory = (raw: any): Api.PhotoCategory.PhotoCategoryItem => {
    const id = raw?._id ?? raw?.id
    return {
      ...(raw || {}),
      _id: raw?._id ?? (id ? String(id) : undefined),
      id: id ? String(id) : undefined,
      // 后台以 name 为主，优先使用 name，避免 title 未同步导致的展示不更新
      title: raw?.name ?? raw?.title ?? '',
      name: raw?.name ?? raw?.title ?? '',
      status: raw?.status ?? (raw?.isVisible === false ? 'inactive' : 'active'),
      isVisible: raw?.isVisible,
      coverImage: raw?.coverImage ?? '',
      description: raw?.description ?? '',
      color: raw?.color ?? '#409eff',
      sort: typeof raw?.sort === 'number' ? raw.sort : (typeof raw?.sortOrder === 'number' ? raw.sortOrder : 0),
      photoCount: typeof raw?.photoCount === 'number' ? raw.photoCount : 0,
      createdAt: raw?.createdAt ?? raw?.createTime ?? undefined,
      updatedAt: raw?.updatedAt ?? raw?.updateTime ?? undefined,
    } as Api.PhotoCategory.PhotoCategoryItem
  }

  const initPhotoCategories = async (
    params?: Api.PhotoCategory.SearchParams,
    options?: { force?: boolean }
  ) => {
    if (loading.value) return

    // 检查缓存是否有效，除非显式强制刷新
    if (!options?.force && photoCategories.value.length > 0 && isDataFresh.value) {
      // console.log('使用缓存的相册分类数据')
      return
    }

    loading.value = true
    error.value = null

    try {
      // console.log('获取相册分类数据...')
      const query = options?.force ? ({ ...(params || {}), _t: Date.now() } as any) : params
      const data = await getPhotoCategories(query)
      if (
        data &&
        typeof data === 'object'
      ) {
        if ('categories' in (data as any) && Array.isArray((data as any).categories)) {
          photoCategories.value = (data as any).categories.map(normalizeCategory)
          pagination.total = (data as any).total || 0
          pagination.current = (data as any).currentPage || 1
          pagination.size = (data as any).pageSize || 10
        } else if ((data as any).data) {
          const d = (data as any).data
          if (Array.isArray(d)) {
            photoCategories.value = (d as any[]).map(normalizeCategory)
          } else if (Array.isArray(d.categories)) {
            photoCategories.value = (d.categories as any[]).map(normalizeCategory)
            pagination.total = d.total || 0
            pagination.current = d.currentPage || 1
            pagination.size = d.pageSize || 10
          } else {
            photoCategories.value = []
          }
        } else if (Array.isArray((data as any))) {
          photoCategories.value = ((data as any) as any[]).map(normalizeCategory)
        } else {
          photoCategories.value = []
        }
      } else if (Array.isArray(data)) {
        photoCategories.value = (data as any[]).map(normalizeCategory)
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
    return photoCategories.value.find(
      (category: Api.PhotoCategory.PhotoCategoryItem) => category._id === id,
    )
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
    refreshPhotoCategories,
  }
}
