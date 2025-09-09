import { computed } from 'vue'
import { useArticlesStore } from '@/stores/getarticles'
import { ElMessage } from 'element-plus'

export function useLikes() {
  const store = useArticlesStore()
  
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
    try {
      await store.toggleLike(articleId)
      const action = isLiked(articleId) ? '点赞' : '取消点赞'
      ElMessage.success(`${action}成功！`)
    } catch (error) {
      ElMessage.error('操作失败，请稍后重试')
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
