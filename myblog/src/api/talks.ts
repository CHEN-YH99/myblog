import request from '@/utils/http'
import http from '@/utils/http'

/**
 * 获取说说列表
 * @param params 查询参数
 * @returns 说说列表分页数据
 */
export function getTalkList(params?: {
  current?: number
  size?: number
  status?: string
  keyword?: string
}) {
  console.log('前台调用getTalkList API，参数:', params)
  
  return request.get<{ records: Api.Talk.TalkItem[]; total: number; current: number; size: number }>({
    url: '/api/talks',
    params,
    showErrorMessage: true
  }).then(response => {
    console.log('前台getTalkList处理后的响应:', response)
    
    if (response && typeof response === 'object') {
      if ('records' in response && Array.isArray((response as any).records)) {
        console.log('前台收到records格式说说数据:', (response as any).records.length)
        return response as { records: Api.Talk.TalkItem[]; total: number; current: number; size: number }
      } else if (Array.isArray(response)) {
        console.log('前台收到数组格式说说数据:', (response as Api.Talk.TalkItem[]).length)
        return { records: response as Api.Talk.TalkItem[], total: (response as Api.Talk.TalkItem[]).length, current: 1, size: (response as Api.Talk.TalkItem[]).length }
      }
    }
    
    console.warn('前台getTalkList未知响应格式:', response)
    return { records: [], total: 0, current: 1, size: 10 }
  }).catch(error => {
    console.error('前台getTalkList请求失败:', error)
    return { records: [], total: 0, current: 1, size: 10 }
  })
}

/**
 * 获取说说详情
 * @param id 说说ID
 * @returns 说说详情
 */
export function getTalkDetail(id: string) {
  console.log('前台调用getTalkDetail API，ID:', id)
  
  return request.get<Api.Talk.TalkItem>({
    url: `/api/talks/${id}`,
    showErrorMessage: true
  }).then(response => {
    console.log('前台getTalkDetail处理后的响应:', response)
    return response
  }).catch(error => {
    console.error('前台getTalkDetail请求失败:', error)
    throw error
  })
}

// ==================== 点赞相关API ====================

/**
 * 点赞说说
 * @param id 说说ID
 * @returns 点赞结果
 */
export function likeTalk(id: string) {
  return request.post<Api.Article.LikeResponse>({
    url: `/api/talks/${id}/like`,
    showErrorMessage: true
  })
}

/**
 * 取消点赞说说
 * @param id 说说ID
 * @returns 取消点赞结果
 */
export function unlikeTalk(id: string) {
  return request.del<Api.Article.LikeResponse>({
    url: `/api/talks/${id}/like`,
    showErrorMessage: true
  })
}

/**
 * 检查说说点赞状态
 * @param id 说说ID
 * @returns 点赞状态
 */
export function getTalkLikeStatus(id: string) {
  return request.get<Api.Article.LikeStatusResponse>({
    url: `/api/talks/${id}/like/status`,
    showErrorMessage: false
  })
}

/**
 * 获取用户已点赞的说说列表
 * @returns 用户已点赞的说说列表
 */
export function getUserLikedTalks() {
  return request.get<Api.Talk.TalkItem[]>({
    url: '/api/user/liked-talks',
    showErrorMessage: false
  })
}

// ==================== 回复相关API ====================

/**
 * 获取说说回复列表
 * @param id 说说ID
 * @param params 查询参数
 * @returns 回复列表分页数据
 */
export function getTalkReplies(id: string, params?: {
  current?: number
  size?: number
}) {
  return request.get<{ records: Api.Reply.ReplyItem[]; total: number; current: number; size: number }>({
    url: `/api/talks/${id}/replies`,
    params,
    showErrorMessage: true
  })
}

/**
 * 添加回复
 * @param id 说说ID
 * @param data 回复数据
 * @returns 回复结果
 */
export function addTalkReply(id: string, data: {
  content: string
  author: string
  email?: string
  website?: string
  parentId?: string
  replyTo?: string
}) {
  return request.post<Api.Reply.ReplyItem>({
    url: `/api/talks/${id}/replies`,
    data,
    showErrorMessage: true
  })
}

/**
 * 点赞回复
 * @param id 回复ID
 * @returns 点赞结果
 */
export function likeReply(id: string) {
  return request.post<Api.Article.LikeResponse>({
    url: `/api/replies/${id}/like`,
    showErrorMessage: true
  })
}

/**
 * 取消点赞回复
 * @param id 回复ID
 * @returns 取消点赞结果
 */
export function unlikeReply(id: string) {
  return request.del<Api.Article.LikeResponse>({
    url: `/api/replies/${id}/like`,
    showErrorMessage: true
  })
}

export const getAllTalks = async (): Promise<Api.Talk.TalkItem[]> => {
  try {
    // console.log('开始获取说说数据...')
    const response = await http.get<Api.Talk.TalkItem[]>({ url: '/talks' })
    // console.log('获取说说数据成功:', response)
    return response
  } catch (error) {
    console.error('获取说说数据失败:', error)
    throw error
  }
}