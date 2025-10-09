import request from '@/service/request'

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
  return request.post('/api/user/sync-to-admin', userData)
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
  return request.get('/api/user/admin-list', { params })
}

// 更新用户状态（后台管理）
export const updateUserStatus = (userId: string, status: UserSyncData['status']): Promise<void> => {
  return request.put(`/api/user/status/${userId}`, { status })
}

// 批量同步用户数据
export const batchSyncUsers = (users: UserSyncData[]): Promise<{
  success: number
  failed: number
  errors: string[]
}> => {
  return request.post('/api/user/batch-sync', { users })
}

// 检查用户是否已存在
export const checkUserExists = (email: string, username?: string): Promise<{
  exists: boolean
  existingFields: string[]
}> => {
  return request.post('/api/user/check-exists', { email, username })
}

// 获取用户统计信息
export const getUserStats = (): Promise<{
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
}> => {
  return request.get('/api/user/stats')
}