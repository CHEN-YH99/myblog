import request from '@/service/request'

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
  return request.post('/api/auth/login', data)
}

// 注册接口
export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export const registerApi = (data: RegisterParams): Promise<void> => {
  return request.post('/api/auth/register', data)
}

// 忘记密码接口
export const forgotPasswordApi = (email: string): Promise<void> => {
  return request.post('/api/auth/forgot-password', { email })
}

// 获取用户信息接口
export const getUserInfoApi = (): Promise<LoginResponse['userInfo']> => {
  return request.get('/api/auth/user-info')
}

// 刷新token接口
export const refreshTokenApi = (refreshToken: string): Promise<{ token: string }> => {
  return request.post('/api/auth/refresh-token', { refreshToken })
}

// 登出接口
export const logoutApi = (): Promise<void> => {
  return request.post('/api/auth/logout')
}