import { defineStore } from 'pinia'
import { likeTalk, unlikeTalk, getTalkLikeStatus } from '@/api/talks'
import { useUserStore } from '@/stores/user'
import {
  getLikedTalks,
  saveLikedTalks,
  addLikedTalk,
  removeLikedTalk,
  clearUserLikeData,
} from '@/utils/storage'
import { createLikeToolkit } from '@/stores/likeBase'

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
    // 便于追踪依赖的已点赞说说ID数组和数量
    likedTalkIds: (state) => Array.from(state.likedTalks),
    likedTalksCount: (state) => Array.from(state.likedTalks).length,

    // 检查说说是否已点赞
    isLiked: (state) => (talkId: string) => {
      return state.likedTalks.has(talkId)
    },

    // 检查说说是否正在处理点赞
    isLiking: (state) => (talkId: string) => {
      return state.likingTalks.has(talkId)
    },
  },

  actions: {
    // 初始化点赞工具（内部使用）
    _initLikeToolkit() {
      if ((this as any)._likeToolkit) return (this as any)._likeToolkit

      const toolkit = createLikeToolkit({
        likedSet: this.likedTalks,
        likingSet: this.likingTalks,
        api: {
          like: likeTalk,
          unlike: unlikeTalk,
          getStatus: getTalkLikeStatus,
        },
        storage: {
          getLiked: getLikedTalks,
          addLiked: addLikedTalk,
          removeLiked: removeLikedTalk,
          saveLiked: saveLikedTalks,
        },
      })

      ;(this as any)._likeToolkit = toolkit
      return toolkit
    },

    // 初始化点赞状态
    async initializeLikeStatus(talkIds: string[] = []) {
      const toolkit = this._initLikeToolkit()
      await toolkit.initializeLikeStatus()
      this.likeStatusInitialized = true
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
      const toolkit = this._initLikeToolkit()
      return await toolkit.like(talkId)
    },

    // 取消点赞
    async unlikeTalk(talkId: string) {
      const toolkit = this._initLikeToolkit()
      return await toolkit.unlike(talkId)
    },

    // 切换点赞状态
    async toggleLike(talkId: string) {
      const toolkit = this._initLikeToolkit()
      return await toolkit.toggle(talkId)
    },
  },
})
