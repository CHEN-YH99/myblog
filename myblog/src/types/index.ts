/**
 * 类型定义统一导出
 */

// 导出全局类型声明
// http.d.ts 和 api.d.ts 是全局类型声明，会自动被TypeScript识别


// 导出常用的业务类型
export type Article = Api.Article.ArticleItem
export type ArticleList = Api.Article.ArticleList
export type TocItem = Api.Article.TocItem
export type UserInfo = Api.User.UserInfo
export type CommentItem = Api.Comment.CommentItem
export type Talk = Api.Talk.TalkItem
export type TalkList = Api.Talk.TalkList

// 导出常用的参数类型
export type ArticleSearchParams = Api.Article.SearchParams
export type ArticleCreateParams = Api.Article.CreateParams
export type ArticleUpdateParams = Api.Article.UpdateParams
export type LoginParams = Api.User.LoginParams
export type RegisterParams = Api.User.RegisterParams

// 导出HTTP相关类型
export type BaseResponse<T = any> = Http.BaseResponse<T>
export type PaginatedResponse<T = any> = Http.PaginatedResponse<T>
export type RequestConfig = Http.RequestConfig

// 导出常用的枚举和常量
export { ApiStatus, BusinessStatus } from '@/utils/http/status'

// 导出错误处理相关
export { HttpError, isHttpError } from '@/utils/http/error'
export type { ErrorResponse, ErrorLogData } from '@/utils/http/error'

/**
 * 常用的工具类型
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * 分页相关类型
 */
export interface PaginationInfo {
  current: number
  size: number
  total: number
  pages: number
}

/**
 * 表格相关类型
 */
export interface TableColumn<T = any> {
  key: keyof T
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T, index: number) => any
}

/**
 * 表单相关类型
 */
export interface FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  validator?: (value: any) => boolean | string
  trigger?: 'blur' | 'change'
}

export interface FormItem {
  label: string
  key: string
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'upload'
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  rules?: FormRule[]
  props?: Record<string, any>
}

/**
 * 路由相关类型
 */
export interface RouteConfig {
  path: string
  name: string
  component: any
  meta?: {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
    icon?: string
    hidden?: boolean
  }
  children?: RouteConfig[]
}
