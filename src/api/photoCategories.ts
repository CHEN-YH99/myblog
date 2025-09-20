import http from '@/utils/http'

/**
 * 获取图片分类列表
 * @param params 搜索参数
 * @returns 图片分类列表响应
 */
export const getPhotoCategories = (
  params?: Api.PhotoCategory.SearchParams
): Promise<Api.PhotoCategory.ListResponse> => {
  return http.request<Api.PhotoCategory.ListResponse>({
    url: '/api/photo-categories',
    method: 'GET',
    params
  })
}

/**
 * 获取图片分类详情
 * @param id 分类ID
 * @returns 图片分类详情
 */
export const getPhotoCategoryDetail = (
  id: string
): Promise<Api.PhotoCategory.DetailResponse> => {
  return http.request<Api.PhotoCategory.DetailResponse>({
    url: `/api/photo-categories/${id}`,
    method: 'GET'
  })
}

/**
 * 更新图片分类
 * @param id 分类ID
 * @param data 更新数据
 * @returns 更新后的图片分类
 */
export const updatePhotoCategory = (
  id: string,
  data: Partial<Api.PhotoCategory.PhotoCategoryItem>
): Promise<Api.PhotoCategory.DetailResponse> => {
  return http.request<Api.PhotoCategory.DetailResponse>({
    url: `/api/photo-categories/${id}`,
    method: 'PUT',
    data
  })
}