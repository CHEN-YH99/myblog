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
      stack: this.stack
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
  
  if (error.response?.data) {
    httpError = new HttpError(error.response.data)
  } else {
    const errorResponse: ErrorResponse = {
      code: error.response?.status || 500,
      message: error.message || '网络错误',
      timestamp: new Date().toISOString(),
      url: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN'
    }
    httpError = new HttpError(errorResponse)
  }
  
  // 前台版本不显示错误消息
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
