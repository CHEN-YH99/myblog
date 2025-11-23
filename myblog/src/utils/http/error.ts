import { AxiosError } from 'axios'

// 错误响应接口
export interface ErrorResponse {
  code: number
  message: string
  data?: any
  timestamp: string
  url: string
  method: string
}

// 错误日志数据接口
export interface ErrorLogData {
  code: number
  message: string
  url: string
  method: string
  timestamp: string
  userAgent?: string
  stack?: string
}

// HTTP错误类
export class HttpError extends Error {
  public code: number
  public url: string
  public method: string
  public timestamp: string
  public data?: any

  constructor(response: ErrorResponse) {
    super(response.message)
    this.name = 'HttpError'
    this.code = response.code
    this.url = response.url
    this.method = response.method
    this.timestamp = response.timestamp
    this.data = response.data
  }

  toLogData(): ErrorLogData {
    return {
      code: this.code,
      message: this.message,
      url: this.url,
      method: this.method,
      timestamp: this.timestamp,
      userAgent: navigator?.userAgent,
      stack: this.stack,
    }
  }
}

// 判断是否为HTTP错误
export function isHttpError(error: any): error is HttpError {
  return error instanceof HttpError
}

/**
 * 处理错误 (前台特定版本)
 * @param error 错误对象
 * @returns 错误对象
 */
export function handleError(error: AxiosError<ErrorResponse>): never {
  let httpError: HttpError

  // 处理取消的请求
  if (error.code === 'ERR_CANCELED') {
    console.warn('Request cancelled:', error.message)
    const errorResponse: ErrorResponse = {
      code: 0,
      message: '请求已取消',
      timestamp: new Date().toISOString(),
      url: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
    }
    httpError = new HttpError(errorResponse)
    throw httpError
  }

  // 处理网络连接错误
  if (!error.response) {
    let message = '网络连接失败，请检查网络设置'

    // 根据错误代码提供更具体的错误信息
    if (error.code === 'ECONNREFUSED') {
      message = '服务器连接被拒绝，请检查服务器是否正常运行'
    } else if (error.code === 'ETIMEDOUT') {
      message = '请求超时，请检查网络连接'
    } else if (error.code === 'ENOTFOUND') {
      message = '无法找到服务器，请检查网络配置'
    } else if (error.message.includes('Network Error')) {
      message = '网络错误，请检查网络连接'
    }

    const errorResponse: ErrorResponse = {
      code: 0,
      message,
      timestamp: new Date().toISOString(),
      url: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
    }
    httpError = new HttpError(errorResponse)
  } else if (error.response?.data) {
    // 服务器返回的错误信息
    httpError = new HttpError(error.response.data)
  } else {
    // 其他HTTP状态码错误
    let message = error.message || '请求失败'
    const status = error.response?.status

    // 根据HTTP状态码提供更友好的错误信息
    switch (status) {
      case 400:
        message = '请求参数错误'
        break
      case 401:
        message = '未授权，请重新登录'
        break
      case 403:
        message = '权限不足'
        break
      case 404:
        message = '请求的资源不存在'
        break
      case 500:
        message = '服务器内部错误'
        break
      case 502:
        message = '网关错误'
        break
      case 503:
        message = '服务暂时不可用'
        break
      default:
        message = `请求失败 (${status})`
    }

    const errorResponse: ErrorResponse = {
      code: status || 500,
      message,
      timestamp: new Date().toISOString(),
      url: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
    }
    httpError = new HttpError(errorResponse)
  }

  // 前台版本记录详细错误信息
  console.error('[HTTP Error]', httpError.toLogData())
  throw httpError
}

/**
 * 显示错误消息 (前台特定版本)
 * @param error 错误对象
 * @param showMessage 是否显示错误消息
 */
export function showError(error: HttpError, showMessage: boolean = true): void {
  if (showMessage) {
    console.error('[HTTP Error Details]', error.toLogData())
    // 前台版本可以在这里添加用户友好的错误提示
  }
}

/**
 * 显示成功消息 (前台特定版本)
 * @param message 成功消息
 */
export const showSuccess = (message: string) => {
  // console.log('[Success]', message)
  // 前台版本可以在这里添加成功提示
}
