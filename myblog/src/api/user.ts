import api from '@/utils/http'

// 用户数据同步接口
export interface UserSyncData {
  id?: string
  username: string
  email: string
  password?: string
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

// 同步用户到后台管理系统
export const syncUserToAdmin = (userData: UserSyncData): Promise<void> => {
  return api.post({ url: '/api/user/sync-to-admin', data: userData }) as Promise<void>
}

// 从后台管理系统获取用户列表
export const getUserListFromAdmin = (params?: {
  page?: number
  size?: number
  keyword?: string
}): Promise<{
  users: UserSyncData[]
  total: number
  page: number
  size: number
}> => {
  return api.get({ url: '/api/user/admin-list', params }) as Promise<{
    users: UserSyncData[]
    total: number
    page: number
    size: number
  }>
}

// 更新用户状态（后台管理）
export const updateUserStatus = (userId: string, status: UserSyncData['status']): Promise<void> => {
  return api.put({ url: `/api/user/status/${userId}`, data: { status } }) as Promise<void>
}

// 批量同步用户数据
export const batchSyncUsers = (users: UserSyncData[]): Promise<{
  success: number
  failed: number
  errors: string[]
}> => {
  return api.post({ url: '/api/user/batch-sync', data: { users } }) as Promise<{
    success: number
    failed: number
    errors: string[]
  }>
}

// 检查用户是否已存在
export const checkUserExists = (email: string, username?: string): Promise<{
  exists: boolean
  existingFields: string[]
}> => {
  return api.post({ url: '/api/user/check-exists', data: { email, username } }) as Promise<{
    exists: boolean
    existingFields: string[]
  }>
}

// 获取用户统计信息
export const getUserStats = (): Promise<{
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
}> => {
  return api.get({ url: '/api/user/stats' }) as Promise<{
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersThisMonth: number
  }>
}

// 修改密码接口
export interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

export const changePassword = (data: ChangePasswordParams): Promise<void> => {
  return api.put({ url: '/api/user/change-password', data }) as Promise<void>
}