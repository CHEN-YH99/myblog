import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiStatus } from './status'
import { HttpError, handleError as sharedHandleError, showError as sharedShowError, showSuccess as sharedShowSuccess } from './error'

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
}

export interface ParseResult<T = any> {
  ok: boolean
  code?: number
  msg?: string
  data?: T
}

export interface RetryOptions {
  max: number
  delay: number
  shouldRetry?: (error: any) => boolean
}

export interface MessageAdapters {
  // 针对错误/成功文案的 UI 适配器
  showError?: (error: HttpError, show: boolean) => void
  showSuccess?: (message: string, show: boolean) => void
}

export interface CreateHttpClientOptions {
  baseURL?: string
  timeout?: number
  withCredentials?: boolean
  validateStatus?: (status: number) => boolean
  transformResponseJSON?: boolean // 是否根据 content-type 自动 JSON 解析（默认 true）

  // 针对差异化策略的回调
  getAuthHeader?: () => Record<string, string> | undefined
  beforeRequest?: (config: InternalAxiosRequestConfig) => void | Promise<void>
  parseResponse?: (response: AxiosResponse<any>) => ParseResult
  onUnauthorized?: (message?: string) => void

  // 提示适配
  messages?: MessageAdapters

  // 失败重试
  retry?: RetryOptions

  // 401 防抖
  unauthorizedDebounceMs?: number
}

const DEFAULT_TIMEOUT = 15000
const DEFAULT_UNAUTHORIZED_DEBOUNCE = 3000

/** 默认 shouldRetry：网络瞬时故障与 5xx/408 重试 */
function defaultShouldRetry(error: any): boolean {
  // HttpError 场景
  if (error instanceof HttpError) {
    const retryableCodes: number[] = [
      ApiStatus.requestTimeout,
      ApiStatus.internalServerError,
      ApiStatus.badGateway,
      ApiStatus.serviceUnavailable,
      ApiStatus.gatewayTimeout,
    ]
    return retryableCodes.includes(error.code)
  }

  // Axios 错误码
  if (error && typeof error === 'object' && 'code' in error && (error as any).code) {
    const retryableNetworkErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'ECONNABORTED',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'EPIPE',
      'EAI_AGAIN',
    ]
    return retryableNetworkErrors.includes((error as any).code)
  }

  // HTTP 状态码
  if ((error as any)?.response?.status) {
    const retryableStatusCodes: number[] = [408, 500, 502, 503, 504]
    return retryableStatusCodes.includes((error as any).response.status)
  }

  // 错误消息关键词
  if ((error as any)?.message) {
    const retryableMessages = ['network error', 'timeout', 'connection', 'failed to fetch', 'fetch error']
    const message = String((error as any).message).toLowerCase()
    return retryableMessages.some((k) => message.includes(k))
  }

  return false
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface HttpClient {
  get<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  post<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  put<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  patch<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  del<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  request<T>(config: ExtendedAxiosRequestConfig): Promise<T>
  axiosInstance: AxiosInstance
}

export function createHttpClient(options: CreateHttpClientOptions = {}): HttpClient {
  const {
    baseURL,
    timeout = DEFAULT_TIMEOUT,
    withCredentials = false,
    validateStatus = (status: number) => status >= 200 && status < 300,
    transformResponseJSON = true,

    getAuthHeader,
    beforeRequest,
    parseResponse,
    onUnauthorized,

    messages,

    retry,

    unauthorizedDebounceMs = DEFAULT_UNAUTHORIZED_DEBOUNCE,
  } = options

  // 401 防抖状态（实例级）
  let isUnauthorizedErrorShown = false
  let unauthorizedTimer: ReturnType<typeof setTimeout> | null = null

  const axiosInstance = axios.create({
    baseURL,
    timeout,
    withCredentials,
    validateStatus,
    transformResponse: transformResponseJSON
      ? [
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
          },
        ]
      : undefined,
  })

  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 注入 Authorization
      if (getAuthHeader) {
        const headers = getAuthHeader()
        if (headers) {
          Object.entries(headers).forEach(([k, v]) => config.headers.set(k, v))
        }
      }

      // 默认 JSON Content-Type
      if (config.data && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
        config.headers.set('Content-Type', 'application/json')
        try {
          // 可能已是 string
          config.data = typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
        } catch {}
      }

      // 业务前置钩子
      if (beforeRequest) await beforeRequest(config)

      return config
    },
    (error) => {
      const err = new HttpError('请求配置错误', ApiStatus.error)
      messages?.showError ? messages.showError(err, true) : sharedShowError(err, true)
      return Promise.reject(error)
    },
  )

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse<any>) => {
      // 统一解析
      const res: ParseResult = parseResponse
        ? parseResponse(response)
        : defaultParseResponse(response)

      if (res.ok) return response

      // 未授权
      if (res.code === ApiStatus.unauthorized) {
        handleUnauthorized(res.msg)
      }

      throw new HttpError(res.msg || '请求失败', res.code ?? ApiStatus.error, {
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      })
    },
    (error) => {
      // HTTP 状态码 401
      if (error?.response?.status === ApiStatus.unauthorized) {
        handleUnauthorized(error?.response?.data?.message)
      }
      // 统一转换 & 抛出
      return Promise.reject(sharedHandleError(error))
    },
  )

  function resetUnauthorizedError() {
    isUnauthorizedErrorShown = false
    if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
    unauthorizedTimer = null
  }

  function handleUnauthorized(message?: string): never {
    const error = new HttpError(message || '未授权，请重新登录', ApiStatus.unauthorized)
    if (!isUnauthorizedErrorShown) {
      isUnauthorizedErrorShown = true
      try {
        onUnauthorized?.(error.message)
      } finally {
        unauthorizedTimer = setTimeout(resetUnauthorizedError, unauthorizedDebounceMs)
      }
      messages?.showError ? messages.showError(error, true) : sharedShowError(error, true)
      throw error
    }
    throw error
  }

  const shouldRetry = retry?.shouldRetry ?? defaultShouldRetry
  const maxRetries = Math.max(0, retry?.max ?? 0)
  const retryDelay = Math.max(0, retry?.delay ?? 1000)

  async function doRequest<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
    // POST | PUT 参数自动填充
    if (['POST', 'PUT'].includes(config.method?.toUpperCase() || '') && config.params && !config.data) {
      config.data = config.params
      config.params = undefined
    }

    try {
      const res = await axiosInstance.request<any>(config)

      // 成功提示
      const maybeMsg = (res.data && typeof res.data === 'object' && 'msg' in res.data) ? res.data.msg as string : undefined
      if (config.showSuccessMessage && maybeMsg) {
        messages?.showSuccess ? messages.showSuccess(maybeMsg, true) : sharedShowSuccess(maybeMsg, true)
      }

      // 结构化返回
      const parsed = parseResponse ? parseResponse(res) : defaultParseResponse(res)
      if (parsed.ok) {
        return (parsed.data as T)
      }

      // 不 ok 的情况抛错（一般不会到这，因为响应拦截器已处理）
      throw new HttpError(parsed.msg || '请求失败', parsed.code ?? ApiStatus.error, {
        url: res.config.url,
        method: res.config.method?.toUpperCase(),
      })
    } catch (error: any) {
      if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
        const isCanceled = (error as any)?.isCanceled === true || String(error?.message || '').includes('已取消')
        const showMsg = config.showErrorMessage !== false && !isCanceled
        if (showMsg) {
          messages?.showError ? messages.showError(error, true) : sharedShowError(error, true)
        }
      }
      return Promise.reject(error)
    }
  }

  async function retryRequest<T>(config: ExtendedAxiosRequestConfig, retries: number): Promise<T> {
    try {
      return await doRequest<T>(config)
    } catch (error) {
      if (retries > 0 && shouldRetry(error)) {
        await delay(retryDelay)
        return retryRequest<T>(config, retries - 1)
      }
      throw error
    }
  }

  const api = {
    async get<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>({ ...config, method: 'GET' }, maxRetries)
    },
    async post<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>({ ...config, method: 'POST' }, maxRetries)
    },
    async put<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>({ ...config, method: 'PUT' }, maxRetries)
    },
    async patch<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>({ ...config, method: 'PATCH' }, maxRetries)
    },
    async del<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>({ ...config, method: 'DELETE' }, maxRetries)
    },
    async request<T>(config: ExtendedAxiosRequestConfig) {
      return retryRequest<T>(config, maxRetries)
    },
    axiosInstance,
  }

  return api
}

// 默认解析：支持 {code,msg,data}；否则视为 ok 并直返 data
function defaultParseResponse(response: AxiosResponse<any>): ParseResult {
  const data = response.data
  if (data && typeof data === 'object' && 'code' in data) {
    const code = (data as any).code
    const msg = (data as any).msg
    const payload = (data as any).data
    if (code === ApiStatus.success || code === 201) {
      return { ok: true, code, msg, data: payload }
    }
    return { ok: false, code, msg, data: payload }
  }
  return { ok: true, data }
}

