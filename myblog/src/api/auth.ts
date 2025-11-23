import api from '@/utils/http'

// 登录接口
export interface LoginParams {
  username: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  token: string
  userInfo: {
    id: string
    username: string
    email: string
    avatar?: string
    nickname?: string
    createTime: string
  }
}

export const loginApi = (data: LoginParams): Promise<LoginResponse> => {
  return api.post({ url: '/api/auth/login', data }) as Promise<LoginResponse>
}

// 注册接口
export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export const registerApi = (data: RegisterParams): Promise<void> => {
  return api.post({ url: '/api/auth/register', data }) as Promise<void>
}

// 忘记密码接口
export const forgotPasswordApi = (email: string): Promise<void> => {
  return api.post({
    url: '/api/auth/forgot-password',
    data: { email },
  }) as Promise<void>
}

// 获取用户信息接口（客户端博客系统专用）
export const getUserInfoApi = async (): Promise<LoginResponse['userInfo']> => {
  // 前台应使用需要鉴权的接口，后端会根据 Authorization 里的用户名返回对应用户
  // 注意不要再使用 /api/user/info（该路径在后端被固定返回管理员信息，仅用于兼容旧端）
  const raw = (await api.get({ url: '/api/auth/user-info' })) as Record<
    string,
    unknown
  >
  const id = String(raw?.id ?? raw?.userId ?? '')
  const username = String(raw?.username ?? raw?.userName ?? '')
  const email = String(raw?.email ?? '')
  const avatar = String(raw?.avatar ?? '')
  const nickname = String(raw?.nickname ?? username)
  const createTime = String(raw?.createTime ?? '')

  return { id, username, email, avatar, nickname, createTime }
}

// 刷新token接口
export const refreshTokenApi = (
  refreshToken: string,
): Promise<{ token: string }> => {
  return api.post({
    url: '/api/auth/refresh-token',
    data: { refreshToken },
  }) as Promise<{
    token: string
  }>
}

// 登出接口
export const logoutApi = (): Promise<void> => {
  return api.post({ url: '/api/auth/logout' }) as Promise<void>
}
