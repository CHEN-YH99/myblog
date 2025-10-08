import request from '@/utils/http'

// 用户同步数据接口
export interface UserSyncData {
  id?: number
  username: string
  email: string
  avatar?: string
  nickname?: string
  phone?: string
  gender?: string
  birthday?: string
  bio?: string
  role?: string
  status?: 'active' | 'inactive' | 'banned'
  createTime?: string
  updateTime?: string
}

// 接收前台用户注册数据
export const receiveUserRegistration = (userData: UserSyncData): Promise<Api.SystemManage.UserListItem> => {
  return request.post<Api.SystemManage.UserListItem>({
    url: '/user/sync/register',
    data: userData
  })
}

// 同步用户数据到用户管理列表
export const syncUserToManagement = (userData: UserSyncData): Promise<void> => {
  return request.post({
    url: '/user/sync/to-management',
    data: userData
  })
}

// 批量同步用户数据
export const batchSyncUsers = (users: UserSyncData[]): Promise<{
  success: number
  failed: number
  errors: string[]
}> => {
  return request.post({
    url: '/user/sync/batch',
    data: { users }
  })
}

// 获取待同步的用户列表
export const getPendingSyncUsers = (): Promise<UserSyncData[]> => {
  return request.get({
    url: '/user/sync/pending'
  })
}

// 标记用户为已同步
export const markUserAsSynced = (userId: number): Promise<void> => {
  return request.put({
    url: `/user/sync/mark-synced/${userId}`
  })
}

// 获取用户同步状态
export const getUserSyncStatus = (): Promise<{
  totalUsers: number
  syncedUsers: number
  pendingUsers: number
  failedUsers: number
  lastSyncTime: string
}> => {
  return request.get({
    url: '/user/sync/status'
  })
}

// 手动触发用户数据同步
export const triggerUserSync = (): Promise<{
  message: string
  syncedCount: number
}> => {
  return request.post({
    url: '/user/sync/trigger'
  })
}