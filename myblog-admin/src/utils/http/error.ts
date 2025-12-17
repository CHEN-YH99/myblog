/**
 * ============================================================
 * HTTP 错误处理 - 管理端 (myblog-admin) 仅重新导出
 * ============================================================
 *
 * 管理端统一使用 shared/utils/http/error 的实现。
 * UI 层面的消息提示（ElMessage）已在 utils/http/index.ts 中通过
 * createHttpClient 的 messages 适配器进行注入，此处不再二次封装，
 * 以避免重复与结构混乱。
 *
 * 使用方式：
 * ```ts
 * import { HttpError, handleError, showError } from '@/utils/http/error'
 * ```
 */

export * from '@shared/utils/http/error'
