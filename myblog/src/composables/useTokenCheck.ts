import { onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

export function useTokenCheck() {
  const userStore = useUserStore()
  const router = useRouter()
  let intervalId: NodeJS.Timeout | null = null

  const startTokenCheck = () => {
    // 每5分钟检查一次token是否过期
    intervalId = setInterval(() => {
      if (!userStore.checkTokenExpire()) {
        console.log('定时检查：Token已过期，执行登出')
        // 跳转到登录页
        router.push('/login')
      }
    }, 5 * 60 * 1000) // 5分钟
  }

  const stopTokenCheck = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onBeforeUnmount(() => {
    stopTokenCheck()
  })

  return {
    startTokenCheck,
    stopTokenCheck
  }
}