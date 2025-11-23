/**
 * 接口状态码
 */
export const ApiStatus = {
  success: 200, // 成功
  created: 201, // 创建成功
  error: 400, // 错误
  unauthorized: 401, // 未授权
  forbidden: 403, // 禁止访问
  notFound: 404, // 未找到
  methodNotAllowed: 405, // 方法不允许
  requestTimeout: 408, // 请求超时
  conflict: 409, // 冲突
  internalServerError: 500, // 服务器错误
  notImplemented: 501, // 未实现
  badGateway: 502, // 网关错误
  serviceUnavailable: 503, // 服务不可用
  gatewayTimeout: 504, // 网关超时
  httpVersionNotSupported: 505, // HTTP版本不支持
} as const

/**
 * 业务状态码 (可根据实际业务需求扩展)
 */
export const BusinessStatus = {
  SUCCESS: 0, // 业务成功
  FAIL: 1, // 业务失败
  PARAM_ERROR: 1001, // 参数错误
  DATA_NOT_FOUND: 1002, // 数据不存在
  DATA_EXISTS: 1003, // 数据已存在
  PERMISSION_DENIED: 1004, // 权限不足
  OPERATION_FAILED: 1005, // 操作失败
} as const

/**
 * HTTP 状态码类型
 */
export type ApiStatusType = (typeof ApiStatus)[keyof typeof ApiStatus]

/**
 * 业务状态码类型
 */
export type BusinessStatusType = (typeof BusinessStatus)[keyof typeof BusinessStatus]
