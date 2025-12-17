import api from '@/utils/http'

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
const MAX_CACHE_SIZE = 100 // 最大缓存条目数
const CLEANUP_INTERVAL = 2 * 60 * 1000 // 清理间隔 2分钟

const cache = new Map<string, { data: any; timestamp: number; ttl?: number }>()

// 缓存清理定时器ID
let cleanupTimerId: ReturnType<typeof setInterval> | null = null

// 缓存工具函数
function stableStringify(value: any): string {
  if (value === null || value === undefined) return String(value)
  if (typeof value !== 'object') return JSON.stringify(value)
  if (value instanceof Date) return `"${value.toISOString()}"`
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort()
  const entries = keys.map((k) => `"${k}":${stableStringify(value[k])}`)
  return `{${entries.join(',')}}`
}

function getCacheKey(url: string, params?: Record<string, unknown>): string {
  // 递归稳定序列化参数，忽略 undefined，排序 key，确保相同语义不同顺序的参数命中同一缓存
  if (!params || Object.keys(params).every((k) => (params as any)[k] === undefined)) return url
  return `${url}?${stableStringify(params)}`
}

function getFromCache<T>(key: string, ttl?: number): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  const cacheTTL = ttl ?? cached.ttl ?? CACHE_DURATION
  if (Date.now() - cached.timestamp < cacheTTL) {
    return cached.data as T
  }
  
  cache.delete(key)
  return null
}

function setCache(key: string, data: any, ttl?: number): void {
  // 检查缓存大小，如果超过限制则清理最旧的条目
  if (cache.size >= MAX_CACHE_SIZE) {
    // 找到最旧的条目并删除
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    
    for (const [k, v] of cache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp
        oldestKey = k
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }
  
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

// 启动缓存清理定时器
function startCacheCleanup(): void {
  if (cleanupTimerId !== null) {
    return // 已经启动，避免重复
  }
  
  cleanupTimerId = setInterval(() => {
    const now = Date.now()
    let cleanedCount = 0
    
    // 根据每个缓存项的 TTL 清理过期项
    for (const [key, value] of cache.entries()) {
      const ttl = value.ttl ?? CACHE_DURATION
      if (now - value.timestamp > ttl) {
        cache.delete(key)
        cleanedCount++
      }
    }
    
    // 如果缓存仍然超过限制，继续清理最旧的条目
    if (cache.size > MAX_CACHE_SIZE) {
      const entriesToRemove = cache.size - MAX_CACHE_SIZE
      const entries = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
        cache.delete(entries[i][0])
      }
    }
  }, CLEANUP_INTERVAL)
}

// 停止缓存清理定时器
function stopCacheCleanup(): void {
  if (cleanupTimerId !== null) {
    clearInterval(cleanupTimerId)
    cleanupTimerId = null
  }
}

// 清除所有缓存
function clearAllCache(): void {
  cache.clear()
}

// 初始化时启动清理定时器
startCacheCleanup()

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return withRetry(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

/**
 * 获取文章列表
 * @param params 查询参数
 * @returns 文章列表
 */
export function getAllArticles(params?: Api.Article.SearchParams) {
  const cacheKey = getCacheKey('/api/articles', params as Record<string, unknown>)
  const cached = getFromCache<Api.Article.ArticleItem[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return withRetry(() =>
    api
      .get({ url: '/api/articles', params, showErrorMessage: false })
      .then((response) => {
        const data = response

        let articles: Api.Article.ArticleItem[] = []
        if (Array.isArray(data)) {
          articles = data
        } else if (data && typeof data === 'object' && 'articles' in data) {
          articles = (data as Record<string, unknown>).articles as Api.Article.ArticleItem[]
        }

        // 缓存结果
        setCache(cacheKey, articles as unknown as Record<string, unknown>)
        return articles
      })
      .catch((error) => {
        const msg = String(error?.message || '')
        if (error?.isCanceled || error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || msg.toLowerCase().includes('canceled') || msg.includes('已取消')) {
          console.debug('[API] 获取文章列表请求已取消')
          return []
        }
        console.error('前台获取文章失败:', error)
        // 返回空数组而不是抛出错误，提供降级体验
        return []
      }),
  )
}

/**
 * 根据ID或slug获取文章详情
 * @param idOrSlug 文章ID或slug
 * @returns 文章详情
 */
export function getArticle(idOrSlug: string) {
  const cacheKey = getCacheKey(`/api/articles/${idOrSlug}`)
  const cached = getFromCache<Api.Article.ArticleItem>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return withRetry(() =>
    api
      .get<Api.Article.ArticleItem>({
        url: `/api/articles/${idOrSlug}`,
        showErrorMessage: true,
      })
      .then((article) => {
        // 缓存文章详情
        setCache(cacheKey, article as unknown as Record<string, unknown>)
        return article
      }),
  )
}

/**
 * 创建文章
 * @param payload 文章数据
 * @returns 创建的文章
 */
export function createArticle(payload: Api.Article.CreateParams) {
  return api
    .post<Api.Article.ArticleItem>({
      url: '/api/articles',
      data: payload,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then((article) => {
      // 清除相关缓存
      clearArticleCache()
      return article
    })
}

/**
 * 更新文章
 * @param id 文章ID
 * @param payload 更新数据
 * @returns 更新后的文章
 */
export function updateArticle(id: string, payload: Api.Article.UpdateParams) {
  return api
    .put<Api.Article.ArticleItem>({
      url: `/api/articles/${id}`,
      data: payload,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then((article) => {
      // 清除相关缓存
      clearArticleCache()
      return article
    })
}

/**
 * 删除文章
 * @param id 文章ID
 * @returns 删除结果
 */
export function deleteArticle(id: string) {
  return api
    .del<void>({
      url: `/api/articles/${id}`,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then((result) => {
      // 清除相关缓存
      clearArticleCache()
      return result
    })
}

// 清除文章相关缓存
function clearArticleCache() {
  for (const key of cache.keys()) {
    if (key.includes('/api/articles')) {
      cache.delete(key)
    }
  }
}

/**
 * 上传图片
 * @param file 图片文件
 * @returns 图片URL
 */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return withRetry(() =>
    api.post<Api.Article.UploadResponse>({
      url: '/api/uploads',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      showSuccessMessage: true,
      showErrorMessage: true,
    }),
  )
}

/**
 * 点赞文章
 * @param articleId 文章ID
 * @returns 点赞结果
 */
export function likeArticle(articleId: string) {
  return api
    .post<Api.Article.LikeResponse>({
      url: `/api/articles/${articleId}/like`,
      data: {},
      showErrorMessage: true,
    })
    .then((result) => {
      // 清除相关缓存
      cache.delete(getCacheKey(`/api/articles/${articleId}`))
      return result
    })
}

/**
 * 取消点赞文章
 * @param articleId 文章ID
 * @returns 取消点赞结果
 */
export function unlikeArticle(articleId: string) {
  // 服务端定义为 POST /api/articles/:id/unlike（不是 DELETE /like）
  return api
    .post<Api.Article.LikeResponse>({
      url: `/api/articles/${articleId}/unlike`,
      data: {},
      showErrorMessage: true,
    })
    .then((result) => {
      // 清除相关缓存
      cache.delete(getCacheKey(`/api/articles/${articleId}`))
      return result
    })
}

/**
 * 获取文章点赞状态
 * @param articleId 文章ID
 * @returns 点赞状态
 */
export function getLikeStatus(articleId: string) {
  return api.get<Api.Article.LikeStatusResponse>({
    url: `/api/articles/${articleId}/like-status`,
  })
}

/**
 * 批量获取文章点赞状态
 * @param articleIds 文章ID数组
 * @returns 点赞状态列表
 */
export function getBatchLikeStatus(articleIds: string[]) {
  return api.post<Api.Article.BatchLikeStatusResponse>({
    url: '/api/articles/batch-like-status',
    data: { articleIds },
  })
}

/**
 * 获取文章点赞数
 * @param articleId 文章ID
 * @returns 点赞数
 */
export function getArticleLikes(articleId: string) {
  return api.get<Api.Article.LikeResponse>({
    url: `/api/articles/${articleId}/likes`,
  })
}

/**
 * 获取用户点赞的文章列表
 * @returns 用户点赞的文章列表
 */
export function getUserLikedArticles() {
  return api.get<Api.Article.ArticleItem[]>({
    url: '/api/user/liked-articles',
  })
}

/**
 * 增加文章浏览量
 * @param articleId 文章ID
 * @returns 增加浏览量结果
 */
export function incrementViews(articleId: string) {
  return api
    .post<Api.Article.ViewsResponse>({
      url: `/api/articles/${articleId}/views`,
      showErrorMessage: false, // 浏览量统计失败不显示错误
    })
    .catch(() => {
      // 静默处理浏览量统计失败
      return { views: 0 }
    })
}

/**
 * 获取热门文章
 * @param limit 限制数量
 * @returns 热门文章列表
 */
export function getPopularArticles(limit: number = 10) {
  const cacheKey = getCacheKey('/api/articles/popular', { limit })
  const cached = getFromCache<Api.Article.ArticleItem[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get<Api.Article.ArticleItem[]>({
      url: '/api/articles/popular',
      params: { limit },
    })
    .then((articles) => {
      setCache(cacheKey, articles as unknown as Record<string, unknown>)
      return articles
    })
    .catch(() => []) // 降级处理
}

/**
 * 获取相关文章
 * @param articleId 文章ID
 * @param limit 限制数量
 * @returns 相关文章列表
 */
export function getRelatedArticles(articleId: string, limit: number = 5) {
  const cacheKey = getCacheKey(`/api/articles/${articleId}/related`, { limit })
  const cached = getFromCache<Api.Article.ArticleItem[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get<Api.Article.ArticleItem[]>({
      url: `/api/articles/${articleId}/related`,
      params: { limit },
    })
    .then((articles) => {
      setCache(cacheKey, articles as unknown as Record<string, unknown>)
      return articles
    })
    .catch(() => []) // 降级处理
}

/**
 * 获取分类列表
 * @param params 查询参数
 * @returns 分类列表
 */
export function getCategories(params?: Api.Article.CategorySearchParams) {
  const cacheKey = getCacheKey('/api/categories', params as unknown as Record<string, unknown>)
  
  // 当请求显式要求仅获取启用分类时，为保证与后台管理状态同步，使用较短的缓存时间
  const shouldSkipCache = params?.status === 'active'
  const cacheTTL = shouldSkipCache ? 30 * 1000 : CACHE_DURATION // 启用分类用30秒缓存，其他用默认5分钟
  
  const cached = getFromCache<Api.Article.CategoryItem[]>(cacheKey, cacheTTL)
  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get({ url: '/api/categories', params })
    .then((response) => {
      let categories: any[] = []

      if (Array.isArray(response)) {
        categories = response
      } else if (response && typeof response === 'object' && 'categories' in response) {
        categories = (response as Record<string, unknown>).categories as any[]
      }

      // 统一映射：visible/isVisible -> status
      const mapped = categories.map((item) => {
        const visibleLike = typeof item?.visible === 'boolean' ? item.visible
          : (typeof item?.isVisible === 'boolean' ? item.isVisible : undefined)
        const status = item?.status ?? (visibleLike === false ? 'inactive' : 'active')
        return {
          ...item,
          status
        } as Api.Article.CategoryItem
      })

      // 如果入参要求仅返回启用分类，则在前端再做一次兜底过滤
      const finalList = params?.status === 'active' ? mapped.filter((c) => c.status === 'active') : mapped

      setCache(cacheKey, finalList as unknown as Record<string, unknown>, cacheTTL)
      return finalList
    })
    .catch(() => []) // 降级处理
}

/**
 * 获取分类详情
 * @param id 分类ID
 * @returns 分类详情
 */
export function getCategoryDetail(id: string) {
  const cacheKey = getCacheKey(`/api/categories/${id}`)
  const cached = getFromCache<Api.Article.CategoryItem>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get<Api.Article.CategoryItem>({
      url: `/api/categories/${id}`,
    })
    .then((category) => {
      setCache(cacheKey, category as unknown as Record<string, unknown>)
      return category
    })
}

/**
 * 根据分类获取文章
 * @param categoryId 分类ID
 * @param params 查询参数
 * @returns 文章列表
 */
export function getArticlesByCategory(categoryId: string, params?: Api.Article.SearchParams) {
  const cacheKey = getCacheKey(
    `/api/categories/${categoryId}/articles`,
    params as Record<string, unknown>,
  )

  const cached = getFromCache<Api.Article.ArticleItem[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get({ url: `/api/categories/${categoryId}/articles`, params })
    .then((response) => {
      let articles: Api.Article.ArticleItem[] = []

      if (Array.isArray(response)) {
        articles = response
      } else if (response && typeof response === 'object' && 'articles' in response) {
        articles = (response as Record<string, unknown>).articles as Api.Article.ArticleItem[]
      }

      setCache(cacheKey, articles as unknown as Record<string, unknown>)
      return articles
    })
    .catch(() => []) // 降级处理
}

/**
 * 获取标签列表
 * @returns 标签列表
 */
export function getTags() {
  const cacheKey = getCacheKey('/api/tags')
  const cached = getFromCache<string[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get<string[]>({
      url: '/api/tags',
    })
    .then((tags) => {
      setCache(cacheKey, tags as unknown as Record<string, unknown>)
      return tags
    })
    .catch(() => []) // 降级处理
}

/**
 * 根据标签获取文章
 * @param tag 标签名
 * @param params 查询参数
 * @returns 文章列表
 */
export function getArticlesByTag(tag: string, params?: Api.Article.SearchParams) {
  const cacheKey = getCacheKey(`/api/tags/${tag}/articles`, params as unknown as Record<string, unknown>)
  const cached = getFromCache<Api.Article.ArticleItem[]>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return api
    .get({ url: `/api/tags/${tag}/articles`, params })
    .then((articles) => {
      setCache(cacheKey, articles as Record<string, unknown>)
      return articles
    })
    .catch(() => []) // 降级处理
}

/**
 * 搜索文章
 * @param keyword 关键词
 * @param params 查询参数
 * @returns 搜索结果
 */
export function searchArticles(keyword: string, params?: Api.Article.SearchParams) {
  // 搜索结果不缓存，保证实时性
  return api
    .get<Api.Article.ArticleItem[]>({
      url: '/api/articles/search',
      params: { keyword, ...params },
    })
    .catch(() => []) // 降级处理
}

/**
 * 获取搜索建议
 * @param keyword 关键词
 * @returns 搜索建议
 */
export function getSearchSuggestions(keyword: string) {
  return api
    .get<string[]>({
      url: '/api/articles/search-suggestions',
      params: { keyword },
    })
    .catch(() => []) // 降级处理
}

export function getAllArticlesWithSignal(signal?: AbortSignal, params?: Api.Article.SearchParams) {
  return api
    .get({
      url: '/api/articles',
      params,
      signal, // 支持取消请求
      showErrorMessage: false, // 取消或失败不弹窗，由调用方决定
    })
    .then((response) => {
      const data = response

      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'articles' in data) {
        const articles = (data as Record<string, unknown>).articles as Api.Article.ArticleItem[]
        return articles
      } else {
        return []
      }
    })
    .catch((error) => {
      // 检查是否是取消的请求
      const msg = String(error?.message || '')
      if (error?.isCanceled || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || msg.toLowerCase().includes('canceled') || msg.includes('已取消')) {
        console.debug('[API] 文章数据请求已取消')
        // 返回空数组而不是抛出错误，避免错误传播
        return []
      }
      console.error('前台获取文章失败:', error)
      return [] // 降级处理
    })
}

/**
 * 清理缓存和定时器（应在应用卸载时调用）
 * 用于防止内存泄漏
 */
export function cleanupCache(): void {
  stopCacheCleanup()
  clearAllCache()
}
