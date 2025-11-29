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
  registerSource?: 'frontend' | 'backend' | 'admin' | 'other'
}

// 缓存配置
const CACHE_DURATION = 2 * 60 * 1000 // 2分钟（用户数据更新频繁，缓存时间较短）
const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>()

// 缓存工具函数
function getCacheKey(url: string, params?: Record<string, unknown>): string {
  return `${url}${params ? JSON.stringify(params) : ''}`
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: Record<string, unknown>): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// 重试配置
const MAX_RETRIES = 2
const RETRY_DELAY = 800

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && shouldRetry(error as Record<string, unknown>)) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return withRetry(fn, retries - 1, delay * 1.5)
    }
    throw error
  }
}

// 判断是否应该重试
function shouldRetry(error: Record<string, unknown>): boolean {
  // 网络错误或服务器错误才重试，客户端错误不重试
  if (error?.response?.status) {
    const status = (error.response as Record<string, unknown>).status
    return (
      (status as number) >= 500 ||
      (status as number) === 408 ||
      (status as number) === 429
    )
  }
  return true // 网络错误等情况
}

// 清除用户相关缓存
function clearUserCache() {
  for (const key of cache.keys()) {
    if (key.includes('/api/user')) {
      cache.delete(key)
    }
  }
}

/**
 * 同步用户到后台管理系统
 * @param userData 用户数据
 * @returns 同步结果
 */
export const syncUserToAdmin = (userData: UserSyncData): Promise<void> => {
  return withRetry(() =>
    api
      .post({
        url: '/api/user/sync-to-admin',
        data: userData,
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then(() => {
        clearUserCache()
      }),
  ) as Promise<void>
}

/**
 * 从后台管理系统获取用户列表
 * @param params 查询参数
 * @returns 用户列表
 */
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
  const cacheKey = getCacheKey(
    '/api/user/admin-list',
    params as Record<string, unknown>,
  )
  const cached = getFromCache<{
    users: UserSyncData[]
    total: number
    page: number
    size: number
  }>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return withRetry(() =>
    api
      .get({
        url: '/api/user/admin-list',
        params,
        showErrorMessage: true,
      })
      .then((result) => {
        setCache(cacheKey, result as Record<string, unknown>)
        return result
      }),
  ).catch((error) => {
    console.error('获取用户列表失败:', error)
    // 降级处理
    return {
      users: [],
      total: 0,
      page: params?.page || 1,
      size: params?.size || 10,
    }
  }) as Promise<{
    users: UserSyncData[]
    total: number
    page: number
    size: number
  }>
}

/**
 * 更新用户状态（后台管理）
 * @param userId 用户ID
 * @param status 用户状态
 * @returns 更新结果
 */
export const updateUserStatus = (userId: string, status: UserSyncData['status']): Promise<void> => {
  return withRetry(() =>
    api
      .put({
        url: `/api/user/status/${userId}`,
        data: { status },
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then(() => {
        clearUserCache()
      }),
  ) as Promise<void>
}

/**
 * 批量同步用户数据
 * @param users 用户数据数组
 * @returns 同步结果
 */
export const batchSyncUsers = (
  users: UserSyncData[],
): Promise<{
  success: number
  failed: number
  errors: string[]
}> => {
  return withRetry(() =>
    api
      .post({
        url: '/api/user/batch-sync',
        data: { users },
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then((result) => {
        clearUserCache()
        return result
      }),
  ).catch((error) => {
    console.error('批量同步用户失败:', error)
    // 降级处理
    return {
      success: 0,
      failed: users.length,
      errors: [error.message || '批量同步失败'],
    }
  }) as Promise<{
    success: number
    failed: number
    errors: string[]
  }>
}

/**
 * 检查用户是否已存在
 * @param email 邮箱
 * @param username 用户名（可选）
 * @returns 检查结果
 */
export const checkUserExists = (
  email: string,
  username?: string,
): Promise<{
  exists: boolean
  existingFields: string[]
}> => {
  // 用户存在性检查不缓存，保证实时性
  return withRetry(() =>
    api.post({
      url: '/api/user/check-exists',
      data: { email, username },
      showErrorMessage: true,
    }),
  ).catch((error) => {
    console.error('检查用户存在性失败:', error)
    // 降级处理：假设不存在
    return {
      exists: false,
      existingFields: [],
    }
  }) as Promise<{
    exists: boolean
    existingFields: string[]
  }>
}

/**
 * 获取用户统计信息
 * @returns 用户统计数据
 */
export const getUserStats = (): Promise<{
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
}> => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const now = new Date()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  return withRetry(async () => {
    const [totalRes, activeRes, todayRes, monthRes] = await Promise.all([
      api.get<{ records: Record<string, unknown>[]; total: number }>({
        url: '/api/users',
        params: { current: 1, size: 1 },
        showErrorMessage: false,
      }),
      api.get<{ records: Record<string, unknown>[]; total: number }>({
        url: '/api/users',
        params: { enabled: true, current: 1, size: 1 },
        showErrorMessage: false,
      }),
      api.get<{ records: Record<string, unknown>[]; total: number }>({
        url: '/api/users',
        params: {
          startTime: todayStart.toISOString(),
          endTime: now.toISOString(),
          current: 1,
          size: 1,
        },
        showErrorMessage: false,
      }),
      api.get<{ records: Record<string, unknown>[]; total: number }>({
        url: '/api/users',
        params: {
          startTime: monthStart.toISOString(),
          endTime: now.toISOString(),
          current: 1,
          size: 1,
        },
        showErrorMessage: false,
      }),
    ])

    return {
      totalUsers: totalRes?.total || 0,
      activeUsers: activeRes?.total || 0,
      newUsersToday: todayRes?.total || 0,
      newUsersThisMonth: monthRes?.total || 0,
    }
  }).catch((error) => {
    console.error('获取用户统计失败:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisMonth: 0,
    }
  })
}

// 修改密码接口
export interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

/**
 * 修改密码
 * @param data 密码修改数据
 * @returns 修改结果
 */
export const changePassword = (data: ChangePasswordParams): Promise<void> => {
  return withRetry(() =>
    api
      .put({
        url: '/api/user/change-password',
        data,
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then(() => {
        // 密码修改后清除相关缓存
        clearUserCache()
      }),
  ) as Promise<void>
}

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getCurrentUser = (): Promise<UserSyncData> => {
  const cacheKey = getCacheKey('/api/user/current')
  const cached = getFromCache<UserSyncData>(cacheKey)

  if (cached) {
    return Promise.resolve(cached)
  }

  return withRetry(() =>
    api
      .get<UserSyncData>({
        url: '/api/user/current',
        showErrorMessage: true,
      })
      .then((user) => {
        setCache(cacheKey, user as unknown as Record<string, unknown>)
        return user
      }),
  )
}

/**
 * 更新用户信息
 * @param userData 用户数据
 * @returns 更新结果
 */
export const updateUserInfo = (userData: Partial<UserSyncData>): Promise<UserSyncData> => {
  return withRetry(() =>
    api
      .put<UserSyncData>({
        url: '/api/user/profile',
        data: userData,
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then((user) => {
        clearUserCache()
        return user
      }),
  )
}

/**
 * 上传用户头像
 * @param file 头像文件
 * @returns 头像URL
 */
export const uploadAvatar = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('avatar', file)

  return withRetry(() =>
    api
      .post<{ url: string }>({
        url: '/api/user/avatar',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        showSuccessMessage: true,
        showErrorMessage: true,
      })
      .then((result) => {
        clearUserCache()
        return result
      }),
  )
}

/**
 * 用户登录
 * @param credentials 登录凭据
 * @returns 登录结果
 */
export const login = (credentials: {
  email: string
  password: string
  rememberMe?: boolean
}): Promise<{
  token: string
  user: UserSyncData
  expiresIn: number
}> => {
  return api
    .post({
      url: '/api/auth/login',
      data: credentials,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then((result) => {
      clearUserCache()
      return result
    }) as Promise<{
    token: string
    user: UserSyncData
    expiresIn: number
  }>
}

/**
 * 用户注册
 * @param userData 注册数据
 * @returns 注册结果
 */
export const register = (userData: {
  username: string
  email: string
  password: string
  nickname?: string
}): Promise<{
  token: string
  user: UserSyncData
  expiresIn: number
}> => {
  return api
    .post({
      url: '/api/auth/register',
      data: userData,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then((result) => {
      clearUserCache()
      return result
    }) as Promise<{
    token: string
    user: UserSyncData
    expiresIn: number
  }>
}

/**
 * 用户登出
 * @returns 登出结果
 */
export const logout = (): Promise<void> => {
  return api
    .post({
      url: '/api/auth/logout',
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then(() => {
      clearUserCache()
    }) as Promise<void>
}

/**
 * 刷新token
 * @returns 新的token信息
 */
export const refreshToken = (): Promise<{
  token: string
  expiresIn: number
}> => {
  return api.post({
    url: '/api/auth/refresh',
    showErrorMessage: false, // 静默刷新
  })
}

/**
 * 验证token有效性
 * @returns 验证结果
 */
export const validateToken = (): Promise<{
  valid: boolean
  user?: UserSyncData
}> => {
  return api
    .get({
      url: '/api/auth/validate',
      showErrorMessage: false, // 静默验证
    })
    .catch(() => ({
      valid: false,
    })) as Promise<{
    valid: boolean
    user?: UserSyncData
  }>
}

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @param type 验证码类型
 * @returns 发送结果
 */
export const sendEmailCode = (
  email: string,
  type: 'register' | 'reset' | 'change',
): Promise<void> => {
  return api.post({
    url: '/api/auth/send-code',
    data: { email, type },
    showSuccessMessage: true,
    showErrorMessage: true,
  })
}

/**
 * 验证邮箱验证码
 * @param email 邮箱地址
 * @param code 验证码
 * @param type 验证码类型
 * @returns 验证结果
 */
export const verifyEmailCode = (
  email: string,
  code: string,
  type: string,
): Promise<{
  valid: boolean
  token?: string
}> => {
  return api.post({
    url: '/api/auth/verify-code',
    data: { email, code, type },
    showErrorMessage: true,
  })
}

/**
 * 重置密码
 * @param data 重置密码数据
 * @returns 重置结果
 */
export const resetPassword = (data: {
  email: string
  code: string
  newPassword: string
}): Promise<void> => {
  return api
    .post({
      url: '/api/auth/reset-password',
      data,
      showSuccessMessage: true,
      showErrorMessage: true,
    })
    .then(() => {
      clearUserCache()
    }) as Promise<void>
}

// 清理过期缓存
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key)
    }
  }
}, CACHE_DURATION)
