import api from '@/utils/http'

/**
 * 获取说说列表
 * @param params 查询参数
 * @returns 说说列表分页数据
 */
export function getTalkList(params?: Api.Talk.SearchParams) {
  return api
    .get({ url: '/api/talks', params, showErrorMessage: false })
    .then((response) => {
      return response as Api.Talk.TalkList
    })
    .catch((error: any) => {
      const msg = String(error?.message || '')
      if ((error as any)?.isCanceled || /已取消|canceled/i.test(msg)) {
        console.debug('[API] 获取说说列表请求已取消')
        // 返回空分页，避免弹窗与异常
        return { records: [], total: 0, current: params?.current || 1, size: params?.size || 10 } as Api.Talk.TalkList
      }
      console.error('前台获取说说列表失败:', error)
      throw error
    })
}

/**
 * 获取说说详情
 * @param id 说说ID
 * @returns 说说详情
 */
export function getTalkDetail(id: string) {
  return api
    .get({ url: `/api/talks/${id}` })
    .then((response) => {
      return response as Api.Talk.TalkItem
    })
    .catch((error) => {
      console.error('前台获取说说详情失败:', error)
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
  return api.post({
    url: `/api/talks/${id}/like`,
    data: {},
    showErrorMessage: true,
  })
}

/**
 * 取消点赞说说
 * @param id 说说ID
 * @returns 取消点赞结果
 */
export function unlikeTalk(id: string) {
  return api.del({
    url: `/api/talks/${id}/like`,
    showErrorMessage: true,
  })
}

/**
 * 检查说说点赞状态
 * @param id 说说ID
 * @returns 点赞状态
 */
export function getTalkLikeStatus(id: string) {
  return api.get({
    url: `/api/talks/${id}/like/status`,
    showErrorMessage: false,
  })
}

/**
 * 获取用户已点赞的说说列表
 * @returns 用户已点赞的说说列表
 */
export function getUserLikedTalks() {
  return api.get({
    url: '/api/user/liked-talks',
    showErrorMessage: false,
  })
}

// ==================== 回复相关API ====================

/**
 * 获取说说回复列表
 * @param id 说说ID
 * @param params 查询参数
 * @returns 回复列表分页数据
 */
export function getTalkReplies(
  id: string,
  params?: {
    current?: number
    size?: number
  },
) {
  return api.get({
    url: `/api/replies`,
    params: { talkId: id, ...(params || {}) },
    showErrorMessage: true,
  })
}

/**
 * 添加回复
 * @param id 说说ID
 * @param data 回复数据
 * @returns 回复结果
 */
export function addTalkReply(
  id: string,
  data: {
    content: string
    author: string
    email?: string
    website?: string
    parentId?: string
    replyTo?: string
  },
) {
  // 服务器期望在 body 中携带 talkId
  return api.post({
    url: `/api/replies`,
    data: { ...data, talkId: id },
    showErrorMessage: true,
  })
}

/**
 * 点赞回复
 * @param id 回复ID
 * @returns 点赞结果
 */
export function likeReply(id: string) {
  return api.post({
    url: `/api/replies/${id}/like`,
    data: {},
    showErrorMessage: true,
  })
}

/**
 * 取消点赞回复
 * @param id 回复ID
 * @returns 取消点赞结果
 */
export function unlikeReply(id: string) {
  return api.del({
    url: `/api/replies/${id}/like`,
    showErrorMessage: true,
  })
}

export function getAllTalks(params?: Api.Talk.SearchParams) {
  return api
    .get({ url: '/api/talks', params })
    .then((response) => {
      const data = response

      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'talks' in data) {
        const talks = (data as Record<string, unknown>).talks as Api.Talk.TalkItem[]
        return talks
      } else {
        return []
      }
    })
    .catch((error) => {
      console.error('前台获取说说失败:', error)
      throw error
    })
}
