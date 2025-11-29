import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArticlesStore } from '@/stores/getarticles'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { nanoid } from 'nanoid'
import { debounce } from '@/utils/performance'

// 类型定义
interface PaginationState {
  currentPage: number
  pageSize: number
}

interface ArticleItem {
  _id: string
  title: string
}

interface UseArticlesOptions {
  routeName?: string
  autoInit?: boolean
  defaultPageSize?: number
}

/**
 * 文章相关的组合式函数
 * 用于管理文章列表的加载、分页、状态等逻辑
 */
export function useArticles(options: UseArticlesOptions = {}) {
  const { routeName, autoInit = true, defaultPageSize = 5 } = options

  const store = useArticlesStore()
  const userStore = useUserStore()
  const componentId = nanoid()
  const router = useRouter()
  const route = useRoute()

  // 根据路由名称生成唯一的存储键
  const routeKey = routeName ?? (route.name != null ? String(route.name) : undefined)
  const storageKey = `pagination_${routeKey || 'default'}`

  // 分页状态管理
  const createPaginationManager = () => {
    const getSavedPagination = (): PaginationState => {
      try {
        const saved = localStorage.getItem(storageKey)
        return saved ? JSON.parse(saved) : { currentPage: 1, pageSize: defaultPageSize }
      } catch (error) {
        if (import.meta.env?.DEV) console.warn('获取分页状态失败:', error)
        return { currentPage: 1, pageSize: defaultPageSize }
      }
    }

    const savePagination = debounce((page: number, size: number) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ currentPage: page, pageSize: size }))
      } catch (error) {
        if (import.meta.env?.DEV) console.warn('保存分页状态失败:', error)
      }
    }, 300)

    return { getSavedPagination, savePagination }
  }

  const { getSavedPagination, savePagination } = createPaginationManager()
  const savedPagination = getSavedPagination()

  // 响应式状态
  const currentPage = ref(savedPagination.currentPage)
  const pageSize = ref(savedPagination.pageSize)
  const isInitialized = ref(false)
  const retryCount = ref(0)
  const maxRetries = 3

  // 计算属性
  const articles = computed(() => store.articles)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const total = computed(() => store.articlesCount)
  const tagslist = computed(() => store.tagslist)

  const pagedArticles = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return articles.value.slice(start, end)
  })

  const hasNextPage = computed(() => currentPage.value * pageSize.value < total.value)

  const hasPrevPage = computed(() => currentPage.value > 1)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  // 分页监听器
  const setupPaginationWatcher = () => {
    const stopWatchPage = watch(currentPage, (newPage) => {
      if (isInitialized.value) {
        savePagination(newPage, pageSize.value)
      }
    })

    const stopWatchSize = watch(pageSize, (newSize) => {
      if (isInitialized.value) {
        // 重新计算当前页，确保不超出范围
        const newTotalPages = Math.ceil(total.value / newSize)
        if (currentPage.value > newTotalPages) {
          currentPage.value = Math.max(1, newTotalPages)
        }
        savePagination(currentPage.value, newSize)
      }
    })

    return () => {
      stopWatchPage()
      stopWatchSize()
    }
  }

  // 导航相关
  const createNavigationHandler = () => {
    const checkLoginStatus = (): boolean => {
      if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再查看文章详情')
        return false
      }
      return true
    }

    const goToArticle = (article: ArticleItem) => {
      try {
        if (!checkLoginStatus()) {
          router.push({
            path: '/login',
            query: { redirect: `/article/${article._id}` },
          })
          return
        }

        // 保存当前分页状态
        savePagination(currentPage.value, pageSize.value)
        // 跳转到文章详情页，附带来源菜单用于导航高亮
        const path = route.path || '/'
        const mapPathToMenu = (p: string) => {
          if (p === '/') return 'home'
          if (p === '/timeline') return 'timeline'
          if (p.startsWith('/frontend')) return 'frontend'
          if (p.startsWith('/backend')) return 'backend'
          if (p.startsWith('/category')) return 'category'
          if (p.startsWith('/photoAlbum')) return 'photos'
          if (p.startsWith('/photo-category/')) return 'photos'
          if (p.startsWith('/talk')) return 'talk'
          if (p.startsWith('/links')) return 'links'
          if (p.startsWith('/board')) return 'board'
          if (p.startsWith('/login')) return 'login'
          return 'home'
        }
        const from = mapPathToMenu(path)
        router.push({ path: `/article/${article._id}`, query: { from } })
      } catch (error) {
        console.error('跳转文章详情失败:', error)
        ElMessage.error('跳转失败，请重试')
      }
    }

    const goToPage = (page: number) => {
      try {
        if (page < 1 || page > totalPages.value) {
          ElMessage.warning('页码超出范围')
          return
        }
        currentPage.value = page
      } catch (error) {
        console.error('跳转页面失败:', error)
        ElMessage.error('跳转失败，请重试')
      }
    }

    const nextPage = () => {
      if (hasNextPage.value) {
        goToPage(currentPage.value + 1)
      }
    }

    const prevPage = () => {
      if (hasPrevPage.value) {
        goToPage(currentPage.value - 1)
      }
    }

    return { goToArticle, goToPage, nextPage, prevPage }
  }

  const { goToArticle, goToPage, nextPage, prevPage } = createNavigationHandler()

  // 数据加载相关
  const createDataLoader = () => {
    const initArticles = async (forceRefresh = false) => {
      try {
        store.subscribe(componentId)
        await store.fetchArticles(forceRefresh)
        isInitialized.value = true
        retryCount.value = 0
      } catch (error) {
        console.error('初始化文章数据失败:', error)
        retryCount.value++

        if (retryCount.value <= maxRetries) {
          ElMessage.warning(`加载失败，正在重试 (${retryCount.value}/${maxRetries})`)
          setTimeout(() => initArticles(forceRefresh), 1000 * retryCount.value)
        } else {
          ElMessage.error('加载文章数据失败，请刷新页面重试')
        }
      }
    }

    const refreshArticles = async () => {
      try {
        await store.fetchArticles(true)
        ElMessage.success('刷新成功')
      } catch (error) {
        console.error('刷新文章数据失败:', error)
        ElMessage.error('刷新失败，请重试')
      }
    }

    const retryLoad = () => {
      retryCount.value = 0
      initArticles(true)
    }

    return { initArticles, refreshArticles, retryLoad }
  }

  const { initArticles, refreshArticles, retryLoad } = createDataLoader()

  // 生命周期管理
  const cleanup = () => {
    try {
      store.unsubscribe(componentId)
    } catch (error) {
      if (import.meta.env?.DEV) console.warn('清理订阅失败:', error)
    }
  }

  // 自动初始化
  if (autoInit) {
    initArticles()
  }

  // 设置分页监听器
  const stopPaginationWatcher = setupPaginationWatcher()

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
    stopPaginationWatcher()
  })

  return {
    // 数据状态
    articles,
    loading,
    error,
    total,
    tagslist,
    pagedArticles,
    isInitialized,

    // 分页状态
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage,
    totalPages,

    // 数据操作方法
    initArticles,
    refreshArticles,
    retryLoad,
    cleanup,

    // 导航方法
    goToArticle,
    goToPage,
    nextPage,
    prevPage,

    // 工具方法
    watchPagination: setupPaginationWatcher,
  }
}
