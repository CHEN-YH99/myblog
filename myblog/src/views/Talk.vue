<template>
  <div class="talk-page-wrapper">
    <div class="talk-page">
      <!-- 页面头部 -->
      <div class="page_header">
        <div class="large-img">
          <img src="../assets/images/chat.jpg" alt="说说页面头图" />
          <div class="inner-header flex">
            <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">说说</h1>
          </div>
        </div>
        <!-- 海水波浪 -->
        <WaveContainer />
      </div>

      <!-- 说说容器 -->
      <div class="talk-container animate__animated animate__slideInUp">
        <!-- 加载状态 -->
        <div class="loading-container" v-if="loading">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-container" v-else-if="talkList.length === 0">
          <div class="empty-content">
            <i class="icon-empty">📝</i>
            <h3>暂无说说</h3>
            <p>还没有发布任何说说哦~</p>
          </div>
        </div>

        <!-- 说说列表 -->
        <transition-group
          v-else
          name="stagger"
          tag="div"
          class="talk-list"
          appear
        >
          <div
            class="talk-item"
            v-for="(talk, index) in talkList"
            :key="talk._id"
            :class="{ 'is-top': talk.isTop }"
            :style="{ '--delay': (index % 12) * 40 + 'ms' }"
          >
            <!-- 发布者头像（左上角） -->
            <el-avatar class="talk-author-avatar" :size="40" :src="avatarUrl" alt="avatar" />

            <!-- 置顶标识 -->
            <div class="top-badge" v-if="talk.isTop">
              <i class="icon-pin">📌</i>
              置顶
            </div>

            <!-- 说说内容 -->
            <div class="talk-content">
              <div
                class="content-text"
                v-html="getCachedFormattedContent(talk.content)"
              ></div>

              <!-- 图片展示 -->
              <div
                class="content-images"
                v-if="talk.images && talk.images.length > 0"
              >
                <div
                  class="image-grid"
                  :class="`grid-${Math.min(talk.images.length, 9)}`"
                >
                  <div
                    class="image-item"
                    v-for="(image, index) in talk.images.slice(0, 9)"
                    :key="index"
                    @click="previewImage(talk.images, index)"
                  >
                    <img
                      :src="getImageUrl(image)"
                      :alt="`图片${index + 1}`"
                      loading="lazy"
                      @error="handleImageError"
                    />
                    <!-- 更多图片提示 -->
                    <div
                      class="more-images-overlay"
                      v-if="index === 8 && talk.images.length > 9"
                    >
                      {{ talk.images.length - 9 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 说说元信息 -->
            <div class="talk-meta">
              <div class="meta-left">
                <span class="publish-time">
                  <i class="icon-time">🕒</i>
                  {{ getCachedFormattedTime(talk.publishDate) }}
                </span>

                <!-- 位置信息 -->
                <span class="location-info" v-if="talk.location">
                  <i class="icon-location">📍</i>
                  {{ talk.location }}
                </span>

                <!-- 心情信息 -->
                <span class="mood-info" v-if="talk.mood">
                  <i class="icon-mood">{{ getMoodEmoji(talk.mood) }}</i>
                  {{ talk.mood }}
                </span>

                <!-- 天气信息 -->
                <span class="weather-info" v-if="talk.weather">
                  <i class="icon-weather">
                    {{ getWeatherEmoji(talk.weather) }}
                  </i>
                  {{ talk.weather }}
                </span>
              </div>
            </div>

            <!-- 说说交互区域 -->
            <div class="talk-actions">
              <div class="action-left">
                <!-- 点赞按钮 -->
                <button
                  class="action-btn like-btn"
                  :class="{ liked: talkLikeStatus[talk._id] }"
                  @click="debouncedLikeTalk(talk)"
                  :disabled="likingTalks.has(talk._id)"
                >
                  <i class="icon-like">
                    {{ talkLikeStatus[talk._id] ? '❤️' : '🤍' }}
                  </i>
                  <span class="action-text">{{ talk.likes || 0 }}</span>
                </button>

                <!-- 回复按钮 -->
                <button
                  class="action-btn reply-btn"
                  @click="toggleReplySection(talk._id)"
                >
                  <i class="icon-reply">💬</i>
                  <span class="action-text">
                    回复 ({{ getTalkReplyCount(talk._id) }})
                  </span>
                </button>

                <!-- 浏览数 -->
                <!-- <span class="view-count">
                  <i class="icon-view">👁️</i>
                  <span class="action-text">{{ talk.views || 0 }}</span>
                </span> -->
              </div>
            </div>

            <!-- 回复区域 -->
            <transition name="expand">
              <div
                class="reply-section"
                v-if="activeReplyTalkId === talk._id"
                :key="`reply-${talk._id}`"
              >
                <!-- 回复表单 -->
                <div class="reply-form">
                  <!-- 当前登录用户头像 -->
                  <el-avatar class="reply-form-avatar" :size="34" :src="displayAvatar" alt="avatar" />
                  <div class="form-header">
                    <h4>发表回复</h4>
                    <button
                      class="close-btn"
                      @click="closeReplySection"
                      title="关闭回复"
                    >
                      ✕
                    </button>
                  </div>

                  <div class="form-body">
                    <!-- 简化回复表单，只保留回复内容 -->
                    <div class="form-group">
                      <label for="reply-content">回复内容 *</label>
                      <textarea
                        id="reply-content"
                        v-model="replyForm.content"
                        placeholder="说点什么吧..."
                        rows="4"
                        maxlength="500"
                        required
                      ></textarea>
                      <div class="char-count">
                        {{ replyForm.content.length }}/500
                      </div>
                    </div>

                    <div class="form-actions">
                      <button
                        class="submit-btn"
                        @click="submitReply(talk._id)"
                        :disabled="!canSubmitReply || submittingReply"
                      >
                        {{ submittingReply ? '发布中...' : '发布回复' }}
                      </button>
                      <button
                        class="cancel-btn"
                        @click="closeReplySection"
                        :disabled="submittingReply"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 回复列表 -->
                <div
                  class="replies-list"
                  v-if="talkReplies[talk._id]?.length > 0"
                >
                  <div class="replies-header">
                    <h4 class="replies-title">
                      回复 ({{ talkReplies[talk._id]?.length || 0 }})
                    </h4>
                    <button
                      class="toggle-replies-btn"
                      @click="toggleRepliesExpanded(talk._id)"
                      :class="{ expanded: repliesExpanded[talk._id] }"
                    >
                      <i class="icon-toggle">
                        {{ repliesExpanded[talk._id] ? '🔽' : '▶️' }}
                      </i>
                      <span>
                        {{ repliesExpanded[talk._id] ? '收起' : '展开' }}
                      </span>
                    </button>
                  </div>

                  <div
                    class="replies-content"
                    v-show="repliesExpanded[talk._id]"
                    :class="{ expanded: repliesExpanded[talk._id] }"
                  >
                    <div
                      class="reply-item"
                      v-for="reply in talkReplies[talk._id]"
                      :key="reply._id"
                    >
                      <div class="reply-header">
                        <div class="reply-author">
                          <span class="author-name">{{ reply.author }}</span>
                          <span class="reply-time">{{
                            getCachedFormattedTime(reply.publishDate)
                          }}</span>
                        </div>
                        <div class="reply-actions">
                          <button
                            class="reply-like-btn"
                            :class="{ liked: replyLikeStatus[reply._id] }"
                            @click="debouncedLikeReply(reply)"
                            :disabled="likingReplies.has(reply._id)"
                          >
                            <i class="icon-like">
                              {{ replyLikeStatus[reply._id] ? '❤️' : '🤍' }}
                            </i>
                            <span>{{ reply.likes || 0 }}</span>
                          </button>
                        </div>
                      </div>

                      <div class="reply-content">
                        <div v-if="reply.replyTo" class="reply-to">
                          回复 @{{ reply.replyTo }}:
                        </div>
                        <div
                          class="reply-text"
                          v-html="getCachedFormattedContent(reply.content)"
                        ></div>
                      </div>

                      <!-- 子回复 -->
                      <div
                        class="sub-replies"
                        v-if="Array.isArray(reply.children) && reply.children.length > 0"
                      >
                        <div
                          class="sub-reply-item"
                          v-for="subReply in reply.children"
                          :key="subReply._id"
                        >
                          <div class="sub-reply-header">
                            <span class="sub-reply-author">
                              {{ subReply.author }}
                            </span>
                            <span class="sub-reply-time">{{
                              getCachedFormattedTime(subReply.publishDate)
                            }}</span>
                          </div>
                          <div class="sub-reply-content">
                            <div v-if="subReply.replyTo" class="reply-to">
                              回复 @{{ subReply.replyTo }}:
                            </div>
                            <div
                              class="sub-reply-text"
                              v-html="getCachedFormattedContent(subReply.content)"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 加载更多回复 -->
                    <div
                      class="load-more-replies"
                      v-if="hasMoreReplies[talk._id] && repliesExpanded[talk._id]"
                    >
                      <button
                        class="load-more-btn"
                        @click="loadAllReplies(talk._id)"
                        :disabled="loadingReplies.has(talk._id)"
                      >
                        {{
                          loadingReplies.has(talk._id)
                            ? '加载中...'
                            : '加载全部回复'
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </transition-group>

        <!-- 加载更多按钮 -->
        <div
          class="load-more-section"
          v-if="!loading && talkList.length > 0 && !isEnd"
        >
          <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
            <div class="btn-content">
              <div class="loading-spinner" v-if="loadingMore">
                <div class="spinner-dots">
                  <div class="dot dot-1"></div>
                  <div class="dot dot-2"></div>
                  <div class="dot dot-3"></div>
                </div>
              </div>
              <div class="btn-icon" v-else>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4V20M20 12H4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
              <span class="btn-text">
                {{ loadingMore ? '加载中...' : '加载更多' }}
              </span>
            </div>
          </button>
        </div>

        <!-- 结束提示 -->
        <div class="end-tip" v-if="!loading && isEnd && talkList.length > 0">
          <div class="end-content">
            <i class="end-icon">🎉</i>
            <span>已经到底啦，没有更多内容了</span>
          </div>
        </div>

        <!-- 图片预览模态框 -->
        <teleport to="body">
        <div class="image-preview-modal" v-if="showPreview" @click="closePreview">
          <div class="modal-content" @click.stop>
            <button class="close-btn" @click="closePreview">
              <i class="icon-close">✕</i>
            </button>

            <div class="preview-container">
              <button
                class="nav-btn prev-nav"
                v-if="previewImages.length > 1"
                @click.stop="prevImage"
                :disabled="currentImageIndex <= 0"
                aria-label="上一张"
              >
                <i class="icon-prev">‹</i>
              </button>

              <div class="image-wrapper">
                <img
                  :src="getImageUrl(previewImages[currentImageIndex])"
                  :alt="`预览图片 ${currentImageIndex + 1}`"
                  class="preview-image"
                  :style="{ opacity: previewLoading ? 0 : 1, transition: 'opacity .3s' }"
                  @load="previewLoading = false"
                  @error="handlePreviewImageError"
                />
              </div>

              <button
                class="nav-btn next-nav"
                v-if="previewImages.length > 1"
                @click.stop="nextImage"
                :disabled="currentImageIndex >= previewImages.length - 1"
                aria-label="下一张"
              >
                <i class="icon-next">›</i>
              </button>
            </div>

            <div class="preview-info" v-if="previewImages.length > 1">
              {{ currentImageIndex + 1 }} / {{ previewImages.length }}
            </div>
          </div>
        </div>
        </teleport>
      </div>
    </div>
    <!-- 回到顶部控件（带入场/离场动画） -->
    <transition
      appear
      enter-active-class="animate__animated animate__slideInUp"
      leave-active-class="animate__animated animate__slideOutDown"
    >
      <el-backtop
        v-show="backTopVisible"
        :visibility-height="-1"
        class="backtop"
        target="body"
      />
    </transition>
    <!-- 页脚组件 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTalkList, getTalkReplies, addTalkReply, likeReply, unlikeReply } from '@/api/talks'
import { useUserStore } from '@/stores/user'
import { useTalkLikes } from '@/composables/useTalkLikes'
import { useTalksStore } from '@/stores/talks'
import WaveContainer from '@/components/WaveContainer.vue'
import avatarUrl from '@/assets/images/v2-df52ef03e0e38da113052148ef1ff2a6_r.jpg'
import '@/assets/style/common/headpicture.scss'
import Footer from '@/components/Footer.vue'
import { debounce, debounceAsync } from '@/utils/debounce'

// ==================== 类型定义 ====================
interface Talk {
  _id: string
  content: string
  images?: string[]
  isTop?: boolean
  isHidden?: boolean
  status: number
  publishDate: string
  createdAt: string
  updatedAt: string
  views?: number
  likes?: number
  location?: string
  mood?: string
  weather?: string
}

interface Reply {
  _id: string
  talkId: string
  content: string
  author: string
  email?: string
  website?: string
  avatar?: string
  parentId?: string
  replyTo?: string
  publishDate: string
  status: 'approved' | 'pending' | 'rejected'
  likes: number
  isDeleted: boolean
  children?: Reply[]
}

// ==================== 实例和Store ====================
const router = useRouter()
const userStore = useUserStore()
const talksStore = useTalksStore()
const { isLiked: isLikedByStore, handleLike: handleLikeByStore } = useTalkLikes()

// 当前登录用户头像（用于回复表单展示），逻辑与 NavBar 组件保持一致
const getDefaultAvatar = (name: string) => {
  const safeName = name || 'User'
  const colors = ['409eff', '67c23a', 'e6a23c', 'f56c6c', '909399']
  const color = colors[safeName.length % colors.length]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${color}&color=fff&size=200`
}
const displayAvatar = computed(() => {
  const user = userStore.userInfo
  if (user && user.avatar) return user.avatar
  const name = user?.nickname || user?.username || (user?.id ? String(user.id) : 'User')
  return getDefaultAvatar(name)
})

// ==================== 基础响应式数据 ====================
const loading = ref(false)
const talkList = ref<Talk[]>([])
const pagination = ref({
  current: 1,
  size: 10,
  total: 0,
})

// ==================== 图片预览相关 ====================
const showPreview = ref(false)
const previewImages = ref<string[]>([])
const currentImageIndex = ref(0)
const previewLoading = ref(true)

// ==================== 无限滚动状态 ====================
const isEnd = ref(false)
const loadingMore = ref(false)

// ==================== 点赞和回复相关状态 ====================
const talkLikeStatus = ref<Record<string, boolean>>({})
const replyLikeStatus = ref<Record<string, boolean>>({})
const likingTalks = ref<Set<string>>(new Set())
const likingReplies = ref<Set<string>>(new Set())
const activeReplyTalkId = ref<string>('')
const talkReplies = ref<Record<string, Reply[]>>({})
const talkReplyCount = ref<Record<string, number>>({})
const loadingReplies = ref<Set<string>>(new Set())
const hasMoreReplies = ref<Record<string, boolean>>({})
const submittingReply = ref(false)
const repliesExpanded = ref<Record<string, boolean>>({})

// ==================== 回复表单数据 ====================
const replyForm = ref({
  content: '',
})

// ==================== 计算属性 ====================
/**
 * 是否可以提交回复
 */
const canSubmitReply = computed(() => {
  return replyForm.value.content.trim().length > 0
})

/**
 * 缓存的格式化时间函数
 */
const formatTimeCache = new Map<string, string>()
const getCachedFormattedTime = (dateStr: string): string => {
  if (formatTimeCache.has(dateStr)) {
    return formatTimeCache.get(dateStr)!
  }
  const formatted = formatTime(dateStr)
  formatTimeCache.set(dateStr, formatted)
  return formatted
}

/**
 * 缓存的内容格式化函数
 */
const formatContentCache = new Map<string, string>()
const getCachedFormattedContent = (content: string): string => {
  if (formatContentCache.has(content)) {
    return formatContentCache.get(content)!
  }
  const formatted = formatContent(content)
  formatContentCache.set(content, formatted)
  return formatted
}

/**
 * 防抖的点赞函数
 */
const debouncedLikeTalk = debounceAsync(async (talk: Talk) => {
  await handleLikeTalk(talk)
}, 300)

/**
 * 防抖的回复点赞函数
 */
const debouncedLikeReply = debounceAsync(async (reply: Reply) => {
  await handleLikeReply(reply)
}, 300)

// ==================== 数据获取方法 ====================
/**
 * 获取说说列表
 */
const fetchTalkList = async () => {
  try {
    loading.value = true
    const response = await getTalkList({
      current: pagination.value.current,
      size: pagination.value.size,
      status: 'public', // 只获取公开的说说
    })

    if (response && response.records) {
      // 确保每个说说都有正确的likes字段
      const processedTalks = response.records.map((talk) => ({
        ...talk,
        likes: talk.likes || 0, // 确保likes字段存在且为数字
      }))

      // 如果是加载更多（current > 1），则累加；否则重置
      if (pagination.value.current > 1) {
        talkList.value = [...talkList.value, ...processedTalks]
      } else {
        talkList.value = processedTalks
      }

      pagination.value.total = response.total || 0
      pagination.value.current = response.current || 1
      pagination.value.size = response.size || pagination.value.size

      // 判断是否已经到底
      const reachedEndByCount = talkList.value.length >= pagination.value.total
      const reachedEndByPage = response.records.length < pagination.value.size
      isEnd.value = reachedEndByCount || reachedEndByPage

      // 每次获取说说列表后，初始化回复数量
      await initializeReplyCountForNewTalks()
    } else {
      talkList.value = []
      pagination.value.total = 0
      isEnd.value = true
    }
  } catch (error) {
    console.error('获取说说列表失败:', error)
    talkList.value = []
    pagination.value.total = 0
    isEnd.value = true
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多说说
 */
const loadMore = async () => {
  if (loading.value || loadingMore.value || isEnd.value) return
  if (
    talkList.value.length >= pagination.value.total &&
    pagination.value.total > 0
  ) {
    isEnd.value = true
    return
  }

  loadingMore.value = true

  try {
    // 添加最小延迟确保用户能看到加载动画
    const startTime = Date.now()
    const minDelay = 800 // 最小显示800ms的加载动画

    pagination.value.current += 1
    await fetchTalkList()

    // 确保加载动画至少显示指定时间
    const elapsedTime = Date.now() - startTime
    if (elapsedTime < minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, minDelay - elapsedTime),
      )
    }
  } catch (error) {
    console.error('加载更多失败:', error)
    // 如果加载失败，回退页码
    pagination.value.current -= 1
  } finally {
    loadingMore.value = false
  }
}

/**
 * 重置列表并拉取第一页
 */
const resetTalks = async () => {
  pagination.value.current = 1
  pagination.value.size = 10
  pagination.value.total = 0
  talkList.value = []
  isEnd.value = false
  await fetchTalkList()
}

// ==================== 内容格式化方法 ====================
/**
 * 格式化内容，支持换行和简单的markdown语法
 */
const formatContent = (content: string) => {
  if (!content) return ''
  // 将换行符转换为 <br> 标签，并处理其他格式
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

/**
 * 获取图片URL
 */
const getImageUrl = (image: string) => {
  if (!image) return ''
  if (image.startsWith('http')) return image
  return `http://localhost:3001${image}`
}

/**
 * 处理图片加载错误
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='
}

/**
 * 处理预览大图加载错误（避免预览区白屏）
 */
const handlePreviewImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  handleImageError(event)
  previewLoading.value = false
  // 如果预览图加载失败，自动尝试切换到下一张（或上一张）
  if (previewImages.value.length > 1) {
    if (currentImageIndex.value < previewImages.value.length - 1) {
      currentImageIndex.value++
    } else if (currentImageIndex.value > 0) {
      currentImageIndex.value--
    }
  }
}

// ==================== 时间和状态格式化 ====================
/**
 * 格式化时间为相对时间
 */
const formatTime = (dateString: string) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }

  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }

  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 获取状态文本
 */
const getStatusText = (status: number | string) => {
  if (typeof status === 'number') {
    return status === 1 ? '公开' : '私密'
  }
  return status === 'public' ? '公开' : '私密'
}

/**
 * 获取心情表情
 */
const getMoodEmoji = (mood: string) => {
  const moodMap: Record<string, string> = {
    开心: '😊',
    快乐: '😄',
    兴奋: '🤩',
    满足: '😌',
    平静: '😐',
    无聊: '😑',
    疲惫: '😴',
    难过: '😢',
    生气: '😠',
    焦虑: '😰',
    惊讶: '😲',
    思考: '🤔',
  }
  return moodMap[mood] || '😊'
}

/**
 * 获取天气表情
 */
const getWeatherEmoji = (weather: string) => {
  const weatherMap: Record<string, string> = {
    晴天: '☀️',
    多云: '⛅',
    阴天: '☁️',
    小雨: '🌦️',
    中雨: '🌧️',
    大雨: '⛈️',
    雪天: '❄️',
    雾天: '🌫️',
    风天: '💨',
    炎热: '🔥',
    寒冷: '🧊',
  }
  return weatherMap[weather] || '☀️'
}

// ==================== 分页相关 ====================
/**
 * 切换页码
 */
const changePage = (page: number) => {
  if (
    page < 1 ||
    page > Math.ceil(pagination.value.total / pagination.value.size)
  ) {
    return
  }
  pagination.value.current = page
  fetchTalkList()

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
/**
 * 获取分页页码数组
 */
const getPageNumbers = () => {
  const current = pagination.value.current
  const total = Math.ceil(pagination.value.total / pagination.value.size)
  const pages: (number | string)[] = []

  if (total <= 7) {
    // 总页数小于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数大于7，显示省略号
    if (current <= 4) {
      // 当前页在前面
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后面
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
}

// ==================== 图片预览相关 ====================
/**
 * 预览图片
 */
const previewImage = (images: string[], index: number) => {
  previewLoading.value = true
  previewImages.value = images
  currentImageIndex.value = index
  showPreview.value = true
  document.body.style.overflow = 'hidden'
}

/**
 * 关闭图片预览
 */
const closePreview = () => {
  showPreview.value = false
  document.body.style.overflow = ''
}

/**
 * 上一张图片
 */
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    previewLoading.value = true
    currentImageIndex.value--
  }
}

/**
 * 下一张图片
 */
const nextImage = () => {
  if (currentImageIndex.value < previewImages.value.length - 1) {
    previewLoading.value = true
    currentImageIndex.value++
  }
}

// ==================== 事件处理 ====================
/**
 * 键盘事件处理
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!showPreview.value) return

  switch (event.key) {
    case 'Escape':
      closePreview()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

/**
 * 页面可见性变化处理（用于前台自动刷新）
 */
const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchTalkList()
  }
}

const handleWindowFocus = () => {
  fetchTalkList()
}

// ==================== 点赞相关方法 ====================
/**
 * 处理说说点赞
 */
const handleLikeTalk = async (talk: Talk) => {
  if (likingTalks.value.has(talk._id)) return

  try {
    likingTalks.value.add(talk._id)

    // 记录操作前的状态
    const wasLiked = isLikedByStore(talk._id)

    // 使用统一的点赞处理逻辑（只传递一个参数）
    await handleLikeByStore(talk._id)

    // 更新本地状态以保持一致性
    const isNowLiked = isLikedByStore(talk._id)
    talkLikeStatus.value[talk._id] = isNowLiked

    // 更新点赞数
    if (!wasLiked && isNowLiked) {
      // 点赞：增加1
      talk.likes = (talk.likes || 0) + 1
    } else if (wasLiked && !isNowLiked) {
      // 取消点赞：减少1
      talk.likes = Math.max(0, (talk.likes || 0) - 1)
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
  } finally {
    likingTalks.value.delete(talk._id)
  }
}

// 点赞回复
const handleLikeReply = async (reply: Reply) => {
  if (likingReplies.value.has(reply._id)) return

  // 检查用户是否已登录
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再点赞')
    router.push('/login')
    return
  }

  try {
    likingReplies.value.add(reply._id)
    const isLiked = replyLikeStatus.value[reply._id]

    if (isLiked) {
      await unlikeReply(reply._id)
      replyLikeStatus.value[reply._id] = false
      reply.likes = Math.max(0, reply.likes - 1)
    } else {
      await likeReply(reply._id)
      replyLikeStatus.value[reply._id] = true
      reply.likes = reply.likes + 1
    }
  } catch (error) {
    console.error('回复点赞操作失败:', error)
  } finally {
    likingReplies.value.delete(reply._id)
  }
}

// 切换回复区域
const toggleReplySection = async (talkId: string) => {
  if (activeReplyTalkId.value === talkId) {
    closeReplySection()
  } else {
    activeReplyTalkId.value = talkId
    // 加载回复列表
    await loadTalkReplies(talkId)
    // 默认展开回复列表
    repliesExpanded.value[talkId] = true
  }
}

// 关闭回复区域
const closeReplySection = () => {
  activeReplyTalkId.value = ''
  // 重置表单
  replyForm.value = {
    content: '',
  }
}

// 加载说说回复
const loadTalkReplies = async (talkId: string) => {
  if (loadingReplies.value.has(talkId)) return

  try {
    loadingReplies.value.add(talkId)
    const response = (await getTalkReplies(talkId, { current: 1, size: 10 })) as Api.Reply.ReplyList

    if (response && response.records) {
      talkReplies.value[talkId] = response.records
      hasMoreReplies.value[talkId] = response.records.length >= 10
    } else {
      talkReplies.value[talkId] = []
      hasMoreReplies.value[talkId] = false
    }
  } catch (error) {
    console.error('加载回复失败:', error)
    talkReplies.value[talkId] = []
    hasMoreReplies.value[talkId] = false
  } finally {
    loadingReplies.value.delete(talkId)
  }
}

// 加载更多回复
const loadMoreReplies = async (talkId: string) => {
  if (loadingReplies.value.has(talkId)) return

  try {
    loadingReplies.value.add(talkId)
    const currentReplies = talkReplies.value[talkId] || []
    const current = Math.floor(currentReplies.length / 10) + 1

    const response = (await getTalkReplies(talkId, { current, size: 10 })) as Api.Reply.ReplyList

    if (response && response.records) {
      talkReplies.value[talkId] = [...currentReplies, ...response.records]
      hasMoreReplies.value[talkId] = response.records.length >= 10
    } else {
      hasMoreReplies.value[talkId] = false
    }
  } catch (error) {
    console.error('加载更多回复失败:', error)
    hasMoreReplies.value[talkId] = false
  } finally {
    loadingReplies.value.delete(talkId)
  }
}

// 加载全部回复
const loadAllReplies = async (talkId: string) => {
  if (loadingReplies.value.has(talkId)) return

  try {
    loadingReplies.value.add(talkId)

    // 获取回复总数
    const totalCount = talkReplyCount.value[talkId] || 0
    if (totalCount === 0) {
      hasMoreReplies.value[talkId] = false
      return
    }

    // 一次性加载所有回复
    const response = (await getTalkReplies(talkId, {
      current: 1,
      size: totalCount,
    })) as Api.Reply.ReplyList

    if (response && response.records) {
      talkReplies.value[talkId] = response.records
      hasMoreReplies.value[talkId] = false // 已加载全部，不再显示"加载更多"按钮
    } else {
      hasMoreReplies.value[talkId] = false
    }
  } catch (error) {
    console.error('加载全部回复失败:', error)
    hasMoreReplies.value[talkId] = false
  } finally {
    loadingReplies.value.delete(talkId)
  }
}

// 提交回复
const submitReply = async (talkId: string) => {
  if (!canSubmitReply.value || submittingReply.value) return

  // 检查用户是否已登录
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再发表回复')
    router.push('/login')
    return
  }

  try {
    submittingReply.value = true

    const replyData = {
      content: replyForm.value.content.trim(),
      author:
        userStore.userInfo?.nickname ||
        userStore.userInfo?.username ||
        '匿名用户',
    }

    // 正确调用API：传递talkId和replyData两个参数
    await addTalkReply(talkId, replyData)

    // 重新加载回复列表，这会更新回复数量
    await loadTalkReplies(talkId)

    // 更新回复总数
    const currentReplies = talkReplies.value[talkId] || []
    if (currentReplies.length > 0) {
      // 如果有回复数据，重新获取准确的总数
      try {
        const response = (await getTalkReplies(talkId, {
          current: 1,
          size: 1,
        })) as Api.Reply.ReplyList
        talkReplyCount.value[talkId] = response?.total || currentReplies.length
      } catch (error) {
        // 如果获取失败，至少增加1（新增的回复）
        talkReplyCount.value[talkId] = (talkReplyCount.value[talkId] || 0) + 1
      }
    }

    // 重置表单
    replyForm.value = {
      content: '', // 清空内容
    }

    // 提交成功后，回复数量会自动更新，因为getTalkReplyCount依赖于talkReplies
    // 无需手动刷新页面，响应式数据会自动更新UI
  } catch (error) {
    console.error('提交回复失败:', error)
  } finally {
    submittingReply.value = false
  }
}

// 切换回复展开状态
const toggleRepliesExpanded = (talkId: string) => {
  repliesExpanded.value[talkId] = !repliesExpanded.value[talkId]
}

// 获取说说回复数量
const getTalkReplyCount = (talkId: string): number => {
  // 优先使用从API获取的总数，如果没有则使用已加载的回复数量
  return talkReplyCount.value[talkId] ?? talkReplies.value[talkId]?.length ?? 0
}

// 初始化点赞状态
const initializeLikeStatus = async () => {
  // 只初始化store的点赞状态，不传入talkIds
  await talksStore.initializeLikeStatus()

  // 同步本地状态 - 确保新说说默认为未点赞状态
  for (const talk of talkList.value) {
    talkLikeStatus.value[talk._id] = isLikedByStore(talk._id)
  }
}

// 初始化回复数量
const initializeReplyCount = async () => {
  for (const talk of talkList.value) {
    try {
      const response = (await getTalkReplies(talk._id, {
        current: 1,
        size: 1,
      })) as Api.Reply.ReplyList
      // 保存真实的回复总数
      talkReplyCount.value[talk._id] = response?.total || 0
      // console.log(`初始化说说 ${talk._id} 的回复数量: ${talkReplyCount.value[talk._id]}`)
    } catch (error) {
      // console.error('获取回复数量失败:', error)
      talkReplyCount.value[talk._id] = 0
    }
  }
}

// 为新加载的说说初始化回复数量（避免重复初始化）
const initializeReplyCountForNewTalks = async () => {
  for (const talk of talkList.value) {
    // 只为还没有初始化回复数据的说说获取回复总数
    if (talkReplyCount.value[talk._id] === undefined) {
      try {
        const response = (await getTalkReplies(talk._id, {
          current: 1,
          size: 1,
        })) as Api.Reply.ReplyList
        // 保存真实的回复总数
        talkReplyCount.value[talk._id] = response?.total || 0
        // console.log(`初始化新说说 ${talk._id} 的回复数量: ${talkReplyCount.value[talk._id]}`)
      } catch (error) {
        // console.error('获取回复数量失败:', error)
        talkReplyCount.value[talk._id] = 0
      }
    }
  }
}

// 生命周期
onMounted(async () => {
  await resetTalks()
  // 初始化点赞状态和回复数量（并行执行以提高性能）
  await Promise.all([initializeLikeStatus(), initializeReplyCount()])

  document.addEventListener('keydown', handleKeydown)
  // 页面可见性或窗口获取焦点时自动刷新，确保与后台同步
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

// 监听点赞状态变化，保持实时同步
watch(
  () => talksStore.likedTalks,
  (newLikedTalks) => {
    // 同步本地状态
    for (const talk of talkList.value) {
      talkLikeStatus.value[talk._id] = newLikedTalks.has(talk._id)
    }
  },
  { deep: true },
)

// 监听用户登录状态变化
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      // 用户登录后重新初始化点赞状态
      await initializeLikeStatus()
    } else {
      // 用户登出后重置点赞状态
      talksStore.resetLikeStatus()
      for (const talk of talkList.value) {
        talkLikeStatus.value[talk._id] = false
      }
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  // 清理缓存
  formatTimeCache.clear()
  formatContentCache.clear()

  // 取消防抖函数
  debouncedLikeTalk.cancel()
  debouncedLikeReply.cancel()
})
// 回到顶部-动画可见性控制（增强版：同时监听 window/document/body/html + wheel/touchmove）
const backTopVisible = ref(false)
const backTopThreshold = 200
const getScrollTop = () => {
  try {
    return (
      (document.documentElement && document.documentElement.scrollTop) ||
      (document.body && document.body.scrollTop) ||
      window.pageYOffset ||
      0
    )
  } catch {
    return 0
  }
}
const setBackTopVisibility = () => {
  backTopVisible.value = getScrollTop() > backTopThreshold
}
// 统一防抖，避免滚动频繁触发动画
const onBackTopScroll = debounce(setBackTopVisibility, 150)

let _backTopScrollTargets: EventTarget[] = []

onMounted(() => {
  const bodyEl = document.body
  const docEl = document.documentElement
  _backTopScrollTargets = [window, document, bodyEl, docEl].filter(Boolean) as EventTarget[]
  _backTopScrollTargets.forEach((t) => {
    t.addEventListener?.('scroll', onBackTopScroll as any, { passive: true })
    t.addEventListener?.('wheel', onBackTopScroll as any, { passive: true })
    t.addEventListener?.('touchmove', onBackTopScroll as any, { passive: true })
  })
  setBackTopVisibility()
})

onUnmounted(() => {
  _backTopScrollTargets.forEach((t) => {
    t.removeEventListener?.('scroll', onBackTopScroll as any)
    t.removeEventListener?.('wheel', onBackTopScroll as any)
    t.removeEventListener?.('touchmove', onBackTopScroll as any)
  })
  _backTopScrollTargets = []
})
</script>

<style scoped>
/* 主题变量（局部作用于本页面） */
.talk-page-wrapper {
  --bg-start: #0f172a; /* slate-900 */
  --bg-end: #1e293b;   /* slate-800 */
  --card-bg: #ffffff;
  --card-border: rgba(0, 0, 0, 0.1);
  --text-primary: #1a1a1a;
  --text-secondary: #475569;
  --muted: #94a3b8;
  --pill-bg: rgba(15, 23, 42, 0.06);
  --pill-text: #0f172a;
  --accent-1: #6366f1; /* indigo-500 */
  --accent-2: #8b5cf6; /* violet-500 */
  --shadow: 0 10px 30px rgba(2, 6, 23, 0.15);
  --divider-color: rgba(0, 0, 0, 0.12);
}

@media (prefers-color-scheme: dark) {
  /* 强制深色分割线为白色 */
  .talk-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
  }
  .talk-page-wrapper, 
  .dark .talk-page-wrapper {
    --bg-start: #0b1020;
    --bg-end: #0f172a;
    --card-bg: #1a1a1a;
    --card-border: rgba(255, 255, 255, 0.15);
    --text-primary: #ffffff;
    --text-secondary: #cbd5e1;
    --muted: #94a3b8;
    --pill-bg: rgba(226, 232, 240, 0.08);
    --pill-text: #e2e8f0;
    --shadow: 0 10px 30px rgba(15, 23, 42, 0.4);
    --divider-color: rgba(255, 255, 255, 0.6);
  }

  .talk-item {
    border-bottom-color: var(--divider-color) !important;
  }
}

.talk-page {
  min-height: 100vh;
  /* 使用全局主题背景，避免覆盖主题切换动画 */
  background: transparent;
}

.talk-container {
  position: relative;
  z-index: 2;
  margin-top: -1px; /* 消除缝隙 */
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

/* 说说列表容器宽度（比页面容器略窄一些） */
.talk-list {
  max-width: 980px;
  margin: 0 auto;
}

/* 现代响应式网格卡片布局 */
.talk-list {
  display: grid;
  grid-template-columns: 1fr; /* 所有分辨率下都为单列 */
  gap: 0;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.1);
  /* background: var(--card-bg); */
  border: 1px solid var(--card-border);
  overflow: hidden; /* 保证子元素不会溢出圆角 */
}

.talk-item {
  position: relative;
  padding: 1.5rem; /* 调整内边距以获得更好的观感 */
  padding-left: 4.25rem; /* 给左上角头像留空间 */
  transition: background-color 0.3s ease;
  border-bottom: 1px solid var(--divider-color);
}

/* 说说发布者头像（左上角） */
.talk-author-avatar {
  position: absolute;
  top: 1.15rem;
  left: 1.15rem;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
}

.talk-list > .talk-item:last-child {
  border-bottom: none; /* 最后一个条目没有下边框 */
}

.talk-item:hover {
  background-color: rgba(0, 0, 0, 0.03); /* 鼠标悬浮时增加一个细微的背景变化 */
}

.talk-item.is-top {
  background-color: rgba(251, 113, 133, 0.05); /* rose-400 with low opacity */
}

/* 置顶徽章 */
.top-badge {
  position: absolute;
  top: 1.5rem; /* 与内边距对齐 */
  right: 1.5rem; /* 与内边距对齐 */
  background: var(--accent-1);
  color: #fff;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

/* 内容 */
.talk-content { margin-bottom: 0.75rem; }

.content-text {
  font-size: 1rem;
  line-height: 1.8;
  /* color: var(--text-primary); */
  letter-spacing: 0.2px;
}

.content-text :deep(p) { margin: 0 0 0.75rem; }
.content-text :deep(p:last-child) { margin-bottom: 0; }

/* 图片网格 - 微信朋友圈风格微调 */
.content-images { margin-top: 0.75rem; }

.image-grid {
  display: grid;
  gap: 3px;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 280px;
}

.image-grid.grid-1 { grid-template-columns: 1fr; max-width: 90px; }
.image-grid.grid-2 { grid-template-columns: 1fr 1fr; max-width: 180px; }
.image-grid.grid-3 { grid-template-columns: 1fr 1fr 1fr; max-width: 270px; }
.image-grid.grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; max-width: 180px; }
.image-grid.grid-5,
.image-grid.grid-6 { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); max-width: 270px; }
.image-grid.grid-7,
.image-grid.grid-8,
.image-grid.grid-9 { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); max-width: 270px; }

.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.2s ease;
}
.image-item:hover { transform: scale(1.02); }
.image-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.image-item:hover img { transform: scale(1.04); }

.more-images-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.55);
  color: #fff; display:flex; align-items:center; justify-content:center;
  font-size: 0.9rem; font-weight: 700; backdrop-filter: blur(2px);
}



/* 元信息 */
.talk-meta {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 0.75rem;
  font-size: 0.9rem; 
}
.meta-left { display:flex; align-items:center; gap: 0.5rem; flex-wrap: wrap; }

.publish-time,
.location-info,
.mood-info,
.weather-info {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.6rem; border-radius: 9999px;
  /* background: var(--pill-bg); color: var(--pill-text); */
  border: 1px solid rgba(148, 163, 184, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.publish-time:hover,
.location-info:hover,
.mood-info:hover,
.weather-info:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(2,6,23,0.12); }

/* 动作区域 */
.talk-actions { margin-top: 0.75rem; padding-top: 0.75rem; }
.action-left { display:flex; align-items:center; gap: 0.6rem; flex-wrap: wrap; }

.action-btn {
  display:inline-flex; align-items:center; gap:0.5rem;
  padding: 0.5rem 0.9rem; border: 1px solid rgba(148,163,184,0.25);
  /* background: rgba(255,255,255,0.55); */
   border-radius: 9999px; cursor: pointer;
  transition: all 0.25s ease; backdrop-filter: blur(6px);
}
.action-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(2,6,23,0.12); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.like-btn.liked { color: #ef4444; background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.25); animation: pop 300ms ease; }
.like-btn.liked:hover { background: rgba(239, 68, 68, 0.12); }

@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }

.view-count { display:inline-flex; align-items:center; gap:0.4rem; color: var(--muted); font-size: 0.9rem; }

/* 回复区域 */
.reply-section { margin-top: 1rem; padding-top: 1rem; }
.reply-form {  position: relative; border: 1px solid rgba(148,163,184,0.25); border-radius: 12px; padding: 1rem; padding-left: 3.6rem; margin-bottom: 1rem; }
.reply-form-avatar {
  position: absolute;
  top: 0.95rem;
  left: 0.95rem;
}
.form-header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 0.75rem; }
.form-header h4 { margin: 0;  font-size: 1rem; }
.close-btn { background: none; border: none; font-size: 1.1rem; cursor:pointer;  padding: 0.25rem; border-radius: 6px; transition: background 0.2s ease, color 0.2s ease; }
.close-btn:hover { background: rgba(148,163,184,0.15); color: var(--text-secondary); }

.form-group { display:flex; flex-direction: column; gap: 0.45rem; }
.form-group label { font-weight: 600;  font-size: 0.9rem; }
.form-group textarea { padding: 0.75rem; border: 1px solid rgba(148,163,184,0.35); border-radius: 10px; font-size: 0.95rem; background: rgba(255, 254, 254, 0.993); color: var(--text-primary); transition: border-color 0.25s ease, box-shadow 0.25s ease; }
.form-group textarea:focus { outline:none; border-color: var(--accent-1); box-shadow: 0 0 0 4px rgba(99,102,241,0.15); }
.char-count { text-align:right; font-size: 0.8rem;  }

.form-actions { display:flex; gap: 0.6rem; justify-content: flex-end; }
.submit-btn, .cancel-btn { padding: 0.6rem 1.1rem; border: none; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.25s ease; }
.submit-btn { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color: #fff; box-shadow: 0 10px 18px rgba(99,102,241,0.25); }
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 22px rgba(99,102,241,0.35); }
.submit-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
.cancel-btn { background: rgba(148,163,184,0.15);  }
.cancel-btn:hover:not(:disabled) { background: rgba(148,163,184,0.25); transform: translateY(-1px); }

/* 回复列表 */
.replies-header { display:flex; justify-content: space-between; align-items:center; margin-bottom: 0.75rem; padding: 0.6rem 0.75rem;  border:1px solid rgba(148,163,184,0.25); border-radius: 10px; }
.replies-title { margin:0;  font-size: 1rem; font-weight: 700; display:flex; align-items:center; gap: 0.4rem; }
.toggle-replies-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem; border:none; background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color:#fff; border-radius: 9999px; cursor:pointer; box-shadow: 0 8px 18px rgba(99,102,241,0.3); transition: transform 0.25s ease, box-shadow 0.25s ease; }
.toggle-replies-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(99,102,241,0.4); }

.replies-content {
  margin-top: 0.5rem;
  max-height: 480px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.3);
    border-radius: 99px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.5);
  }
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-item {
  background: rgba(255, 250, 250, 0.996);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 0.9rem;
  transition: transform 0.25s ease, background 0.25s ease;
  flex-shrink: 0; /* 防止压缩 */
}
.reply-item:hover { transform: translateX(4px); background: rgba(255,255,255,0.65); }
.reply-header { display:flex; justify-content: space-between; align-items:center; margin-bottom: 0.6rem; }
.reply-author { display:flex; align-items:center; gap: 0.6rem; }
.author-name { font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
.reply-time { color: var(--muted); font-size: 0.8rem; }
.reply-actions { display:flex; align-items:center; }
.reply-like-btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.35rem 0.7rem; border:none; background: rgba(148,163,184,0.12); border-radius: 9999px; cursor:pointer; font-size:0.85rem; color: var(--text-secondary); transition: all 0.25s ease; }
.reply-like-btn:hover { transform: translateY(-1px); }
.reply-like-btn.liked { background: rgba(239,68,68,0.15); color: #ef4444; }

.reply-to { color: var(--accent-1); font-size: 0.9rem; margin-bottom: 0.35rem; font-weight: 600; }
.reply-text { color: var(--text-primary); line-height: 1.65; font-size: 0.95rem; margin: 0; }

/* 加载更多区域 */
.load-more-section { display:flex; justify-content:center; align-items:center; padding: 2rem 0 0.5rem; }
.load-more-btn { position:relative; display:flex; align-items:center; justify-content:center; padding: 0.9rem 2rem; border:none; background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); color:#fff; border-radius: 9999px; cursor:pointer; font-weight: 700; letter-spacing: 0.3px; transition: all 0.3s ease; box-shadow: 0 12px 30px rgba(99,102,241,0.35); min-width: 160px; }
.load-more-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 18px 36px rgba(99,102,241,0.45); }
.load-more-btn:disabled { background: linear-gradient(135deg, #94a3b8, #64748b); cursor: not-allowed; transform:none; box-shadow: none; }
.btn-content { display:flex; align-items:center; justify-content:center; gap: 0.6rem; }
.spinner-dots { display:flex; align-items:center; gap: 4px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; animation: dotPulse 1.4s ease-in-out infinite both; }
.dot-1 { animation-delay: -0.32s; }
.dot-2 { animation-delay: -0.16s; }
.dot-3 { animation-delay: 0s; }
@keyframes dotPulse { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

.end-tip { text-align:center;  padding: 0.75rem 0; display:flex; justify-content:center; align-items:center; gap: 0.5rem; }

/* 进入/列表动画 */
.stagger-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.stagger-enter-active { transition: all 420ms cubic-bezier(0.22, 1, 0.36, 1); transition-delay: var(--delay, 0ms); }
.stagger-enter-to { opacity: 1; transform: translateY(0) scale(1); }
.stagger-leave-from { opacity: 1; transform: scale(1); }
.stagger-leave-active { transition: all 260ms ease; }
.stagger-leave-to { opacity: 0; transform: scale(0.98); }
.stagger-move { transition: transform 380ms ease; }

/* 展开动画 */
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-6px); }
.expand-enter-active, .expand-leave-active { transition: all 260ms ease; }

/* 加载与空状态 */
.loading-container,
.empty-container { display:flex; justify-content:center; align-items:center; min-height: 300px; color: #e2e8f0; }
.loading-spinner { text-align:center; }
.spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.25); border-top: 4px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-content { text-align:center; }
.empty-content .icon-empty { font-size: 2.2rem; display:block; margin-bottom: 0.5rem; }
.empty-content h3 { font-size: 1.3rem; margin-bottom: 0.25rem; }

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}
.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.modal-content .close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  padding: 0.6rem;
  border-radius: 9999px;
  transition: background 0.2s ease;
}
.modal-content .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 2rem;
  padding: 1rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);
}
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.08);
}
.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.nav-btn.prev-nav {
  left: 0.75rem;
}
.nav-btn.next-nav {
  right: 0.75rem;
}
.preview-info {
  position: absolute;
  left: 50%;
  bottom: 0.75rem;
  transform: translateX(-50%);
  color: #fff;
  font-size: 0.95rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  backdrop-filter: blur(10px);
}

/* 响应式补充 */
@media (max-width: 480px) {
  .talk-container { padding: 0 0.5rem 2rem; }
  .modal-content { padding: 0; }
  .nav-btn.prev-nav { left: -2rem; }
  .nav-btn.next-nav { right: -2rem; }
  .form-actions { flex-direction: column; }
  .submit-btn, .cancel-btn { width: 100%; }
}
</style>

