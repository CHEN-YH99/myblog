import request from '@/utils/request'

// 文章相关接口类型定义
export interface ArticleItem {
  _id: string
  id?: string
  title: string
  slug?: string
  content: string
  contentFormat?: 'markdown' | 'html'
  contentHtml?: string
  toc?: Array<{ id: string; text: string; level: number }>
  author: string
  category?: string
  tags: string[]
  publishDate: string
  updateDate: string
  likes: number
  views: number
  excerpt?: string
  image?: string
  home_img?: string
  brief?: string
  type_name?: string
  blog_class?: string
  count?: number
  create_time?: string
  html_content?: string
  isTop?: boolean
  visible?: boolean
}

export interface ArticleListResponse {
  code: number
  msg: string
  data: ArticleItem[]
  total?: number
  currentPage?: number
  pageSize?: number
}

export interface CreateArticleParams {
  title: string
  content: string
  author: string
  category?: string
  tags: string[]
  excerpt?: string
  image?: string
  slug?: string
  isTop?: boolean
  visible?: boolean
}

export interface UpdateArticleParams extends Partial<CreateArticleParams> {
  _id?: string
}

export interface SearchParams {
  page?: number
  size?: number
  searchVal?: string
  year?: string
  tag?: string
  category?: string
  limit?: number
  offset?: number
}

/**
 * 获取文章列表
 */
export function getArticleList(params?: SearchParams) {
  // 确保参数正确传递，特别是年份参数
  const queryParams = {
    ...params,
    // 确保年份参数正确传递
    ...(params?.year && params.year !== '全部' && { year: params.year })
  }

  return request
    .get({
      url: `/api/articles`,
      params: queryParams
    })
    .then((res: any) => {
      // 处理统一API响应格式
      if (res && res.data) {
        return res.data
      }
      return res
    })
}

/**
 * 获取文章详情（后台管理专用，不增加浏览量）
 */
export function getArticleDetail(idOrSlug: string) {
  console.log(`📱 后台管理调用 getArticleDetail: ${idOrSlug}`)
  console.log('🔑 使用专用后台接口，不增加浏览量')

  return request
    .get({
      url: `/api/admin/articles/${idOrSlug}` // 使用专用后台接口
    })
    .then((res: any) => {
      console.log(`✅ 后台管理获取文章详情成功: ${idOrSlug}`)
      return res && res.data ? res.data : res
    })
    .catch((error) => {
      console.error(`❌ 后台管理获取文章详情失败: ${idOrSlug}`, error)
      throw error
    })
}

/**
 * 创建文章
 */
export function createArticle(data: CreateArticleParams) {
  return request
    .post({
      url: `/api/articles`,
      data
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 更新文章
 */
export function updateArticle(id: string, data: UpdateArticleParams) {
  console.log('🔄 前端调用updateArticle:', {
    id,
    data,
    isTop: data.isTop,
    isTopType: typeof data.isTop
  })
  
  return request.put({
    url: `/api/articles/${id}`,
    data
  }).then((res: any) => {
    console.log('✅ updateArticle响应:', res)
    return res
  }).catch((error) => {
    console.error('❌ updateArticle失败:', error)
    throw error
  })
}

/**
 * 删除文章
 */
export function deleteArticle(id: string) {
  return request.del({
    url: `/api/articles/${id}`
  })
}

/**
 * 点赞文章
 */
export function likeArticle(id: string) {
  return request.post({
    url: `/api/articles/${id}/like`
  })
}

/**
 * 取消点赞
 */
export function unlikeArticle(id: string) {
  return request.post({
    url: `/api/articles/${id}/unlike`
  })
}

/**
 * 获取热门文章
 */
export function getPopularArticles(limit: number = 10) {
  return request.get({
    url: `/api/articles/popular`,
    params: { limit }
  })
}

/**
 * 搜索文章
 */
export function searchArticles(keyword: string, params?: SearchParams) {
  return request.get({
    url: `/api/articles/search`,
    params: { ...params, keyword }
  })
}

// 分类相关接口类型定义
export interface CategoryItem {
  _id?: string
  id?: string
  name: string
  slug: string
  description?: string
  color?: string
  sort?: number
  status: 'active' | 'inactive'
  articleCount?: number
  createTime?: string
  updateTime?: string
  isVisible?: boolean
}

export interface CategoryListResponse {
  code: number
  msg: string
  data: {
    categories: CategoryItem[]
    total: number
    currentPage: number
    pageSize: number
  }
}

export interface CreateCategoryParams {
  name: string
  slug: string
  description?: string
  color?: string
  sort?: number
  status?: 'active' | 'inactive'
}

export interface UpdateCategoryParams extends Partial<CreateCategoryParams> {
  _id?: string
  isVisible?: boolean
  visible?: boolean
}

export interface CategorySearchParams {
  page?: number
  size?: number
  keyword?: string
  status?: 'active' | 'inactive'
}

/**
 * 获取分类列表
 */
export function getCategories(params?: CategorySearchParams) {
  console.log('调用getCategories API，参数:', params)

  // 后台管理端：显式告知服务端是管理员请求，便于服务端返回所有状态
  const queryParams: any = { ...(params || {}), admin: true }

  return request
    .get({
      url: `/api/categories`,
      params: queryParams
    })
    .then((res: any) => {
      console.log('getCategories 原始响应:', res)

      // 处理后端的响应格式
      if (res && res.data) {
        console.log('res.data:', res.data)

        // 如果是分页响应格式
        if (typeof res.data === 'object' && 'categories' in res.data) {
          console.log('返回分页格式')
          console.log('categories数量:', res.data.categories?.length)
          console.log('第一个分类:', res.data.categories?.[0])
          return {
            categories: res.data.categories,
            total: res.data.total || res.data.categories.length
          }
        }
        // 如果是直接的数组格式
        else if (Array.isArray(res.data)) {
          console.log('返回数组格式')
          return res.data
        }
      }

      // 如果没有data属性，直接返回响应
      console.log('直接返回响应')
      return res || []
    })
    .catch((error) => {
      console.error('getCategories API 错误:', error)
      throw error
    })
}

/**
 * 获取分类详情
 */
export function getCategoryDetail(id: string) {
  return request
    .get({
      url: `/api/categories/${id}`
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 创建分类
 */
export function createCategory(data: CreateCategoryParams) {
  // 同时携带 status 与可见性布尔，确保后端按 status 更新
  const { status, ...rest } = data
  const payload: any = {
    ...rest,
    ...(typeof status !== 'undefined'
      ? { status, isVisible: status === 'active', visible: status === 'active' }
      : {})
  }
  return request
    .post({
      url: `/api/categories`,
      data: payload
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 更新分类
 */
export function updateCategory(id: string, data: UpdateCategoryParams) {
  // 向后端同时发送 status 与可见性布尔，保证以 status 为主进行落库
  const { status, ...rest } = data || {}
  const payload: any = {
    ...rest,
    ...(typeof status !== 'undefined'
      ? { status, isVisible: status === 'active', visible: status === 'active' }
      : {})
  }
  return request
    .put({
      url: `/api/categories/${id}`,
      data: payload
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 删除分类
 */
export function deleteCategory(id: string) {
  return request
    .del({
      url: `/api/categories/${id}`
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 批量删除分类
 */
export function batchDeleteCategories(ids: string[]) {
  return request
    .del({
      url: `/api/categories`,
      data: { ids }
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 批量更新分类状态
 */
export function batchUpdateCategoryStatus(ids: string[], status: 'active' | 'inactive') {
  return request
    .patch({
      url: `/api/categories/status`,
      data: { ids, status }
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 获取标签列表
 */
export function getTags() {
  return request.get({
    url: `/api/tags`
  })
}

/**
 * 文件上传
 */
export function uploadFile(data: FormData) {
  return request.post({
    url: `/api/upload`,
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 图片上传
 */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'image')

  return request.post({
    url: `/api/upload/image`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
