import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoApi, logoutApi } from '@/api/auth'
import { useArticlesStore } from '@/stores/getarticles'
import { useTalksStore } from '@/stores/talks'

export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  nickname?: string
  createTime: string
}

export const useUserStore = defineStore('user', () => {
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
  const initUserState = () => {
    const savedToken = localStorage.getItem('token')
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedToken) {
      token.value = savedToken
    }
    
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('userInfo')
      }
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const info = await getUserInfoApi()
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
      
      console.log('用户已登出，清理相关状态')
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
    checkTokenExpire
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo']
  }
})