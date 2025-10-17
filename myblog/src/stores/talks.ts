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
        this.likedTalks.clear()
        this.likeStatusInitialized = true
        return
      }

      try {
        // 等待用户信息完全加载
        let userInfo = userStore.userInfo
        if (!userInfo && userStore.token) {
          // 如果有token但没有用户信息，尝试获取用户信息
          try {
            userInfo = await userStore.fetchUserInfo()
          } catch (error) {
            console.warn('获取用户信息失败，使用空状态初始化点赞状态')
            this.likedTalks.clear()
            this.likeStatusInitialized = true
            return
          }
        }
        
        // 从本地存储获取已点赞的说说ID（用户键：优先使用id，兜底使用username）
        const userKey = userInfo?.id || userInfo?.username
        if (!userKey) {
          console.warn('无法获取用户标识，使用空状态初始化点赞状态')
          this.likedTalks.clear()
          this.likeStatusInitialized = true
          return
        }
        
        const localLikedTalks = getLikedTalks(userKey)
        
        // 清空当前状态
        this.likedTalks.clear()
        
        // 如果有本地存储的点赞数据，先恢复本地状态
        if (localLikedTalks.length > 0) {
          localLikedTalks.forEach(id => this.likedTalks.add(id))
        }
        
        // 对于新用户或没有本地存储数据的用户，确保不会错误地标记任何说说为已点赞
        // 只有在本地存储中明确记录的说说才会被标记为已点赞
        
        this.likeStatusInitialized = true
        console.log('说说点赞状态初始化完成，已点赞说说数量:', this.likedTalks.size)
      } catch (error) {
        console.error('初始化说说点赞状态失败:', error)
        // 即使出错，也要确保新用户从干净的状态开始
        this.likedTalks.clear()
        this.likeStatusInitialized = true
      }
    },
    
    // 重置点赞状态（用户登出时调用）
    resetLikeStatus() {
      const userStore = useUserStore()
      const id = userStore.userInfo?.id
      const username = userStore.userInfo?.username
      
      // 清除localStorage中的数据（同时尝试按id与username清理，避免残留）
      clearUserLikeData(id)
      clearUserLikeData(username)
      
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
        
        // 保存到localStorage（按用户键隔离）
        const userKey = userStore.userInfo?.id || userStore.userInfo?.username
        addLikedTalk(talkId, userKey)

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
        
        // 从localStorage移除（按用户键隔离）
        const userKey = userStore.userInfo?.id || userStore.userInfo?.username
        removeLikedTalk(talkId, userKey)
        
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