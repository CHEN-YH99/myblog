import { computed } from 'vue'
import { useTalksStore } from '@/stores/talks'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function useTalkLikes() {
  const store = useTalksStore()
  const router = useRouter()
  const userStore = useUserStore()
  
  // 计算属性
  const likedTalks = computed(() => store.likedTalks)
  const likingTalks = computed(() => store.likingTalks)
  
  // 检查说说是否已点赞
  const isLiked = (talkId: string) => {
    return likedTalks.value.has(talkId)
  }
  
  // 检查说说是否正在处理点赞
  const isLiking = (talkId: string) => {
    return likingTalks.value.has(talkId)
  }
  
  // 点赞操作
  const handleLike = async (talkId: string) => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再点赞')
      router.push('/login')
      return
    }
    
    try {
      await store.toggleLike(talkId)
      const action = isLiked(talkId) ? '点赞' : '取消点赞'
      ElMessage.success(`${action}成功！`)
    } catch (error: any) {
      if (error.message === '请先登录') {
        ElMessage.warning('请先登录后再点赞')
        router.push('/login')
      } else {
        ElMessage.error('操作失败，请稍后重试')
      }
    }
  }
  
  return {
    likedTalks,
    likingTalks,
    isLiked,
    isLiking,
    handleLike
  }
}