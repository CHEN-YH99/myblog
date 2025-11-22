/**
 * 统一错误处理工具
 */

import { ElMessage, ElNotification } from 'element-plus'

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  BUSINESS = 'business',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// 错误级别枚举
export enum ErrorLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType
  level: ErrorLevel
  message: string
  code?: string | number
  details?: any
  timestamp?: number
  stack?: string
}

// 错误处理配置
export interface ErrorHandlerConfig {
  showMessage?: boolean
  showNotification?: boolean
  logToConsole?: boolean
  reportToServer?: boolean
  customHandler?: (error: ErrorInfo) => void
}

// 默认配置
const defaultConfig: ErrorHandlerConfig = {
  showMessage: true,
  showNotification: false,
  logToConsole: true,
  reportToServer: false
}

// 错误消息映射
const errorMessages: Record<ErrorType, Record<string, string>> = {
  [ErrorType.NETWORK]: {
    default: '网络连接失败，请检查网络后重试',
    timeout: '请求超时，请重试',
    offline: '网络连接已断开，请检查网络连接',
    '404': '请求的资源不存在',
    '500': '服务器内部错误，请稍后重试',
    '502': '服务器网关错误，请稍后重试',
    '503': '服务暂时不可用，请稍后重试'
  },
  [ErrorType.AUTH]: {
    default: '身份验证失败，请重新登录',
    expired: '登录已过期，请重新登录',
    forbidden: '权限不足，无法执行此操作',
    unauthorized: '未授权访问，请先登录'
  },
  [ErrorType.VALIDATION]: {
    default: '输入数据格式不正确',
    required: '必填字段不能为空',
    format: '数据格式不正确',
    length: '数据长度不符合要求'
  },
  [ErrorType.BUSINESS]: {
    default: '业务操作失败',
    duplicate: '数据已存在，请勿重复操作',
    notFound: '数据不存在或已被删除',
    conflict: '操作冲突，请刷新后重试'
  },
  [ErrorType.SYSTEM]: {
    default: '系统错误，请联系管理员',
    maintenance: '系统正在维护中，请稍后再试',
    overload: '系统繁忙，请稍后重试'
  },
  [ErrorType.UNKNOWN]: {
    default: '未知错误，请重试或联系技术支持'
  }
}

// 错误分类器
export class ErrorClassifier {
  static classify(error: any): ErrorInfo {
    const timestamp = Date.now()
    
    // 处理网络错误
    if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
      return {
        type: ErrorType.NETWORK,
        level: ErrorLevel.MEDIUM,
        message: errorMessages[ErrorType.NETWORK].default,
        timestamp,
        details: error
      }
    }
    
    // 处理HTTP错误
    if (error?.response?.status) {
      const status = error.response.status
      let type = ErrorType.NETWORK
      let level = ErrorLevel.MEDIUM
      
      if (status === 401) {
        type = ErrorType.AUTH
        level = ErrorLevel.HIGH
      } else if (status === 403) {
        type = ErrorType.AUTH
        level = ErrorLevel.HIGH
      } else if (status >= 500) {
        type = ErrorType.SYSTEM
        level = ErrorLevel.HIGH
      }
      
      return {
        type,
        level,
        message: errorMessages[type][status.toString()] || errorMessages[type].default,
        code: status,
        timestamp,
        details: error.response
      }
    }
    
    // 处理验证错误
    if (error?.name === 'ValidationError' || error?.type === 'validation') {
      return {
        type: ErrorType.VALIDATION,
        level: ErrorLevel.LOW,
        message: error.message || errorMessages[ErrorType.VALIDATION].default,
        timestamp,
        details: error
      }
    }
    
    // 处理业务错误
    if (error?.type === 'business' || error?.businessError) {
      return {
        type: ErrorType.BUSINESS,
        level: ErrorLevel.MEDIUM,
        message: error.message || errorMessages[ErrorType.BUSINESS].default,
        timestamp,
        details: error
      }
    }
    
    // 处理JavaScript错误
    if (error instanceof Error) {
      return {
        type: ErrorType.SYSTEM,
        level: ErrorLevel.MEDIUM,
        message: error.message || errorMessages[ErrorType.SYSTEM].default,
        timestamp,
        stack: error.stack,
        details: error
      }
    }
    
    // 未知错误
    return {
      type: ErrorType.UNKNOWN,
      level: ErrorLevel.MEDIUM,
      message: typeof error === 'string' ? error : errorMessages[ErrorType.UNKNOWN].default,
      timestamp,
      details: error
    }
  }
}

// 错误处理器
export class ErrorHandler {
  private config: ErrorHandlerConfig
  private errorQueue: ErrorInfo[] = []
  private maxQueueSize = 100
  
  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }
  
  // 处理错误
  handle(error: any, customConfig?: Partial<ErrorHandlerConfig>): void {
    const errorInfo = ErrorClassifier.classify(error)
    const config = { ...this.config, ...customConfig }
    
    // 添加到错误队列
    this.addToQueue(errorInfo)
    
    // 控制台日志
    if (config.logToConsole) {
      this.logToConsole(errorInfo)
    }
    
    // 显示用户消息
    if (config.showMessage) {
      this.showUserMessage(errorInfo)
    }
    
    // 显示通知
    if (config.showNotification) {
      this.showNotification(errorInfo)
    }
    
    // 上报服务器
    if (config.reportToServer) {
      this.reportToServer(errorInfo)
    }
    
    // 自定义处理
    if (config.customHandler) {
      config.customHandler(errorInfo)
    }
  }
  
  // 添加到错误队列
  private addToQueue(errorInfo: ErrorInfo): void {
    this.errorQueue.push(errorInfo)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }
  
  // 控制台日志
  private logToConsole(errorInfo: ErrorInfo): void {
    const { type, level, message, code, timestamp, stack, details } = errorInfo
    
    const logData = {
      type,
      level,
      message,
      code,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      stack,
      details
    }
    
    switch (level) {
      case ErrorLevel.LOW:
        console.info('🔵 Error:', logData)
        break
      case ErrorLevel.MEDIUM:
        console.warn('🟡 Error:', logData)
        break
      case ErrorLevel.HIGH:
        console.error('🔴 Error:', logData)
        break
      case ErrorLevel.CRITICAL:
        console.error('💥 Critical Error:', logData)
        break
    }
  }
  
  // 显示用户消息
  private showUserMessage(errorInfo: ErrorInfo): void {
    const { level, message } = errorInfo
    
    switch (level) {
      case ErrorLevel.LOW:
        ElMessage.info(message)
        break
      case ErrorLevel.MEDIUM:
        ElMessage.warning(message)
        break
      case ErrorLevel.HIGH:
      case ErrorLevel.CRITICAL:
        ElMessage.error(message)
        break
    }
  }
  
  // 显示通知
  private showNotification(errorInfo: ErrorInfo): void {
    const { level, message, type } = errorInfo
    
    let title = '系统提示'
    let notificationType: 'success' | 'warning' | 'info' | 'error' = 'info'
    
    switch (level) {
      case ErrorLevel.LOW:
        title = '提示'
        notificationType = 'info'
        break
      case ErrorLevel.MEDIUM:
        title = '警告'
        notificationType = 'warning'
        break
      case ErrorLevel.HIGH:
      case ErrorLevel.CRITICAL:
        title = '错误'
        notificationType = 'error'
        break
    }
    
    ElNotification({
      title,
      message,
      type: notificationType,
      duration: level === ErrorLevel.CRITICAL ? 0 : 4500
    })
  }
  
  // 上报服务器
  private async reportToServer(errorInfo: ErrorInfo): Promise<void> {
    try {
      // 这里应该调用实际的错误上报API
      console.log('Reporting error to server:', errorInfo)
      
      // 示例：发送到错误监控服务
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // })
    } catch (reportError) {
      console.error('Failed to report error to server:', reportError)
    }
  }
  
  // 获取错误历史
  getErrorHistory(): ErrorInfo[] {
    return [...this.errorQueue]
  }
  
  // 清空错误队列
  clearErrorHistory(): void {
    this.errorQueue = []
  }
  
  // 获取错误统计
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.AUTH]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.BUSINESS]: 0,
      [ErrorType.SYSTEM]: 0,
      [ErrorType.UNKNOWN]: 0
    }
    
    this.errorQueue.forEach(error => {
      stats[error.type]++
    })
    
    return stats
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new ErrorHandler()

// 便捷函数
export const handleError = (error: any, config?: Partial<ErrorHandlerConfig>) => {
  globalErrorHandler.handle(error, config)
}

// 异步操作错误处理装饰器
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<ErrorHandlerConfig>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, config)
      throw error
    }
  }) as T
}

// 同步操作错误处理装饰器
export function withSyncErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  config?: Partial<ErrorHandlerConfig>
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args)
    } catch (error) {
      handleError(error, config)
      throw error
    }
  }) as T
}