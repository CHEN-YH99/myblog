import api from '@/utils/http'

type ArticleView = Api.Article.ArticleItem & {
  cover?: string
}

/**
 * 获取文章列表
 * @param params 查询参数
 * @returns 文章列表
 */
export function getAllArticles(params?: Api.Article.SearchParams) {
  return api.get({ url: '/api/articles', params })
    .then(response => {
      const data = response
      
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'articles' in data) {
        const articles = (data as any).articles
        return articles
      } else {
        return []
      }
    })
    .catch(error => {
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
  return api.get<Api.Article.ArticleItem>({
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
  return api.post<Api.Article.ArticleItem>({
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
  return api.put<Api.Article.ArticleItem>({
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
  return api.del<void>({
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
  
  return api.post<Api.Article.UploadResponse>({
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
  return api.post<Api.Article.LikeResponse>({
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
  return api.post<Api.Article.LikeResponse>({
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
  return api.get<Api.Article.LikeStatusResponse>({
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
  return api.post<Api.Article.BatchLikeStatusResponse>({
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
  return api.get<Api.Article.LikeCountResponse>({
    url: `/api/articles/${articleId}/likes`,
    showErrorMessage: false
  })
}

/**
 * 获取用户已点赞的文章列表
 * @returns 用户已点赞的文章列表
 */
export function getUserLikedArticles() {
  return api.get<Api.Article.ArticleItem[]>({
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
  return api.post<Api.Article.ViewsResponse>({
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
  return api.get<Api.Article.ArticleItem[]>({
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
  return api.get<Api.Article.ArticleItem[]>({
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
  return api.get({ url: '/api/categories', params })
    .then(response => {
      const data = response
      
      if (Array.isArray(data)) {
        return data.filter((cat: any) => cat.status === 'active')
      } else if (data && typeof data === 'object' && 'categories' in data) {
        const categories = (data as any).categories
        return categories.filter((cat) => cat.status === 'active')
      } else {
        return []
      }
    })
    .catch(error => {
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
  return api.get<Api.Article.CategoryItem>({
    url: `/api/categories/${id}`,
    showErrorMessage: true
  })
}

/**
 * 根据分类获取文章
 * @param categoryId 分类ID
 * @param params 其他查询参数
 * @returns 文章列表
 */
export function getArticlesByCategory(categoryId: string, params?: Api.Article.SearchParams) {
  return api.get({ url: `/api/articles/category/${categoryId}`, params })
    .then(response => {
      const data = response
      
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'articles' in data) {
        const articles = (data as any).articles
        return articles
      } else {
        return []
      }
    })
    .catch(error => {
      console.error(`前台获取分类${categoryId}文章失败:`, error)
      throw error
    })
}

/**
 * 获取所有标签
 * @returns 标签列表
 */
export function getTags() {
  return api.get<Api.Article.TagItem[]>({
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
  return api.get<Api.Article.ArticleItem[]>({
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
  return api.get<Api.Article.SearchResponse>({
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
  return api.get<Api.Article.SuggestionItem[]>({
    url: '/api/articles/search/suggestions',
    params: { keyword },
    showErrorMessage: false
  })
}

export function getAllArticlesWithSignal(signal?: AbortSignal, params?: Api.Article.SearchParams) {
  return api.get({ url: '/api/articles', params, signal })
    .then(response => {
      const data = response
      
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'articles' in data) {
        return (data as any).articles
      } else {
        return []
      }
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        throw error
      }
      console.error('前台获取文章失败:', error)
      throw error
    })
}
