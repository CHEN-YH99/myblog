/**
 * HTTP相关类型定义
 */
declare namespace Http {
  /** 基础响应结构 */
  interface BaseResponse<T = any> {
    /** 状态码 */
    code: number
    /** 消息 */
    msg: string
    /** 数据 */
    data: T
  }

  /** 分页响应结构 */
  interface PaginatedResponse<T = any> {
    /** 数据列表 */
    records: T[]
    /** 当前页码 */
    current: number
    /** 每页条数 */
    size: number
    /** 总条数 */
    total: number
    /** 总页数 */
    pages?: number
  }

  /** 请求配置 */
  interface RequestConfig {
    /** 是否显示错误消息 */
    showErrorMessage?: boolean
    /** 是否显示成功消息 */
    showSuccessMessage?: boolean
    /** 是否显示加载状态 */
    showLoading?: boolean
    /** 请求超时时间 */
    timeout?: number
    /** 是否重试 */
    retry?: boolean
    /** 重试次数 */
    retryCount?: number
  }

  /** 上传文件响应 */
  interface UploadResponse {
    /** 文件URL */
    url: string
    /** 文件名 */
    filename?: string
    /** 文件大小 */
    size?: number
    /** 文件类型 */
    type?: string
  }
}
