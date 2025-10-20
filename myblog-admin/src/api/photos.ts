import request from '@/utils/request'

// 统一 API 基础前缀，开发环境通过 Vite 代理到后端
const API_BASE_URL = '/api'

/** 图片项 */
interface PhotoItem {
  id?: string
  _id?: string
  title: string
  imageUrl: string
  thumbnailUrl?: string
  categoryId: string
  description?: string
  tags?: string[]
  uploadDate?: string
  isVisible?: boolean
  sortOrder?: number
  viewCount?: number
  likeCount?: number
}

/** 图片列表响应 */
interface PhotoListResponse {
  photos: PhotoItem[]
  total: number
  currentPage: number
  pageSize: number
}

/** 创建图片参数 */
interface CreatePhotoParams {
  title: string
  imageUrl: string
  categoryId: string
  uploadDate?: string
  description?: string
  tags?: string[]
  isVisible?: boolean
  sortOrder?: number
  thumbnailUrl?: string
}

/** 图片搜索参数 */
interface PhotoSearchParams {
  page?: number
  size?: number
  keyword?: string
  categoryId?: string
  isVisible?: boolean
  sortOrder?: 'asc' | 'desc'
}

/** 获取图片列表 */
export function getPhotos(params?: PhotoSearchParams) {
  return request.get<PhotoListResponse | PhotoItem[]>({
    url: `${API_BASE_URL}/photos`,
    params,
  })
}

/** 根据ID获取图片详情 */
export function getPhotoById(id: string) {
  return request.get<PhotoItem>({
    url: `${API_BASE_URL}/photos/${id}`,
  })
}

/** 根据分类获取图片列表 */
export function getPhotosByCategory(categoryId: string, params?: Omit<PhotoSearchParams, 'categoryId'>) {
  return request.get<PhotoListResponse | PhotoItem[]>({
    url: `${API_BASE_URL}/photos`,
    params: { ...params, categoryId },
  })
}

/** 创建图片 */
export function createPhoto(data: CreatePhotoParams) {
  return request.post<PhotoItem>({
    url: `${API_BASE_URL}/photos`,
    data,
  })
}

/** 上传图片文件（文件流） */
export function uploadPhoto(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ url: string }>({
    url: `${API_BASE_URL}/photos/upload`,
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData,
  })
}

/** 批量上传图片 */
export function batchUploadPhotos(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return request.post<{ urls: string[] }>({
    url: `${API_BASE_URL}/photos/batch-upload`,
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData,
  })
}

/** 更新图片 */
export function updatePhoto(id: string, data: Partial<CreatePhotoParams>) {
  return request.put<PhotoItem>({
    url: `${API_BASE_URL}/photos/${id}`,
    data,
  })
}

/** 删除图片 */
export function deletePhoto(id: string) {
  return request.del<void>({
    url: `${API_BASE_URL}/photos/${id}`,
  })
}

/** 批量删除图片 */
export function batchDeletePhotos(ids: string[]) {
  return request.post<void>({
    url: `${API_BASE_URL}/photos/batch-delete`,
    data: { ids },
  })
}

/** 将图片移动到另一个分类 */
export function movePhotoToCategory(id: string, targetCategoryId: string) {
  return request.post<void>({
    url: `${API_BASE_URL}/photos/${id}/move`,
    data: { targetCategoryId },
  })
}

/** 批量移动图片到另一个分类 */
export function batchMovePhotosToCategory(ids: string[], targetCategoryId: string) {
  return request.post<void>({
    url: `${API_BASE_URL}/photos/batch-move`,
    data: { ids, targetCategoryId },
  })
}