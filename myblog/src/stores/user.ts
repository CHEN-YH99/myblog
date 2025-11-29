import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoApi, logoutApi } from '@/api/auth'
import { useArticlesStore } from '@/stores/getarticles'
import { useTalksStore } from '@/stores/talks'

// 客户端博客系统用户信息接口（简化版，不包含角色权限）
export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  nickname?: string
  createTime: string
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 状态
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)
    const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

    // 设置token
    const setToken = (newToken: string) => {
      token.value = newToken
      if (newToken) {
        localStorage.setItem('token', newToken)
      } else {
        localStorage.removeItem('token')
      }
    }

    // 设置用户信息
    const setUserInfo = (info: UserInfo | null) => {
      userInfo.value = info
      if (info) {
        localStorage.setItem('userInfo', JSON.stringify(info))
      } else {
        localStorage.removeItem('userInfo')
      }
    }

    // 初始化用户状态（从localStorage恢复）
    const initUserState = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUserInfo = localStorage.getItem('userInfo')

      if (savedToken) {
        // 检查token是否过期
        if (!checkTokenExpire()) {
          // Token已过期，清理状态（仅在开发环境下提示）
          return
        }

        token.value = savedToken
      }

      if (savedUserInfo) {
        try {
          userInfo.value = JSON.parse(savedUserInfo)

          // 如果用户信息存在，初始化相关数据
          if (userInfo.value) {
            const articlesStore = useArticlesStore()
            const talksStore = useTalksStore()

            // 并行初始化点赞状态
            await Promise.all([
              articlesStore.initializeLikeStatus(),
              talksStore.initializeLikeStatus(),
            ])
          }
        } catch (error) {
          console.error('解析用户信息失败:', error)
          // 清理无效数据
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('tokenExpire')
        }
      }
    }

    // 从 mock-jwt-token 中解析用户名（mock-jwt-token-<username>-<timestamp>）
    const parseUsernameFromToken = (t: string): string | null => {
      if (!t) return null
      const parts = t.split('-')
      if (parts.length < 5) return null
      if (!(parts[0] === 'mock' && parts[1] === 'jwt' && parts[2] === 'token')) return null
      const ts = parts[parts.length - 1]
      if (!/^\d+$/.test(ts)) return null
      return parts.slice(3, -1).join('-')
    }

    // 获取用户信息
    const fetchUserInfo = async () => {
      try {
        const info = await getUserInfoApi()
        // 如果服务端返回的用户名与token中的不一致，进行自愈处理（仅限本地 mock token 格式）
        const expectedUsername = parseUsernameFromToken(token.value)
        const returnedName = info?.username || info?.nickname || ''
        if (expectedUsername && returnedName && returnedName !== expectedUsername) {
          if (token.value.startsWith('mock-jwt-token-')) {
            // 自动根据服务端用户刷新本地 token，避免状态不同步
            const encoded = encodeURIComponent(returnedName)
            const newToken = `mock-jwt-token-${encoded}-${Date.now()}`
            setToken(newToken)
            // dev-only tip removed
          } else {
            if ((import.meta as any)?.env?.DEV) console.warn('服务端返回的用户与当前令牌不匹配，已忽略更新')
            return userInfo.value
          }
        }
        setUserInfo(info)
        return info
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果获取用户信息失败，清除本地存储的信息
        logout()
        throw error
      }
    }

    // 登出
    const logout = async () => {
      try {
        if (token.value) {
          await logoutApi()
        }
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        // 无论请求是否成功，都清除本地状态
        setToken('')
        setUserInfo(null)
        localStorage.removeItem('tokenExpire')

        // 清理文章点赞状态
        const articlesStore = useArticlesStore()
        articlesStore.resetLikeStatus()

        // 清理说说点赞状态
        const talksStore = useTalksStore()
        talksStore.resetLikeStatus()
        /* log removed */
      }
    }

    // 检查token是否过期
    const checkTokenExpire = () => {
      const expireTime = localStorage.getItem('tokenExpire')
      if (expireTime && Date.now() > parseInt(expireTime)) {
        logout()
        return false
      }
      return true
    }

    return {
      // 状态
      token,
      userInfo,
      isLoggedIn,

      // 方法
      setToken,
      setUserInfo,
      initUserState,
      fetchUserInfo,
      logout,
      checkTokenExpire,
    }
  },
  {
    persist: {
      key: 'user-store',
      storage: localStorage,
      pick: ['token', 'userInfo'],
    },
  },
)
