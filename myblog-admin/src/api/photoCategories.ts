import request from '@/utils/request'

// 图片分类相关接口类型定义
export interface PhotoCategoryItem {
  _id?: string
  id?: string
  name: string
  title?: string
  coverImage?: string
  description?: string
  color?: string
  sort?: number
  status: 'active' | 'inactive'
  photoCount?: number
  createdAt?: string | Date
  updatedAt?: string | Date
  isVisible?: boolean
}

export interface PhotoCategoryListResponse {
  code: number
  msg: string
  data: {
    categories: PhotoCategoryItem[]
    total: number
    currentPage: number
    pageSize: number
  }
}

export interface CreatePhotoCategoryParams {
  name: string
  coverImage?: string
  description?: string
  color?: string
  sort?: number
  status?: 'active' | 'inactive'
}

export interface UpdatePhotoCategoryParams {
  name?: string
  coverImage?: string
  description?: string
  color?: string
  sort?: number
  status?: 'active' | 'inactive'
}

export interface PhotoCategorySearchParams {
  page?: number
  size?: number
  keyword?: string
  status?: 'active' | 'inactive'
}

// 统一的API接口
const API_BASE_URL = '/api'

// 将后端分类数据映射为前端使用的数据结构（补齐 status、id、sort）
function mapCategory(item: any): PhotoCategoryItem {
  const status: 'active' | 'inactive' =
    item?.status ?? (typeof item?.isVisible === 'boolean' ? (item.isVisible ? 'active' : 'inactive') : 'active')

  // 创建一个新的对象，确保所有字段都是可枚举和可配置的
  const mappedItem: PhotoCategoryItem = {
    _id: item?._id,
    id: item?.id ?? item?._id,
    name: item?.name || item?.title || '',
    title: item?.title || item?.name || '',
    coverImage: item?.coverImage || '',
    description: item?.description || '',
    color: item?.color || '#409eff',
    // 后端字段为 sortOrder，前端使用 sort
    sort: item?.sort ?? item?.sortOrder ?? 0,
    status: status,
    photoCount: item?.photoCount ?? 0,
    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
    // 保留原始的isVisible字段，以便后续可能需要
    isVisible: item?.isVisible
  }

  return mappedItem
}

/**
 * 获取图片分类列表
 */
export function getPhotoCategories(params?: PhotoCategorySearchParams) {
  console.log('调用getPhotoCategories API，参数:', params)

  return request
    .get({
      url: `${API_BASE_URL}/photo-categories`,
      params
    })
    .then((res: any) => {
      console.log('getPhotoCategories 原始响应:', res)

      // 处理后端的响应格式
      if (res && res.data) {
        console.log('res.data:', res.data)

        // 如果是分页响应格式
        if (typeof res.data === 'object' && 'categories' in res.data) {
          const mapped = Array.isArray(res.data.categories)
            ? res.data.categories.map(mapCategory)
            : []
          return {
            categories: mapped,
            total: res.data.total ?? mapped.length,
            currentPage: res.data.currentPage,
            pageSize: res.data.pageSize
          }
        }
        // 如果是直接的数组格式
        else if (Array.isArray(res.data)) {
          return res.data.map(mapCategory)
        }
      }

      // 如果没有data属性，直接返回响应
      console.log('直接返回响应')
      if (res && typeof res === 'object' && 'categories' in res) {
        const mapped = Array.isArray((res as any).categories)
          ? (res as any).categories.map(mapCategory)
          : []
        return {
          categories: mapped,
          total: (res as any).total ?? mapped.length,
          currentPage: (res as any).currentPage,
          pageSize: (res as any).pageSize
        }
      }
      if (Array.isArray(res)) return res.map(mapCategory)
      return res || []
    })
    .catch((error) => {
      console.error('getPhotoCategories API 错误:', error)
      throw error
    })
}

/**
 * 获取图片分类详情
 */
export function getPhotoCategoryDetail(id: string) {
  return request
    .get({
      url: `${API_BASE_URL}/photo-categories/${id}`
    })
    .then((res: any) => {
      const data = res && res.data ? res.data : res
      return data ? mapCategory(data) : data
    })
}

/**
 * 创建图片分类
 */
export function createPhotoCategory(data: CreatePhotoCategoryParams) {
  const { status, sort, ...rest } = data
  const payload: any = {
    ...rest,
    // 后端必填 title，默认与 name 一致
    title: data.name,
    // 后端字段为 sortOrder
    ...(typeof sort !== 'undefined' ? { sortOrder: sort } : {}),
    ...(status ? { isVisible: status === 'active' } : {})
  }
  return request
    .post({
      url: `${API_BASE_URL}/photo-categories`,
      data: payload
    })
    .then((res: any) => {
      const data = res && res.data ? res.data : res
      return data ? mapCategory(data) : data
    })
}

/**
 * 更新图片分类
 */
export function updatePhotoCategory(id: string, data: UpdatePhotoCategoryParams) {
  const { status, sort, ...rest } = data
  const payload: any = {
    ...rest,
    // 更新时也同步映射 sort -> sortOrder
    ...(typeof sort !== 'undefined' ? { sortOrder: sort } : {}),
    ...(typeof status !== 'undefined' ? { isVisible: status === 'active' } : {})
  }
  return request
    .put({
      url: `${API_BASE_URL}/photo-categories/${id}`,
      data: payload
    })
    .then((res: any) => {
      const data = res && res.data ? res.data : res
      return data ? mapCategory(data) : data
    })
}

/**
 * 删除图片分类
 */
export function deletePhotoCategory(id: string) {
  return request
    .del({
      url: `${API_BASE_URL}/photo-categories/${id}`
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 批量删除图片分类
 */
export function batchDeletePhotoCategories(ids: string[]) {
  return request
    .del({
      url: `${API_BASE_URL}/photo-categories`,
      data: { ids }
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}

/**
 * 批量更新图片分类状态
 */
export function batchUpdatePhotoCategoryStatus(ids: string[], status: 'active' | 'inactive') {
  return request
    .patch({
      url: `${API_BASE_URL}/photo-categories/status`,
      data: { ids, status }
    })
    .then((res: any) => {
      return res && res.data ? res.data : res
    })
}