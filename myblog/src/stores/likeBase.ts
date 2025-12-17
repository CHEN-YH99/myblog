import { useUserStore } from '@/stores/user'

export type LikeApi = {
  like: (id: string) => Promise<any>
  unlike: (id: string) => Promise<any>
  getStatus?: (id: string) => Promise<any>
  getBatchStatus?: (ids: string[]) => Promise<Record<string, boolean>>
}

export type LikeStorage = {
  getLiked: (userKey?: string) => string[]
  addLiked: (id: string, userKey?: string) => void
  removeLiked: (id: string, userKey?: string) => void
  saveLiked?: (ids: string[], userKey?: string) => void
}

export type LikeToolkitConfig = {
  // required reactive state refs/objects from store
  likedSet: Set<string>
  likingSet: Set<string>
  lastActionAt?: Map<string, number>
  getCooldownMs?: () => number

  // external deps
  api: LikeApi
  storage: LikeStorage

  // optional helpers
  getAllKnownIds?: () => string[]
  // 用于实体上的计数更新（如文章 likes 数）
  onOptimisticDelta?: (id: string, delta: 1 | -1) => void
  onServerSync?: (id: string, serverResult: any) => void
}

export function createLikeToolkit(config: LikeToolkitConfig) {
  const {
    likedSet,
    likingSet,
    lastActionAt,
    getCooldownMs,
    api,
    storage,
    getAllKnownIds,
    onOptimisticDelta,
    onServerSync,
  } = config

  const getUserKeys = async () => {
    const userStore = useUserStore()
    if (!userStore.userInfo && userStore.token) {
      try {
        await userStore.fetchUserInfo()
      } catch (e) {
        // ignore
      }
    }
    const idKey = userStore.userInfo?.id
    const nameKey = userStore.userInfo?.username
    return { idKey, nameKey, isLoggedIn: !!userStore.isLoggedIn }
  }

  async function initializeLikeStatus() {
    const userStore = useUserStore()

    if (!userStore.isLoggedIn) {
      likedSet.clear()
      return
    }

    // 获取用户键（可能两个键都存在）
    const { idKey, nameKey } = await getUserKeys()

    if (!idKey && !nameKey) {
      likedSet.clear()
      return
    }

    // 本地存储合并（按 id 与 username 双键）
    const savedById = idKey ? storage.getLiked(idKey) : []
    const savedByName = nameKey ? storage.getLiked(nameKey) : []
    const mergedSaved = Array.from(new Set([...(savedById || []), ...(savedByName || [])]))

    // 清空现有集合
    likedSet.clear()

    // 如果有 getBatchStatus 且能获取到已知实体ID，则与服务端合并
    const allIds = getAllKnownIds?.() || []
    if (api.getBatchStatus && allIds.length > 0) {
      try {
        const serverStatus = await api.getBatchStatus(allIds)
        const merged = new Set<string>(mergedSaved)
        Object.entries(serverStatus || {}).forEach(([id, isLiked]) => {
          if (isLiked) merged.add(id)
        })
        likedSet.clear()
        merged.forEach((id) => likedSet.add(id))
        const finalArr = Array.from(likedSet)
        if (idKey) storage.saveLiked?.(finalArr, idKey)
        if (nameKey) storage.saveLiked?.(finalArr, nameKey)
        return
      } catch (e) {
        // 失败则回退到本地
      }
    }

    // 默认：仅使用本地存储（适用于无 batch 的场景，如说说）
    mergedSaved.forEach((id) => likedSet.add(id))
  }

  async function like(id: string, opts?: { force?: boolean }) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) throw new Error('请先登录')

    const now = Date.now()
    const last = lastActionAt?.get(id) || 0
    const cooldown = getCooldownMs?.() ?? 0

    if (!opts?.force && cooldown > 0 && now - last < cooldown) return
    if (!opts?.force && likingSet.has(id)) return

    lastActionAt?.set(id, now)
    likingSet.add(id)

    // 已是点赞状态则直接返回
    if (!opts?.force && likedSet.has(id)) {
      likingSet.delete(id)
      return
    }

    // 乐观更新
    likedSet.add(id)
    onOptimisticDelta?.(id, 1)

    const { idKey, nameKey } = await getUserKeys()
    if (idKey) storage.addLiked(id, idKey)
    if (nameKey) storage.addLiked(id, nameKey)

    try {
      const result = await api.like(id)
      onServerSync?.(id, result)
      return result
    } catch (e) {
      // 回滚
      likedSet.delete(id)
      onOptimisticDelta?.(id, -1)
      if (idKey) storage.removeLiked(id, idKey)
      if (nameKey) storage.removeLiked(id, nameKey)
      throw e
    } finally {
      likingSet.delete(id)
    }
  }

  async function unlike(id: string, opts?: { force?: boolean }) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) throw new Error('请先登录')

    const now = Date.now()
    const last = lastActionAt?.get(id) || 0
    const cooldown = getCooldownMs?.() ?? 0

    if (!opts?.force && cooldown > 0 && now - last < cooldown) return
    if (!opts?.force && likingSet.has(id)) return

    if (!likedSet.has(id) && !opts?.force) return

    lastActionAt?.set(id, now)
    likingSet.add(id)

    // 乐观更新
    likedSet.delete(id)
    onOptimisticDelta?.(id, -1)

    try {
      const result = await api.unlike(id)

      const { idKey, nameKey } = await getUserKeys()
      if (idKey) storage.removeLiked(id, idKey)
      if (nameKey) storage.removeLiked(id, nameKey)

      onServerSync?.(id, result)
      return result
    } catch (e) {
      // 回滚
      likedSet.add(id)
      onOptimisticDelta?.(id, 1)
      throw e
    } finally {
      likingSet.delete(id)
    }
  }

  async function reconcileLikeStatus(id: string): Promise<boolean> {
    if (!api.getStatus) return likedSet.has(id)
    try {
      const status = await api.getStatus(id)
      const isLiked = !!(status as any)?.isLiked
      const { idKey, nameKey } = await getUserKeys()
      if (isLiked) {
        likedSet.add(id)
        if (idKey) storage.addLiked(id, idKey)
        if (nameKey) storage.addLiked(id, nameKey)
      } else {
        likedSet.delete(id)
        if (idKey) storage.removeLiked(id, idKey)
        if (nameKey) storage.removeLiked(id, nameKey)
      }
      return isLiked
    } catch {
      return likedSet.has(id)
    }
  }

  async function toggle(id: string) {
    if (likedSet.has(id)) {
      try {
        return await unlike(id)
      } catch (e: any) {
        const code = e?.code || e?.response?.status
        if (code === 400) {
          const server = await reconcileLikeStatus(id)
          if (server) {
            return await unlike(id, { force: true })
          }
        }
        throw e
      }
    } else {
      try {
        return await like(id)
      } catch (e: any) {
        const code = e?.code || e?.response?.status
        if (code === 400) {
          const server = await reconcileLikeStatus(id)
          if (server) {
            return await unlike(id, { force: true })
          } else {
            return await like(id, { force: true })
          }
        }
        throw e
      }
    }
  }

  return {
    initializeLikeStatus,
    like,
    unlike,
    toggle,
    reconcileLikeStatus,
  }
}

