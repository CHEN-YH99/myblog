import { createHttpClient } from '@shared/utils/http/client'
import { ApiStatus } from '@/utils/http/status'
import { HttpError } from '@/utils/http/error'
import { ElMessage } from 'element-plus'

const { VITE_API_URL = '/api' } = import.meta.env

// 前台：token 兼容处理与过期检查
function getAuthHeader() {
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  if (!token) return undefined

  const parts = token.split('-')
  const isOldFormat = parts.length === 4 && parts[0] === 'mock' && parts[1] === 'jwt' && parts[2] === 'token' && /^\d+$/.test(parts[3])
  const isNewFormat = parts.length >= 5 && parts[0] === 'mock' && parts[1] === 'jwt' && parts[2] === 'token' && /^\d+$/.test(parts[parts.length - 1])

  if (isOldFormat) {
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        const encodedUsername = encodeURIComponent(user.username)
        const newToken = `mock-jwt-token-${encodedUsername}-${Date.now()}`
        localStorage.setItem('token', newToken)
        return { Authorization: newToken }
      } catch {
        // 升级失败则不携带头，交由后端返回401
        return undefined
      }
    }
    return undefined
  }

  if (isNewFormat) return { Authorization: token }
  // 非法格式不携带
  return undefined
}

async function beforeRequest(config: any) {
  // 过期检查（仅阻断非登录/注册接口）
  const expireTime = localStorage.getItem('tokenExpire')
  if (expireTime && Date.now() > parseInt(expireTime)) {
    const url = config.url || ''
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register')
    if (!isAuth) {
      throw new HttpError('Token已过期，请重新登录', ApiStatus.unauthorized)
    }
  }
}

function onUnauthorized(message?: string) {
  // 延迟登出与跳转，避免与消息提示冲突
  setTimeout(() => {
    import('@/stores/user')
      .then(({ useUserStore }) => useUserStore().logout())
      .finally(() => {
        import('@/router').then((m) => m.default.push('/login'))
      })
  }, 500)
}

const api = createHttpClient({
  timeout: 15000,
  baseURL: VITE_API_URL && VITE_API_URL.startsWith('http') ? VITE_API_URL : '',
  withCredentials: false,
  getAuthHeader,
  beforeRequest,
  // 前台容忍非标准响应（默认解析器已支持）
  onUnauthorized,
  messages: {
    showError: (error) => {
      const msg = String(error?.message || '')
      const isCanceled = (error as any)?.isCanceled === true || /已取消|canceled/i.test(msg)
      if (isCanceled) return
      ElMessage.error(msg)
    },
    showSuccess: (message) => ElMessage.success(message),
  },
  retry: {
    max: 2,
    delay: 1000,
  },
  unauthorizedDebounceMs: 3000,
})

export default api
