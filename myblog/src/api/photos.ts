import http from '@/utils/http'

/**
 * 获取照片列表
 * @param params 搜索参数
 * @returns 照片列表响应
 */
export const getPhotos = (
  params?: Api.Photo.SearchParams,
): Promise<Api.Photo.ListResponse> => {
  return http.request<Api.Photo.ListResponse>({
    url: '/api/photos',
    method: 'GET',
    params,
  })
}

/**
 * 获取照片详情
 * @param id 照片ID
 * @returns 照片详情
 */
export const getPhotoDetail = (
  id: string,
): Promise<Api.Photo.DetailResponse> => {
  return http.request<Api.Photo.DetailResponse>({
    url: `/api/photos/${id}`,
    method: 'GET',
  })
}
