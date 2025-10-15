import request from '@/utils/http'

// 与前台保持一致的用户同步数据结构
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
  registerSource?: 'frontend' | 'admin' | 'other'
}

// 同步用户到后台管理系统（创建为普通用户）
export const syncUserToAdmin = (userData: UserSyncData): Promise<void> => {
  return request.post<void>({ url: '/api/user/sync-to-admin', data: userData })
}

// 更改密码
export interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

export const fetchChangePassword = (params: ChangePasswordParams): Promise<void> => {
  return request.post<void>({
    url: '/api/auth/change-password',
    data: params
  })
}