/**
 * 本地存储工具类
 * 用于管理点赞状态等数据的持久化存储
 */

const STORAGE_KEYS = {
  LIKED_ARTICLES: 'liked_articles',
  LIKED_TALKS: 'liked_talks',
  USER_PREFIX: 'user_',
} as const

/**
 * 获取用户特定的存储键
 * @param key 基础键名
 * @param userId 用户ID
 * @returns 用户特定的存储键
 */
function getUserStorageKey(key: string, userId?: string): string {
  if (!userId) return key
  return `${STORAGE_KEYS.USER_PREFIX}${userId}_${key}`
}

/**
 * 安全地解析JSON数据
 * @param data JSON字符串
 * @param defaultValue 默认值
 * @returns 解析后的数据或默认值
 */
function safeJsonParse<T>(data: string | null, defaultValue: T): T {
  if (!data) return defaultValue

  try {
    return JSON.parse(data)
  } catch (error) {
    console.warn('JSON解析失败:', error)
    return defaultValue
  }
}

/**
 * 安全地存储JSON数据
 * @param key 存储键
 * @param data 要存储的数据
 */
function safeJsonStringify(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('存储数据失败:', error)
  }
}

/**
 * 获取已点赞的文章ID列表
 * @param userId 用户ID
 * @returns 已点赞的文章ID数组
 */
export function getLikedArticles(userId?: string): string[] {
  const key = getUserStorageKey(STORAGE_KEYS.LIKED_ARTICLES, userId)
  const data = localStorage.getItem(key)
  return safeJsonParse(data, [])
}

/**
 * 保存已点赞的文章ID列表
 * @param articleIds 文章ID数组
 * @param userId 用户ID
 */
export function saveLikedArticles(articleIds: string[], userId?: string): void {
  const key = getUserStorageKey(STORAGE_KEYS.LIKED_ARTICLES, userId)
  safeJsonStringify(key, articleIds)
}

/**
 * 添加点赞的文章
 * @param articleId 文章ID
 * @param userId 用户ID
 */
export function addLikedArticle(articleId: string, userId?: string): void {
  const likedArticles = getLikedArticles(userId)
  if (!likedArticles.includes(articleId)) {
    likedArticles.push(articleId)
    saveLikedArticles(likedArticles, userId)
  }
}

/**
 * 移除点赞的文章
 * @param articleId 文章ID
 * @param userId 用户ID
 */
export function removeLikedArticle(articleId: string, userId?: string): void {
  const likedArticles = getLikedArticles(userId)
  const index = likedArticles.indexOf(articleId)
  if (index > -1) {
    likedArticles.splice(index, 1)
    saveLikedArticles(likedArticles, userId)
  }
}

/**
 * 获取已点赞的说说ID列表
 * @param userId 用户ID
 * @returns 已点赞的说说ID数组
 */
export function getLikedTalks(userId?: string): string[] {
  const key = getUserStorageKey(STORAGE_KEYS.LIKED_TALKS, userId)
  const data = localStorage.getItem(key)
  return safeJsonParse(data, [])
}

/**
 * 保存已点赞的说说ID列表
 * @param talkIds 说说ID数组
 * @param userId 用户ID
 */
export function saveLikedTalks(talkIds: string[], userId?: string): void {
  const key = getUserStorageKey(STORAGE_KEYS.LIKED_TALKS, userId)
  safeJsonStringify(key, talkIds)
}

/**
 * 添加点赞的说说
 * @param talkId 说说ID
 * @param userId 用户ID
 */
export function addLikedTalk(talkId: string, userId?: string): void {
  const likedTalks = getLikedTalks(userId)
  if (!likedTalks.includes(talkId)) {
    likedTalks.push(talkId)
    saveLikedTalks(likedTalks, userId)
  }
}

/**
 * 移除点赞的说说
 * @param talkId 说说ID
 * @param userId 用户ID
 */
export function removeLikedTalk(talkId: string, userId?: string): void {
  const likedTalks = getLikedTalks(userId)
  const index = likedTalks.indexOf(talkId)
  if (index > -1) {
    likedTalks.splice(index, 1)
    saveLikedTalks(likedTalks, userId)
  }
}

/**
 * 清除用户的所有点赞数据（用户登出时调用）
 * @param userId 用户ID
 */
export function clearUserLikeData(userId?: string): void {
  const articlesKey = getUserStorageKey(STORAGE_KEYS.LIKED_ARTICLES, userId)
  const talksKey = getUserStorageKey(STORAGE_KEYS.LIKED_TALKS, userId)

  localStorage.removeItem(articlesKey)
  localStorage.removeItem(talksKey)
}

/**
 * 检查文章是否已点赞
 * @param articleId 文章ID
 * @param userId 用户ID
 * @returns 是否已点赞
 */
export function isArticleLiked(articleId: string, userId?: string): boolean {
  const likedArticles = getLikedArticles(userId)
  return likedArticles.includes(articleId)
}

/**
 * 检查说说是否已点赞
 * @param talkId 说说ID
 * @param userId 用户ID
 * @returns 是否已点赞
 */
export function isTalkLiked(talkId: string, userId?: string): boolean {
  const likedTalks = getLikedTalks(userId)
  return likedTalks.includes(talkId)
}
