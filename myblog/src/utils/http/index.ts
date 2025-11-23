import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiStatus } from '@/utils/http/status'
import { HttpError, handleError, showError, showSuccess } from '@/utils/http/error'
import { ElMessage } from 'element-plus'
import router from '@/router'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null
const UNAUTHORIZED_DEBOUNCE_TIME = 3000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 2
const RETRY_DELAY = 1000

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
}

const { VITE_API_URL = '/api' } = import.meta.env

// silent debug logger (no output in build)
const log = (..._args: any[]) => {}
const warn = (..._args: any[]) => {}

log('前台HTTP配置 - VITE_API_URL:', VITE_API_URL)

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: VITE_API_URL.startsWith('http') ? VITE_API_URL : '', // 如果是完整URL就使用，否则为空（使用代理）
  withCredentials: false,
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    // 客户端博客系统：检查token是否过期（仅检查，不执行登出操作）
    const expireTime = localStorage.getItem('tokenExpire')
    if (expireTime && Date.now() > parseInt(expireTime)) {
      log('HTTP拦截器检测到Token已过期')
      // 如果不是登录相关的请求，直接拒绝请求
      if (!request.url?.includes('/auth/login') && !request.url?.includes('/auth/register')) {
        return Promise.reject(new Error('Token已过期，请重新登录'))
      }
    }
    
    // 客户端博客系统：添加token到请求头（兼容旧格式token）
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    if (token) {
      const tokenParts = token.split('-')
      const isOldFormat = tokenParts.length === 4 && tokenParts[0] === 'mock' && tokenParts[1] === 'jwt' && tokenParts[2] === 'token' && /^\d+$/.test(tokenParts[3])
      const isNewFormat = tokenParts.length >= 5 && tokenParts[0] === 'mock' && tokenParts[1] === 'jwt' && tokenParts[2] === 'token' && /^\d+$/.test(tokenParts[tokenParts.length - 1])

      if (isOldFormat) {
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo)
            // 对用户名进行编码以避免非ISO-8859-1字符问题
            const encodedUsername = encodeURIComponent(user.username)
            const newToken = `mock-jwt-token-${encodedUsername}-${Date.now()}`
            localStorage.setItem('token', newToken)
            request.headers.set('Authorization', newToken)
            log('检测到旧格式token，已自动升级为新格式')
          } catch (e) {
            warn('旧格式token升级失败，需重新登录')
          }
        } else {
          warn('检测到旧格式token且缺少userInfo，跳过Authorization并提示重新登录')
          // 不设置 Authorization，后端将返回401，前端将提示重新登录
        }
      } else if (isNewFormat) {
        request.headers.set('Authorization', token)
      } else {
        warn('非法token格式，跳过Authorization')
      }
    }
    
    // 设置默认Content-Type
    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }
    
    log('客户端博客系统发送HTTP请求:', {
      url: request.url,
      method: request.method,
      params: request.params,
      data: request.data,
      headers: {
        Authorization: request.headers.Authorization,
        'Content-Type': request.headers['Content-Type']
      }
    })
    
    // 特别记录密码修改请求的详细信息
    if (request.url?.includes('change-password')) {
      log('=== 密码修改请求详细信息 ===')
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')
      log('Token from localStorage:', token)
      log('UserInfo from localStorage:', userInfo)
      
      // 检查token格式
       if (token) {
         const tokenParts = token.split('-')
         log('Token parts:', tokenParts)
         
         // 正确的格式判断：mock-jwt-token-{username}-{timestamp}
         // 旧格式：mock-jwt-token-{timestamp} (4个部分，最后一个是纯数字时间戳)
         // 新格式：mock-jwt-token-{username}-{timestamp} (5个或更多部分)
         const isOldFormat = tokenParts.length === 4 && /^\d+$/.test(tokenParts[3])
         const isNewFormat = tokenParts.length >= 5
         
         log('Token format analysis:', {
           isOldFormat,
           isNewFormat,
           expectedFormat: 'mock-jwt-token-{username}-{timestamp}',
           actualParts: tokenParts.length,
           lastPartIsTimestamp: /^\d+$/.test(tokenParts[tokenParts.length - 1])
         })
         
         // 如果是旧格式token，尝试修复
         if (isOldFormat && userInfo) {
          try {
            const user = JSON.parse(userInfo)
            // 对用户名进行编码以避免非ISO-8859-1字符问题
            const encodedUsername = encodeURIComponent(user.username)
            const newToken = `mock-jwt-token-${encodedUsername}-${Date.now()}`
            log('检测到旧格式token，生成新token:', newToken)
            localStorage.setItem('token', newToken)
            request.headers.set('Authorization', newToken)
            log('已更新token格式')
          } catch (error) {
            console.error('修复token格式失败:', error)
          }
        }
      }
      
      log('Request Authorization header:', request.headers.Authorization)
      log('Request data:', request.data)
      log('Request URL:', request.url)
    }

    return request
  },
  (error) => {
    showError(createHttpError('请求配置错误', ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    log('客户端博客系统HTTP响应拦截器 - 原始响应:', response.data)
    
    // 检查是否是后端的标准响应格式 {code, msg, data}
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      const { code, msg } = response.data
      if (code === ApiStatus.success || code === 200) {
        log('客户端博客系统HTTP响应拦截器 - 请求成功')
        // 返回响应数据，让request函数处理data字段提取
        return response
      }
      
      // 处理401未授权错误（客户端博客系统简化处理）
      if (code === ApiStatus.unauthorized) {
        handleUnauthorizedError(msg)
        return Promise.reject(createHttpError(msg || '登录已过期，请重新登录', code))
      }
      
      console.error('客户端博客系统HTTP响应拦截器 - 请求失败:', msg)
      throw createHttpError(msg || '请求失败', code)
    }
    
    // 其他格式的响应直接返回
    log('客户端博客系统HTTP响应拦截器 - 非标准格式响应，直接返回')
    return response
  },
  (error) => {
    console.error('客户端博客系统HTTP响应拦截器 - 网络错误:', error)
    
    // 处理HTTP状态码401错误
    if (error.response?.status === ApiStatus.unauthorized) {
      handleUnauthorizedError(error.response?.data?.message)
      return Promise.reject(handleError(error))
    }
    
    return Promise.reject(handleError(error))
  }
)

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || '登录已过期，请重新登录', ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    ElMessage.error(error.message)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(async () => {
    // 动态导入用户store以避免循环依赖
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    await userStore.logout()
    router.push('/login')
  }, LOGOUT_DELAY)
}

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  const errorResponse = {
    code,
    message,
    timestamp: new Date().toISOString(),
    url: '',
    method: 'UNKNOWN'
  }
  return new HttpError(errorResponse)
}

/** 是否需要重试 */
function shouldRetry(error: any): boolean {
  // 如果是HttpError，检查状态码
  if (error instanceof HttpError) {
    const retryableCodes: number[] = [
      ApiStatus.requestTimeout,
      ApiStatus.internalServerError,
      ApiStatus.badGateway,
      ApiStatus.serviceUnavailable,
      ApiStatus.gatewayTimeout
    ]
    return retryableCodes.includes(error.code)
  }
  
  // 如果是Axios错误，检查错误类型
  if (error.code) {
    const retryableNetworkErrors = [
      'ECONNREFUSED',    // 连接被拒绝
      'ETIMEDOUT',       // 连接超时
      'ENOTFOUND',       // 域名解析失败
      'ECONNRESET',      // 连接重置
      'ECONNABORTED',    // 连接中断
      'ENETUNREACH',     // 网络不可达
      'EHOSTUNREACH',    // 主机不可达
      'EPIPE',           // 管道错误
      'EAI_AGAIN'        // DNS临时失败
    ]
    return retryableNetworkErrors.includes(error.code)
  }
  
  // 检查HTTP状态码
  if (error.response?.status) {
    const retryableStatusCodes: number[] = [408, 500, 502, 503, 504]
    return retryableStatusCodes.includes(error.response.status)
  }
  
  // 检查错误消息中的关键词
  if (error.message) {
    const retryableMessages = [
      'network error',
      'timeout',
      'connection',
      'failed to fetch',
      'fetch error'
    ]
    const message = error.message.toLowerCase()
    return retryableMessages.some(keyword => message.includes(keyword))
  }
  
  return false
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    log(`请求失败，剩余重试次数: ${retries}`, error)
    
    if (retries > 0 && shouldRetry(error)) {
      log(`等待 ${RETRY_DELAY}ms 后重试...`)
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    
    log('重试次数已用完或错误不可重试，抛出错误')
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT 参数自动填充
  if (
    ['POST', 'PUT'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    log('发起HTTP请求:', config)
    const res = await axiosInstance.request(config)
    log('收到HTTP响应:', res)

    // 显示成功消息
    if (config.showSuccessMessage && res.data?.msg) {
      showSuccess(res.data.msg)
    }

    // 检查响应数据结构
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      // 标准格式：{code, msg, data}
      log('返回标准格式数据:', res.data.data)
      return res.data.data as T
    } else {
      // 直接返回数据
      log('返回原始数据:', res.data)
      return res.data as T
    }
  } catch (error) {
    console.error('HTTP请求失败:', error)
    if (error instanceof HttpError) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api