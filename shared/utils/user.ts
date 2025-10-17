/**
 * 用户相关工具函数
 */

/**
 * 获取默认头像
 */
export function getDefaultAvatar(username: string): string {
  const name = username || 'User'
  const colors = ['409eff', '67c23a', 'e6a23c', 'f56c6c', '909399']
  const color = colors[name.length % colors.length]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200`
}

/**
 * 用户状态配置
 */
export const USER_STATUS_CONFIG = {
  '1': { type: 'success' as const, text: '在线' },
  '2': { type: 'info' as const, text: '离线' },
  '3': { type: 'warning' as const, text: '异常' },
  '4': { type: 'danger' as const, text: '注销' },
  // 兼容字符串格式
  active: { type: 'success' as const, text: '正常' },
  inactive: { type: 'danger' as const, text: '禁用' },
  pending: { type: 'warning' as const, text: '待审核' }
}

/**
 * 获取用户状态配置
 */
export function getUserStatusConfig(status: string | number) {
  const statusKey = String(status)
  return (
    USER_STATUS_CONFIG[statusKey as keyof typeof USER_STATUS_CONFIG] || {
      type: 'info' as const,
      text: '未知'
    }
  )
}

/**
 * 性别映射
 */
export const GENDER_MAP = {
  male: '男',
  female: '女',
  other: '其他'
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化日期为简单日期格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatSimpleDate(dateString: string | Date | undefined): string {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  
  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化日期为详细格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDetailDate(dateString: string | Date | undefined): string {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化日期为本地字符串格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatLocaleDate(dateString: string | Date | undefined): string {
  if (!dateString) return '暂无'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '暂无'
  
  return date.toLocaleString('zh-CN')
}