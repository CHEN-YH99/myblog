import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArticlesStore } from '@/stores/getarticles'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { nanoid } from 'nanoid' // 或使用其他 ID 生成器

/**
 * 文章相关的组合式函数
 * 用于管理文章列表的加载、分页、状态等逻辑
 */
export function useArticles(routeName?: string) {
  const store = useArticlesStore() // 获取文章状态管理实例
  const componentId = nanoid() // 生成唯一组件 ID
  const router = useRouter()
  const route = useRoute()
  
  // 根据路由名称生成唯一的存储键
  const routeKey = routeName ?? (route.name != null ? String(route.name) : undefined)
  const storageKey = `pagination_${routeKey || 'default'}`
  
  // 从localStorage恢复分页状态
  const getSavedPagination = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : { currentPage: 1, pageSize: 5 }
    } catch {
      return { currentPage: 1, pageSize: 5 }
    }
  }
  
  // 保存分页状态到localStorage
  const savePagination = (page: number, size: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ currentPage: page, pageSize: size }))
    } catch {
      // 忽略存储错误
    }
  }
  
  const savedPagination = getSavedPagination()
  
  // 分页状态
  const currentPage = ref(savedPagination.currentPage)
  const pageSize = ref(savedPagination.pageSize)
  
  // 计算属性
  const articles = computed(() => store.articles)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const total = computed(() => store.articlesCount)
  const tagslist = computed(() => store.tagslist)
  
  const pagedArticles = computed(() => 
    store.getPagedArticles(currentPage.value, pageSize.value)
  )
  
  // 监听分页变化并保存状态
  const watchPagination = () => {
    // 监听currentPage变化
    const stopWatchPage = watch(currentPage, (newPage) => {
      savePagination(newPage, pageSize.value)
    })
    
    // 监听pageSize变化
    const stopWatchSize = watch(pageSize, (newSize) => {
      savePagination(currentPage.value, newSize)
    })
    
    return () => {
      stopWatchPage()
      stopWatchSize()
    }
  }
  
  // 跳转到文章详情页
  const goToArticle = (article: { _id: string; title: string }) => {
    // 检查登录状态
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再查看文章详情')
      router.push({
        path: '/login',
        query: { redirect: `/article/${article._id}` }
      })
      return
    }
    
    // 保存当前分页状态
    savePagination(currentPage.value, pageSize.value)
    // 跳转到文章详情页
    router.push(`/article/${article._id}`)
  }
  
  // 初始化数据
  const initArticles = async (forceRefresh = false) => {
    try {
      store.subscribe(componentId)
      await store.fetchArticles(forceRefresh)
      // 不重置分页，保持用户的分页状态
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
    refreshArticles: () => store.fetchArticles(true),
    goToArticle,
    watchPagination
  }
}

