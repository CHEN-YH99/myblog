import { AxiosError } from 'axios'
import { ApiStatus } from './status'

/**
 * ============================================================
 * HTTP 错误处理模块 - 共享实现
 * ============================================================
 *
 * 此模块提供统一的 HTTP 错误处理能力，包括：
 * - HttpError 自定义错误类
 * - 错误消息映射和国际化支持
 * - 错误处理和显示函数
 * - 类型定义和工具函数
 *
 * 使用方式：
 * 1. 前台 (myblog): 直接重新导出此模块
 * 2. 管理端 (myblog-admin): 重新导出 + 包装函数以集成 ElMessage
 */

// ============================================================
// 类型定义
// ============================================================

/**
 * API 错误响应接口
 */
export interface ErrorResponse {
  code: number
  msg: string
  data?: unknown
}

/**
 * 错误日志数据接口
 */
export interface ErrorLogData {
  code: number
  message: string
  data?: unknown
  timestamp: string
  url?: string
  method?: string
  stack?: string
}

/**
 * 消息提示函数类型
 */
export type MessageFunction = (message: string) => void

// ============================================================
// 自定义错误类
// ============================================================

/**
 * HTTP 错误类
 *
 * 用于统一表示 HTTP 请求过程中的各类错误，包括：
 * - 网络错误
 * - HTTP 状态码错误
 * - 业务逻辑错误
 *
 * @example
 * ```ts
 * throw new HttpError('请求失败', 500, {
 *   url: '/api/users',
 *   method: 'GET'
 * })
 * ```
 */
export class HttpError extends Error {
  public readonly code: number
  public readonly data?: unknown
  public readonly timestamp: string
  public readonly url?: string
  public readonly method?: string

  constructor(
    message: string,
    code: number,
    options?: {
      data?: unknown
      url?: string
      method?: string
    }
  ) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.data = options?.data
    this.timestamp = new Date().toISOString()
    this.url = options?.url
    this.method = options?.method
  }

  /**
   * 转换为日志数据
   */
  public toLogData(): ErrorLogData {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
      url: this.url,
      method: this.method,
      stack: this.stack
    }
  }
}

// ============================================================
// 错误消息映射
// ============================================================

/**
 * 获取错误消息
 *
 * 根据 HTTP 状态码返回对应的错误消息，支持国际化。
 *
 * @param status - HTTP 状态码
 * @param useI18n - 是否使用国际化
 * @param t - 国际化函数
 * @returns 错误消息
 */
const getErrorMessage = (
  status: number,
  useI18n: boolean = false,
  t?: (key: string) => string
): string => {
  const i18nErrorMap: Record<number, string> = {
    [ApiStatus.unauthorized]: 'httpMsg.unauthorized',
    [ApiStatus.forbidden]: 'httpMsg.forbidden',
    [ApiStatus.notFound]: 'httpMsg.notFound',
    [ApiStatus.methodNotAllowed]: 'httpMsg.methodNotAllowed',
    [ApiStatus.requestTimeout]: 'httpMsg.requestTimeout',
    [ApiStatus.internalServerError]: 'httpMsg.internalServerError',
    [ApiStatus.badGateway]: 'httpMsg.badGateway',
    [ApiStatus.serviceUnavailable]: 'httpMsg.serviceUnavailable',
    [ApiStatus.gatewayTimeout]: 'httpMsg.gatewayTimeout'
  }

  const defaultErrorMap: Record<number, string> = {
    [ApiStatus.unauthorized]: '未授权，请重新登录',
    [ApiStatus.forbidden]: '拒绝访问',
    [ApiStatus.notFound]: '请求的资源不存在',
    [ApiStatus.methodNotAllowed]: '请求方法不允许',
    [ApiStatus.requestTimeout]: '请求超时',
    [ApiStatus.internalServerError]: '服务器内部错误',
    [ApiStatus.badGateway]: '网关错误',
    [ApiStatus.serviceUnavailable]: '服务不可用',
    [ApiStatus.gatewayTimeout]: '网关超时'
  }

  if (useI18n && t) {
    return t(i18nErrorMap[status] || 'httpMsg.internalServerError')
  }

  return defaultErrorMap[status] || '请求失败'
}

// ============================================================
// 错误处理函数
// ============================================================

/**
 * 处理 Axios 错误
 *
 * 将 Axios 错误转换为 HttpError，支持国际化。
 * 此函数总是抛出错误，不会返回。
 *
 * @param error - Axios 错误对象
 * @param useI18n - 是否使用国际化
 * @param t - 国际化函数
 * @throws HttpError 总是抛出 HttpError
 *
 * @example
 * ```ts
 * try {
 *   await api.get('/users')
 * } catch (error) {
 *   handleError(error as AxiosError, true, $t)
 * }
 * ```
 */
export function handleError(
  error: AxiosError<ErrorResponse>,
  useI18n: boolean = false,
  t?: (key: string) => string
): never {
  // 处理取消的请求
  if (error.code === 'ERR_CANCELED' || String(error.message).toLowerCase().includes('canceled')) {
    // 取消的请求不应作为警告或错误噪音；静默处理（保留可调试日志）
    const cancelMessage = useI18n && t ? t('httpMsg.requestCancelled') : '请求已取消'
    // 使用 debug 级别，避免在控制台产生警告
    console.debug('[HTTP] Request cancelled:', error.message)
    const err = new HttpError(cancelMessage, ApiStatus.error)
    ;(err as any).isCanceled = true
    throw err
  }

  const statusCode = error.response?.status
  const errorMessage = error.response?.data?.msg || error.message
  const requestConfig = error.config

  // 处理网络错误
  if (!error.response) {
    const networkMessage = useI18n && t ? t('httpMsg.networkError') : '网络连接失败，请检查网络设置'
    throw new HttpError(networkMessage, ApiStatus.error, {
      url: requestConfig?.url,
      method: requestConfig?.method?.toUpperCase()
    })
  }

  // 处理 HTTP 状态码错误
  const message = statusCode
    ? getErrorMessage(statusCode, useI18n, t)
    : errorMessage || (useI18n && t ? t('httpMsg.requestFailed') : '请求失败')
  throw new HttpError(message, statusCode || ApiStatus.error, {
    data: error.response.data,
    url: requestConfig?.url,
    method: requestConfig?.method?.toUpperCase()
  })
}

// ============================================================
// 消息显示函数
// ============================================================

/**
 * 显示错误消息
 *
 * 根据配置显示错误消息，支持自定义消息函数或使用 console.error。
 *
 * @param error - HttpError 对象
 * @param showMessage - 是否显示错误消息（默认 true）
 * @param messageFunction - 自定义消息显示函数
 *
 * @example
 * ```ts
 * // 使用 console.error
 * showError(error, true)
 *
 * // 使用自定义函数（如 ElMessage）
 * showError(error, true, (msg) => ElMessage.error(msg))
 * ```
 */
export function showError(
  error: HttpError,
  showMessage: boolean = true,
  messageFunction?: MessageFunction
): void {
  if (showMessage) {
    if (messageFunction) {
      messageFunction(error.message)
    } else {
      console.error('❌ HTTP Error:', error.message)
      // 如果是浏览器环境，可以使用原生alert作为fallback
      if (typeof window !== 'undefined') {
        // 可以在这里集成你使用的UI库的消息提示
        // 暂时使用console.error，实际项目中应该替换为具体的消息提示组件
      }
    }
  }

  // 记录错误日志
  console.error('[HTTP Error Details]', error.toLogData())
}

/**
 * 显示成功消息
 *
 * 根据配置显示成功消息，支持自定义消息函数或使用 console.log。
 *
 * @param message - 成功消息
 * @param showMessage - 是否显示消息（默认 true）
 * @param messageFunction - 自定义消息显示函数
 *
 * @example
 * ```ts
 * // 使用 console.log
 * showSuccess('操作成功', true)
 *
 * // 使用自定义函数（如 ElMessage）
 * showSuccess('操作成功', true, (msg) => ElMessage.success(msg))
 * ```
 */
export function showSuccess(
  message: string,
  showMessage: boolean = true,
  messageFunction?: MessageFunction
): void {
  if (showMessage) {
    if (messageFunction) {
      messageFunction(message)
    } else {
      console.log('✅ Success:', message)
      // 如果是浏览器环境，可以使用原生提示
      if (typeof window !== 'undefined') {
        // 可以在这里集成你使用的UI库的消息提示
      }
    }
  }
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 判断是否为 HttpError 类型
 *
 * @param error - 错误对象
 * @returns 是否为 HttpError 类型
 *
 * @example
 * ```ts
 * if (isHttpError(error)) {
 *   console.log(error.code)
 * }
 * ```
 */
export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}
