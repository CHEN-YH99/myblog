import api from '@/utils/http'

// 说说相关接口类型定义
export interface Talk {
  _id?: string
  content: string
  images?: string[]
  author: string
  publishDate: Date
  updateDate: Date
  likes: number
  views: number
  status: 'public' | 'private' | 'deleted'
  isTop: boolean
  isHidden: boolean
  location?: string
  mood?: string
  weather?: string
  tags?: string[]
  deleteDate?: Date
  sort: number
}

export interface TalkListParams {
  page?: number
  limit?: number
  status?: 'public' | 'private' | 'deleted' | 'all'
  isTop?: boolean
  isHidden?: boolean
  keyword?: string
}

export interface TalkListResponse {
  talks: Talk[]
  total: number
  page: number
  limit: number
}

export interface BatchOperateParams {
  ids: string[]
  action: 'delete' | 'restore' | 'top' | 'hide' | 'changeStatus'
  data?: Partial<Talk>
}

// 获取说说列表
export const getTalkList = async (params: any) => {
  console.log('🚀 getTalkList API调用参数:', params)
  
  // 映射前端参数到后端期望的格式
  const backendParams = {
    current: params.page || params.current || 1,
    size: params.limit || params.size || 10,
    status: params.status,
    isTop: params.isTop,
    isHidden: params.isHidden,
    keyword: params.keyword
  }
  
  console.log('🚀 映射后的后端参数:', backendParams)
  
  try {
    const response = await api.get({
      url: '/talks',
      params: backendParams
    })
    console.log('🚀 后端原始响应:', response)
    
    // 适配前端期望的数据格式
    const adaptedResponse = {
      talks: response.records || [],
      total: response.total || 0,
      page: response.current || 1,
      limit: response.size || 10
    }
    
    console.log('🚀 适配后的响应:', adaptedResponse)
    return adaptedResponse
  } catch (error) {
    console.error('🚀 getTalkList API调用失败:', error)
    throw error
  }
}

// 获取单个说说详情
export const getTalkById = (id: string): Promise<Talk> => {
  return api.get({
    url: `/talks/${id}`
  })
}

// 创建说说
export const createTalk = (data: Partial<Talk>): Promise<Talk> => {
  return api.post({
    url: '/talks',
    data
  })
}

// 更新说说
export const updateTalk = (id: string, data: Partial<Talk>): Promise<Talk> => {
  return api.put({
    url: `/talks/${id}`,
    data
  })
}

// 删除说说
export const deleteTalk = (id: string, permanent = false): Promise<void> => {
  return api.del({
    url: permanent 
      ? `/talks/${id}?permanent=true`
      : `/talks/${id}`
  })
}

// 恢复说说
export const restoreTalk = (id: string): Promise<void> => {
  return api.put({
    url: `/talks/${id}/restore`
  })
}

// 切换置顶状态
export const toggleTalkTop = (id: string): Promise<void> => {
  return api.put({
    url: `/talks/${id}/top`
  })
}

// 切换隐藏状态
export const toggleTalkHidden = (id: string): Promise<void> => {
  return api.put({
    url: `/talks/${id}/hidden`
  })
}

// 批量操作说说
export const batchOperateTalks = (params: BatchOperateParams): Promise<void> => {
  return api.post({
    url: '/talks/batch',
    data: params
  })
}

// 上传说说图片
export const uploadTalkImage = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post({
    url: '/talks/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}