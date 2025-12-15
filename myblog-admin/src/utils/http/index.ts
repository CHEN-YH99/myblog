import { createHttpClient } from '../../../../shared/utils/http/client'
import { ApiStatus } from './status'
import { HttpError } from './error'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { $t } from '@/locales'

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

function getAuthHeader() {
  const { accessToken } = useUserStore()
  return accessToken ? { Authorization: accessToken } : undefined
}

async function beforeRequest(config: any) {
  const userStore = useUserStore()
  const method = String(config.method || '').toUpperCase()
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  if (isWrite && userStore.isReadOnly) {
    throw new HttpError($t('httpMsg.forbidden') || '当前账号为只读，禁止写操作', ApiStatus.forbidden)
  }
}

function parseResponse(response: any) {
  const data = response?.data
  const url: string = response?.config?.url || ''
  const isAbsolute = /^https?:\/\//i.test(url)
  
  // 优先处理标准格式
  if (data && typeof data === 'object' && 'code' in data) {
    const code = data.code
    const msg = data.msg
    const payload = data.data
    if (code === ApiStatus.success || code === 201) {
      return { ok: true, code, msg, data: payload }
    }
    if (code === ApiStatus.unauthorized) {
      return { ok: false, code, msg: $t('httpMsg.unauthorized') }
    }
    return { ok: false, code, msg: msg || $t('httpMsg.requestFailed'), data: payload }
  }
  
  // 对外部绝对地址（非本服务）放宽：无 code 也视为成功直返
  if (isAbsolute && !(VITE_API_URL && url.startsWith(String(VITE_API_URL)))) {
    return { ok: true, data }
  }

  // 管理端严格：无 code 视为错误
  return { ok: false, code: ApiStatus.error, msg: $t('httpMsg.requestFailed') }
}

function onUnauthorized() {
  setTimeout(() => {
    useUserStore().logOut()
  }, 500)
}

const api = createHttpClient({
  baseURL: VITE_API_URL,
  timeout: 15000,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  getAuthHeader,
  beforeRequest,
  parseResponse,
  onUnauthorized,
  messages: {
    showError: (error) => ElMessage.error(error.message),
    showSuccess: (message) => ElMessage.success(message),
  },
  retry: {
    max: 0,
    delay: 1000,
  },
  unauthorizedDebounceMs: 3000,
})

export default api
