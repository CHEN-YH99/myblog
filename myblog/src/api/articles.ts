import request from '@/utils/http'
import http from '@/utils/http'

type ArticleView = Api.Article.ArticleItem & {
  cover?: string
}

/**
 * 获取文章列表
 * @param params 查询参数
 * @returns 文章列表
 */
export function getAllArticles(params?: Api.Article.SearchParams) {
  console.log('前台调用getAllArticles API，参数:', params)
  
  return request.get<Api.Article.ArticleItem[] | { articles: Api.Article.ArticleItem[]; total: number; currentPage: number; pageSize: number}>({
    url: '/api/articles',
    params,
    showErrorMessage: true
  }).then((data) => {
    console.log('前台getAllArticles处理后的响应:', data)
    
    if (data && typeof data === 'object') {
      // 如果直接是数组格式
      if (Array.isArray(data)) {
        console.log('前台收到数组格式文章数据:', data.length)
        return data
      }
      // 如果是分页响应格式 {articles: [...], total: ...}
      if ('articles' in data && Array.isArray((data as any).articles)) {
        const articles = (data as any).articles as Api.Article.ArticleItem[]
        console.log('前台收到articles格式文章数据:', articles.length)
        return articles
      }
    }
    
    console.warn('前台无法识别的文章响应格式:', data)
    return []
  }).catch(error => {
    console.error('前台获取文章失败:', error)
    throw error
  })
}

/**
 * 根据ID或slug获取文章详情
 * @param idOrSlug 文章ID或slug
 * @returns 文章详情
 */
export function getArticle(idOrSlug: string) {
  return request.get<Api.Article.ArticleItem>({
    url: `/api/articles/${idOrSlug}`,
    showErrorMessage: true
  })
}

/**
 * 创建文章
 * @param payload 文章数据
 * @returns 创建的文章
 */
export function createArticle(payload: Api.Article.CreateParams) {
  return request.post<Api.Article.ArticleItem>({
    url: '/api/articles',
    data: payload,
    showSuccessMessage: true,
    showErrorMessage: true
  })
}

/**
 * 更新文章
 * @param id 文章ID
 * @param payload 更新数据
 * @returns 更新后的文章
 */
export function updateArticle(id: string, payload: Api.Article.UpdateParams) {
  return request.put<Api.Article.ArticleItem>({
    url: `/api/articles/${id}`,
    data: payload,
    showSuccessMessage: true,
    showErrorMessage: true
  })
}

/**
 * 删除文章
 * @param id 文章ID
 * @returns 删除结果
 */
export function deleteArticle(id: string) {
  return request.del<void>({
    url: `/api/articles/${id}`,
    showSuccessMessage: true,
    showErrorMessage: true
  })
}

/**
 * 上传图片
 * @param file 图片文件
 * @returns 图片URL
 */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<Api.Article.UploadResponse>({
    url: '/api/uploads',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    showErrorMessage: true
  })
}

// ==================== 点赞功能 ====================

/**
 * 点赞文章
 * @param articleId 文章ID
 * @returns 点赞结果
 */
export function likeArticle(articleId: string) {
  return request.post<Api.Article.LikeResponse>({
    url: `/api/articles/${articleId}/like`,
    showErrorMessage: true
  })
}

/**
 * 取消点赞
 * @param articleId 文章ID
 * @returns 取消点赞结果
 */
export function unlikeArticle(articleId: string) {
  return request.post<Api.Article.LikeResponse>({
    url: `/api/articles/${articleId}/unlike`,
    showErrorMessage: true
  })
}

/**
 * 获取文章点赞状态
 * @param articleId 文章ID
 * @returns 点赞状态
 */
export function getLikeStatus(articleId: string) {
  return request.get<Api.Article.LikeStatusResponse>({
    url: `/api/articles/${articleId}/like-status`,
    showErrorMessage: false // 静默获取，不显示错误
  })
}

/**
 * 批量获取文章点赞状态
 * @param articleIds 文章ID数组
 * @returns 批量点赞状态
 */
export function getBatchLikeStatus(articleIds: string[]) {
  return request.post<Api.Article.BatchLikeStatusResponse>({
    url: '/api/articles/batch-like-status',
    data: { articleIds },
    showErrorMessage: false
  })
}

/**
 * 获取文章点赞数
 * @param articleId 文章ID
 * @returns 点赞数
 */
export function getArticleLikes(articleId: string) {
  return request.get<Api.Article.LikeCountResponse>({
    url: `/api/articles/${articleId}/likes`,
    showErrorMessage: false
  })
}

/**
 * 获取用户已点赞的文章列表
 * @returns 用户已点赞的文章列表
 */
export function getUserLikedArticles() {
  return request.get<Api.Article.ArticleItem[]>({
    url: '/api/user/liked-articles',
    showErrorMessage: false
  })
}

// ==================== 统计功能 ====================

/**
 * 增加文章浏览量
 * @param articleId 文章ID
 * @returns 浏览量结果
 */
export function incrementViews(articleId: string) {
  return request.post<Api.Article.ViewsResponse>({
    url: `/api/articles/${articleId}/views`,
    showErrorMessage: false // 静默操作
  })
}

/**
 * 获取热门文章
 * @param limit 数量限制
 * @returns 热门文章列表
 */
export function getPopularArticles(limit: number = 10) {
  return request.get<Api.Article.ArticleItem[]>({
    url: '/api/articles/popular',
    params: { limit },
    showErrorMessage: true
  })
}

/**
 * 获取相关文章
 * @param articleId 当前文章ID
 * @param limit 数量限制
 * @returns 相关文章列表
 */
export function getRelatedArticles(articleId: string, limit: number = 5) {
  return request.get<Api.Article.ArticleItem[]>({
    url: `/api/articles/${articleId}/related`,
    params: { limit },
    showErrorMessage: false
  })
}

// ==================== 分类和标签 ====================

/**
 * 获取所有分类
 * @param params 查询参数
 * @returns 分类列表
 */
export function getCategories(params?: Api.Article.CategorySearchParams) {
  console.log('前台调用getCategories API，参数:', params)
  
  return request.get<Api.Article.CategoryListResponse | Api.Article.CategoryItem[]>({
    url: '/api/categories',
    params,
    showErrorMessage: true
  }).then((data) => {
    console.log('前台getCategories处理后的响应:', data)
    
    if (data && typeof data === 'object') {
      // 如果直接是数组格式
      if (Array.isArray(data)) {
        console.log('前台收到数组格式分类数据:', data.length)
        return data.filter((cat: any) => cat.status === 'active')
      }
      // 如果是分页响应格式 {categories: [...], total: ...}
      if ('categories' in data && Array.isArray((data as any).categories)) {
        const categories = (data as any).categories as Api.Article.CategoryItem[]
        console.log('前台收到categories格式分类数据:', categories.length)
        return categories.filter((cat) => cat.status === 'active')
      }
    }
    
    console.warn('前台无法识别的分类响应格式:', data)
    return []
  }).catch(error => {
    console.error('前台获取分类失败:', error)
    throw error
  })
}

/**
 * 根据ID获取分类详情
 * @param id 分类ID
 * @returns 分类详情
 */
export function getCategoryDetail(id: string) {
  return request.get<Api.Article.CategoryItem>({
    url: `/api/categories/${id}`,
    showErrorMessage: true
  })
}

/**
 * 根据分类获取文章
 * @param category 分类名称或slug
 * @param params 其他查询参数
 * @returns 文章列表
 */
export function getArticlesByCategory(category: string, params?: Api.Article.SearchParams) {
  console.log('前台调用getArticlesByCategory API，分类:', category, '参数:', params)
  
  return request.get<Api.Article.ArticleItem[] | { articles: Api.Article.ArticleItem[]; total: number; currentPage: number; pageSize: number}>({
    url: '/api/articles',
    params: { ...params, category },
    showErrorMessage: true
  }).then((data) => {
    console.log('前台getArticlesByCategory处理后的响应:', data)
    
    if (data && typeof data === 'object') {
      // 直接是数组格式
      if (Array.isArray(data)) {
        return data
      }
      // 如果是分页响应格式 {articles: [...], total: ...}
      if ('articles' in data && Array.isArray((data as any).articles)) {
        return (data as any).articles as Api.Article.ArticleItem[]
      }
    }
    
    return []
  }).catch(error => {
    console.error('前台根据分类获取文章失败:', error)
    throw error
  })
}

/**
 * 获取所有标签
 * @returns 标签列表
 */
export function getTags() {
  return request.get<Api.Article.TagItem[]>({
    url: '/api/tags',
    showErrorMessage: true
  })
}



/**
 * 根据标签获取文章
 * @param tag 标签名称
 * @param params 其他查询参数
 * @returns 文章列表
 */
export function getArticlesByTag(tag: string, params?: Api.Article.SearchParams) {
  return request.get<Api.Article.ArticleItem[]>({
    url: '/api/articles',
    params: { ...params, tag },
    showErrorMessage: true
  })
}

// ==================== 搜索功能 ====================

/**
 * 搜索文章
 * @param keyword 搜索关键词
 * @param params 其他查询参数
 * @returns 搜索结果
 */
export function searchArticles(keyword: string, params?: Api.Article.SearchParams) {
  return request.get<Api.Article.SearchResponse>({
    url: '/api/articles/search',
    params: { ...params, keyword },
    showErrorMessage: true
  })
}

/**
 * 获取搜索建议
 * @param keyword 关键词
 * @returns 搜索建议列表
 */
export function getSearchSuggestions(keyword: string) {
  return request.get<Api.Article.SuggestionItem[]>({
    url: '/api/articles/search/suggestions',
    params: { keyword },
    showErrorMessage: false
  })
}

export const getAllArticlesWithSignal = async (options?: { signal?: AbortSignal }): Promise<ArticleView[]> => {
  try {
    // console.log('开始获取文章数据...')
    const response = await http.get<{articles: ArticleView[], total: number, currentPage: number, pageSize: number}>({ url: '/api/articles', signal: options?.signal })
    // console.log('获取文章数据成功:', response)
    // response 已经是 request 函数处理后的 data 部分，即 {articles: [...], total: ..., currentPage: ..., pageSize: ...}
    // 检查 response 是否存在且有 articles 属性
    if (response && typeof response === 'object' && 'articles' in response) {
      return response.articles || []
    }
    // 如果 response 直接是数组（兼容性处理）
    if (Array.isArray(response)) {
      return response
    }
    return []
  } catch (error) {
    console.error('获取文章数据失败:', error)
    throw error
  }
}
