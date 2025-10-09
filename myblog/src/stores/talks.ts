import { defineStore } from 'pinia'
import { likeTalk, unlikeTalk, getTalkLikeStatus } from '@/api/talks'
import { useUserStore } from '@/stores/user'
import { 
  getLikedTalks, 
  saveLikedTalks, 
  addLikedTalk, 
  removeLikedTalk,
  clearUserLikeData 
} from '@/utils/storage'

export const useTalksStore = defineStore('talks', {
  state: () => ({
    // 用户已点赞的说说ID集合
    likedTalks: new Set<string>(),
    
    // 正在处理点赞的说说ID集合
    likingTalks: new Set<string>(),
    
    // 点赞状态初始化标记
    likeStatusInitialized: false,
  }),

  getters: {
    // 检查说说是否已点赞
    isLiked: (state) => (talkId: string) => {
      return state.likedTalks.has(talkId)
    },
    
    // 检查说说是否正在处理点赞
    isLiking: (state) => (talkId: string) => {
      return state.likingTalks.has(talkId)
    }
  },

  actions: {
    // 初始化点赞状态
    async initializeLikeStatus(talkIds: string[] = []) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        this.likeStatusInitialized = true
        return
      }

      try {
        // 从本地存储获取已点赞的说说ID
        const userId = userStore.userInfo?._id
        const localLikedTalks = getLikedTalks(userId)
        
        // 如果传入了talkIds，优先使用传入的ID（来自服务器）
        if (talkIds.length > 0) {
          this.likedTalks.clear()
          talkIds.forEach(id => this.likedTalks.add(id))
          // 同步到本地存储
          saveLikedTalks(userId, Array.from(this.likedTalks))
        } else if (localLikedTalks.length > 0) {
          // 如果没有传入talkIds，使用本地存储的数据
          this.likedTalks.clear()
          localLikedTalks.forEach(id => this.likedTalks.add(id))
        }
        
        this.likeStatusInitialized = true
        console.log('说说点赞状态初始化完成，已点赞说说数量:', this.likedTalks.size)
      } catch (error) {
        console.error('初始化说说点赞状态失败:', error)
        this.likeStatusInitialized = true
      }
    },
    
    // 重置点赞状态（用户登出时调用）
    resetLikeStatus() {
      const userStore = useUserStore()
      const userId = userStore.userInfo?._id
      
      // 清除localStorage中的数据
      clearUserLikeData(userId)
      
      // 清除内存中的状态
      this.likedTalks.clear()
      this.likeStatusInitialized = false
    },

    // 点赞说说
    async likeTalk(talkId: string) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      if (this.likingTalks.has(talkId)) return // 防止重复点击

      this.likingTalks.add(talkId)

      try {
        const result = await likeTalk(talkId)

        // 更新本地状态
        this.likedTalks.add(talkId)
        
        // 保存到localStorage
        const userId = userStore.userInfo?._id
        addLikedTalk(talkId, userId)

        return result
      } catch (error) {
        console.error('点赞失败:', error)
        throw error
      } finally {
        this.likingTalks.delete(talkId)
      }
    },
  
    // 取消点赞
    async unlikeTalk(talkId: string) {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      if (this.likingTalks.has(talkId)) return
      
      this.likingTalks.add(talkId)
      
      try {
        const result = await unlikeTalk(talkId)
        
        this.likedTalks.delete(talkId)
        
        // 从localStorage移除
        const userId = userStore.userInfo?._id
        removeLikedTalk(talkId, userId)
        
        return result
      } catch (error) {
        console.error('取消点赞失败:', error)
        throw error
      } finally {
        this.likingTalks.delete(talkId)
      }
    },
    
    // 切换点赞状态
    async toggleLike(talkId: string) {
      const isLiked = this.likedTalks.has(talkId)
      return isLiked ? this.unlikeTalk(talkId) : this.likeTalk(talkId)
    }
  }
})