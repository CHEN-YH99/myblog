import { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { $t } from '@/locales'
import {
  HttpError,
  handleError as baseHandleError,
  showError as baseShowError,
  showSuccess as baseShowSuccess,
  isHttpError
} from '../../../../shared/utils/http/error'

// 错误响应接口
export interface ErrorResponse {
  code: number
  msg: string
  data?: unknown
}

// 错误日志数据接口
export interface ErrorLogData {
  code: number
  message: string
  data?: unknown
  timestamp: string
  url?: string
  method?: string
  stack?: string
}

// 重新导出共享的类型和类
export { HttpError, isHttpError }

/**
 * 处理错误 (管理端特定版本)
 * @param error 错误对象
 * @returns 错误对象
 */
export function handleError(error: AxiosError<ErrorResponse>): never {
  return baseHandleError(error, true, $t)
}

/**
 * 显示错误消息 (管理端特定版本)
 * @param error 错误对象
 * @param showMessage 是否显示错误消息
 */
export function showError(error: HttpError, showMessage: boolean = true): void {
  baseShowError(error, showMessage, (message: string) => {
    ElMessage.error(message)
  })
}

/**
 * 显示成功消息 (管理端特定版本)
 * @param message 成功消息
 * @param showMessage 是否显示消息
 */
export function showSuccess(message: string, showMessage: boolean = true): void {
  baseShowSuccess(message, showMessage, (message: string) => {
    ElMessage.success(message)
  })
}
