import { computed, ref } from 'vue'
import { useArticlesStore } from '@/stores/getarticles'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { debounce } from '@/utils/performance'

// 类型定义
interface LikeState {
  isLiking: boolean
  lastLikeTime: number
}

interface UseLikesOptions {
  debounceDelay?: number
  cooldownTime?: number
}

/**
 * 文章点赞功能的组合式函数
 * 提供点赞状态管理和点赞操作
 */
export function useLikes(options: UseLikesOptions = {}) {
  const { debounceDelay = 300, cooldownTime = 1000 } = options

  const articlesStore = useArticlesStore()
  const userStore = useUserStore()

  // 本地状态管理
  const likingStates = ref<Map<string, LikeState>>(new Map())
  const lastOperationTime = ref(0)

  // 计算属性
  const likedArticles = computed(() => articlesStore.likedArticles)
  const likingArticles = computed(() => {
    const result = new Set<string>()
    likingStates.value.forEach((state, articleId) => {
      if (state.isLiking) {
        result.add(articleId)
      }
    })
    return result
  })

  // 工具函数
  const createLikeHelpers = () => {
    const isLiked = (articleId: string): boolean => {
      try {
        return likedArticles.value.has(articleId)
      } catch (error) {
        console.warn('检查点赞状态失败:', error)
        return false
      }
    }

    const isLiking = (articleId: string): boolean => {
      try {
        const state = likingStates.value.get(articleId)
        return state?.isLiking ?? false
      } catch (error) {
        console.warn('检查点赞中状态失败:', error)
        return false
      }
    }

    const canLike = (articleId: string): boolean => {
      const now = Date.now()
      const state = likingStates.value.get(articleId)

      // 检查是否正在点赞中
      if (state?.isLiking) {
        return false
      }

      // 检查冷却时间
      if (state?.lastLikeTime && now - state.lastLikeTime < cooldownTime) {
        return false
      }

      // 检查全局操作频率
      if (now - lastOperationTime.value < debounceDelay) {
        return false
      }

      return true
    }

    const setLikingState = (articleId: string, isLiking: boolean) => {
      const currentState = likingStates.value.get(articleId) || { isLiking: false, lastLikeTime: 0 }
      likingStates.value.set(articleId, {
        ...currentState,
        isLiking,
        lastLikeTime: isLiking ? Date.now() : currentState.lastLikeTime,
      })
    }

    return { isLiked, isLiking, canLike, setLikingState }
  }

  const { isLiked, isLiking, canLike, setLikingState } = createLikeHelpers()

  // 验证函数
  const validateUser = (): boolean => {
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再进行点赞操作')
      return false
    }
    return true
  }

  const validateArticle = (articleId: string): boolean => {
    if (!articleId || typeof articleId !== 'string') {
      ElMessage.error('文章ID无效')
      return false
    }
    return true
  }

  const performLikeOperation = async (articleId: string, shouldLike: boolean): Promise<boolean> => {
    try {
      if (shouldLike) {
        await articlesStore.likeArticle(articleId)
        ElMessage.success('点赞成功')
      } else {
        await articlesStore.unlikeArticle(articleId)
        ElMessage.success('取消点赞成功')
      }
      return true
    } catch (error) {
      console.error('点赞操作失败:', error)

      // 根据错误类型提供详细的提示信息
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()

        // 网络连接相关错误
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('连接') ||
          errorMessage.includes('econnrefused') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch')
        ) {
          ElMessage.error('网络连接失败，请检查网络连接或稍后重试')
        }
        // 服务器错误
        else if (
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504') ||
          errorMessage.includes('服务器')
        ) {
          ElMessage.error('服务器暂时不可用，请稍后重试')
        }
        // 权限相关错误
        else if (
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('权限') ||
          errorMessage.includes('unauthorized')
        ) {
          ElMessage.error('登录已过期，请重新登录')
        }
        // 请求参数错误
        else if (errorMessage.includes('400') || errorMessage.includes('参数')) {
          ElMessage.error('请求参数错误，请刷新页面后重试')
        }
        // 资源不存在
        else if (errorMessage.includes('404')) {
          ElMessage.error('文章不存在或已被删除')
        }
        // 其他具体错误
        else {
          ElMessage.error(`操作失败: ${error.message}`)
        }
      } else {
        ElMessage.error('操作失败，请重试')
      }
      return false
    }
  }

  // 点赞操作处理
  const createLikeHandler = () => {
    const handleLike = async (articleId: string): Promise<void> => {
      // 验证用户登录状态
      if (!validateUser()) {
        return
      }

      // 验证文章ID
      if (!validateArticle(articleId)) {
        return
      }

      // 检查是否可以执行点赞操作
      if (!canLike(articleId)) {
        ElMessage.warning('操作过于频繁，请稍后再试')
        return
      }

      const currentlyLiked = isLiked(articleId)
      const shouldLike = !currentlyLiked

      // 设置点赞中状态
      setLikingState(articleId, true)
      lastOperationTime.value = Date.now()

      try {
        // 执行点赞/取消点赞（由 Store 内部负责乐观更新与回滚）
        await performLikeOperation(articleId, shouldLike)
      } catch (error) {
        // 发生异常时回滚UI状态
        if (shouldLike) {
          articlesStore.likedArticles.delete(articleId)
        } else {
          articlesStore.likedArticles.add(articleId)
        }
        console.error('点赞操作异常:', error)
        ElMessage.error('操作异常，请重试')
      } finally {
        // 清除点赞中状态
        setLikingState(articleId, false)
      }
    }

    // 创建防抖版本的点赞处理函数
    const debouncedHandleLike = debounce(handleLike, debounceDelay)

    return { handleLike: debouncedHandleLike }
  }

  const { handleLike } = createLikeHandler()

  // 批量操作
  const createBatchOperations = () => {
    const batchLike = async (articleIds: string[]): Promise<void> => {
      if (!validateUser()) {
        return
      }

      const validIds = articleIds.filter((id) => validateArticle(id))
      if (validIds.length === 0) {
        return
      }

      try {
        ElMessage.info(`正在批量点赞 ${validIds.length} 篇文章...`)

        const results = await Promise.allSettled(
          validIds.map((id) => performLikeOperation(id, true)),
        )

        const successCount = results.filter(
          (result) => result.status === 'fulfilled' && result.value,
        ).length

        ElMessage.success(`批量点赞完成，成功 ${successCount}/${validIds.length} 篇`)
      } catch (error) {
        console.error('批量点赞失败:', error)
        ElMessage.error('批量点赞失败')
      }
    }

    const clearLikingStates = () => {
      likingStates.value.clear()
    }

    return { batchLike, clearLikingStates }
  }

  const { batchLike, clearLikingStates } = createBatchOperations()

  // 统计信息
  const getLikeStats = () => {
    return computed(() => ({
      totalLiked: likedArticles.value.size,
      currentlyLiking: likingArticles.value.size,
      canPerformAction: userStore.isLoggedIn,
    }))
  }

  const likeStats = getLikeStats()

  return {
    // 状态
    likedArticles,
    likingArticles,
    likeStats,

    // 检查函数
    isLiked,
    isLiking,
    canLike,

    // 操作函数
    handleLike,
    batchLike,

    // 工具函数
    clearLikingStates,
  }
}
