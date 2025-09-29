import request from '@/utils/request'

// 图片项接口
export interface PhotoItem {
  _id?: string
  id?: string
  name: string
  url: string
  size: number
  width: number
  height: number
  categoryId: string
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// 图片搜索参数
export interface PhotoSearchParams {
  categoryId?: string
  keyword?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

// 图片上传参数
export interface PhotoUploadParams {
  categoryId: string
  name?: string
  description?: string
  tags?: string[]
}

// 新增照片参数（与后端 PhotoSchema 字段对齐）
export interface CreatePhotoParams {
  categoryId: string
  title: string
  imageUrl: string
  description?: string
  thumbnailUrl?: string
  tags?: string[]
  isVisible?: boolean
  sortOrder?: number
  // 新增：上传时间，便于由前端在“上传成功时刻”显式传递给后端
  uploadDate?: string
}

// 图片更新参数
export interface UpdatePhotoParams {
  name?: string
  description?: string
  tags?: string[]
  categoryId?: string
}

// 图片列表响应
export interface PhotoListResponse {
  photos: PhotoItem[]
  total: number
  page: number
  size: number
}

/**
 * 获取图片列表
 * @param params 搜索参数
 * @returns 图片列表
 */
export const getPhotos = (params?: PhotoSearchParams): Promise<PhotoListResponse | PhotoItem[]> => {
  return request.get({
    url: '/photos',
    params
  })
}

/**
 * 根据ID获取图片详情
 * @param id 图片ID
 * @returns 图片详情
 */
export const getPhotoById = (id: string): Promise<PhotoItem> => {
  return request.get({
    url: `/photos/${id}`
  })
}

/**
 * 根据分类ID获取图片列表
 * @param categoryId 分类ID
 * @param params 其他搜索参数
 * @returns 图片列表
 */
export const getPhotosByCategory = (
  categoryId: string,
  params?: Omit<PhotoSearchParams, 'categoryId'>
): Promise<PhotoListResponse | PhotoItem[]> => {
  return request.get({
    url: '/photos',
    params: { ...params, categoryId }
  })
}

/**
 * 创建照片记录（使用 /api/photos）
 */
export const createPhoto = (params: CreatePhotoParams) => {
  return request.post({
    url: '/photos',
    data: params
  })
}

/**
 * 上传图片（单文件直传到 /api/uploads，当前未使用）
 * @param file 图片文件
 * @param params 上传参数
 * @returns 上传结果
 */
export const uploadPhoto = (file: File, params: PhotoUploadParams): Promise<PhotoItem> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('categoryId', params.categoryId)
  if (params.name) formData.append('name', params.name)
  if (params.description) formData.append('description', params.description)
  if (params.tags) formData.append('tags', JSON.stringify(params.tags))

  return request.post({
    url: '/photos/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 批量上传图片（当前后端未实现 /photos/batch-upload，建议改为逐个 createPhoto）
 */
export const batchUploadPhotos = (files: File[], params: PhotoUploadParams): Promise<PhotoItem[]> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  formData.append('categoryId', params.categoryId)
  if (params.description) formData.append('description', params.description)
  if (params.tags) formData.append('tags', JSON.stringify(params.tags))

  return request({
    url: '/photos/batch-upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 更新图片信息
 * @param id 图片ID
 * @param params 更新参数
 * @returns 更新结果
 */
export const updatePhoto = (id: string, params: UpdatePhotoParams): Promise<PhotoItem> => {
  return request.put({
    url: `/photos/${id}`,
    data: params
  })
}

/**
 * 删除图片
 * @param id 图片ID
 * @returns 删除结果
 */
export const deletePhoto = (id: string): Promise<void> => {
  return request.del({
    url: `/photos/${id}`
  })
}

/**
 * 批量删除图片
 * @param ids 图片ID数组
 * @returns 删除结果
 */
export const batchDeletePhotos = (ids: string[]): Promise<void> => {
  return request.del({
    url: '/photos/batch-delete',
    data: { ids }
  })
}

/**
 * 移动图片到其他分类
 * @param id 图片ID
 * @param categoryId 目标分类ID
 * @returns 移动结果
 */
export const movePhotoToCategory = (id: string, categoryId: string): Promise<PhotoItem> => {
  return request.put({
    url: `/photos/${id}/move`,
    data: { categoryId }
  })
}

/**
 * 批量移动图片到其他分类
 * @param ids 图片ID数组
 * @param categoryId 目标分类ID
 * @returns 移动结果
 */
export const batchMovePhotosToCategory = (ids: string[], categoryId: string): Promise<PhotoItem[]> => {
  return request.put({
    url: '/photos/batch-move',
    data: { ids, categoryId }
  })
}