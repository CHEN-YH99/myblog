import { ref, reactive, computed } from 'vue'
import { debounce } from '@/utils/debounce'

// 通用缓存新鲜度管理
export function useCache(timeoutMs: number) {
  const lastFetchTime = ref(0)
  const isDataFresh = computed(() => Date.now() - lastFetchTime.value < timeoutMs)
  const touch = () => {
    lastFetchTime.value = Date.now()
  }
  return { lastFetchTime, isDataFresh, touch }
}

// 通用分页状态
export function usePagination(initial?: { current?: number; size?: number; total?: number }) {
  const pagination = reactive({
    current: initial?.current ?? 1,
    size: initial?.size ?? 10,
    total: initial?.total ?? 0,
  })
  const setCurrent = (c: number) => (pagination.current = Math.max(1, Number(c) || 1))
  const setSize = (s: number) => (pagination.size = Math.max(1, Number(s) || 1))
  const setTotal = (t: number) => (pagination.total = Math.max(0, Number(t) || 0))
  return { pagination, setCurrent, setSize, setTotal }
}

// 通用本地存储分页持久化（与 useArticles 原逻辑一致）
export function createPaginationManager(storageKey: string, defaultPageSize = 5) {
  const getSavedPagination = (): { currentPage: number; pageSize: number } => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : { currentPage: 1, pageSize: defaultPageSize }
    } catch {
      return { currentPage: 1, pageSize: defaultPageSize }
    }
  }

  const savePagination = debounce((page: number, size: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ currentPage: page, pageSize: size }))
    } catch {
      // ignore
    }
  }, 100)

  return { getSavedPagination, savePagination }
}

