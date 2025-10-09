import { computed } from 'vue'
import { useArticlesStore } from '@/stores/getarticles'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function useLikes() {
  const store = useArticlesStore()
  const router = useRouter()
  const userStore = useUserStore()
  
  // 计算属性
  const likedArticles = computed(() => store.likedArticles)
  const likingArticles = computed(() => store.likingArticles)
  
  // 检查文章是否已点赞
  const isLiked = (articleId: string) => {
    return likedArticles.value.has(articleId)
  }
  
  // 检查文章是否正在处理点赞
  const isLiking = (articleId: string) => {
    return likingArticles.value.has(articleId)
  }
  
  // 点赞操作
  const handleLike = async (articleId: string) => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再点赞')
      router.push('/login')
      return
    }
    
    try {
      await store.toggleLike(articleId)
      const action = isLiked(articleId) ? '点赞' : '取消点赞'
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
    likedArticles,
    likingArticles,
    isLiked,
    isLiking,
    handleLike
  }
}
