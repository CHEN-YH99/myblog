<template>
  <div class="talk-page">
    <!-- 页面头部 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/chat.jpeg" alt="" />
        <div class="inner-header flex">
          <h1 class="animate__animated animate__backInDown">说说</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    

    <!-- 说说列表 -->
    <div class="talk-container">
      <div class="talk-list" v-if="!loading && talkList.length > 0">
        <div 
          class="talk-item" 
          v-for="talk in talkList" 
          :key="talk._id"
          :class="{ 'is-top': talk.isTop }"
        >
          <!-- 置顶标识 -->
          <div class="top-badge" v-if="talk.isTop">
            <i class="icon-pin">📌</i>
            置顶
          </div>

          <!-- 说说内容 -->
          <div class="talk-content">
            <div class="content-text" v-html="getCachedFormattedContent(talk.content)"></div>
            
            <!-- 图片展示 -->
            <div class="content-images" v-if="talk.images && talk.images.length > 0">
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
                <i class="icon-weather">{{ getWeatherEmoji(talk.weather) }}</i>
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
                :class="{ 'liked': talkLikeStatus[talk._id] }"
                @click="debouncedLikeTalk(talk)"
                :disabled="likingTalks.has(talk._id)"
              >
                <i class="icon-like">{{ talkLikeStatus[talk._id] ? '❤️' : '🤍' }}</i>
                <span class="action-text">{{ talk.likes || 0 }}</span>
              </button>

              <!-- 回复按钮 -->
              <button 
                class="action-btn reply-btn"
                @click="toggleReplySection(talk._id)"
              >
                <i class="icon-reply">💬</i>
                <span class="action-text">回复 ({{ getTalkReplyCount(talk._id) }})</span>
              </button>

              <!-- 浏览数 -->
              <span class="view-count">
                <i class="icon-view">👁️</i>
                <span class="action-text">{{ talk.views || 0 }}</span>
              </span>
            </div>
          </div>

          <!-- 回复区域 -->
          <div 
            class="reply-section" 
            v-if="activeReplyTalkId === talk._id"
            :key="`reply-${talk._id}`"
          >
            <!-- 回复表单 -->
            <div class="reply-form">
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
                  <div class="char-count">{{ replyForm.content.length }}/500</div>
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
            <div class="replies-list" v-if="talkReplies[talk._id]?.length > 0">
              <div class="replies-header">
                <h4 class="replies-title">
                  回复 ({{ talkReplies[talk._id]?.length || 0 }})
                </h4>
                <button 
                  class="toggle-replies-btn"
                  @click="toggleRepliesExpanded(talk._id)"
                  :class="{ 'expanded': repliesExpanded[talk._id] }"
                >
                  <i class="icon-toggle">{{ repliesExpanded[talk._id] ? '🔽' : '▶️' }}</i>
                  <span>{{ repliesExpanded[talk._id] ? '收起' : '展开' }}</span>
                </button>
              </div>
              
              <div 
                class="replies-content"
                v-show="repliesExpanded[talk._id]"
                :class="{ 'expanded': repliesExpanded[talk._id] }"
              >
                <div 
                  class="reply-item"
                  v-for="reply in talkReplies[talk._id]"
                  :key="reply._id"
                >
                <div class="reply-header">
                  <div class="reply-author">
                    <span class="author-name">{{ reply.author }}</span>
                    <span class="reply-time">{{ getCachedFormattedTime(reply.publishDate) }}</span>
                  </div>
                  <div class="reply-actions">
                    <button 
                      class="reply-like-btn"
                      :class="{ 'liked': replyLikeStatus[reply._id] }"
                      @click="debouncedLikeReply(reply)"
                      :disabled="likingReplies.has(reply._id)"
                    >
                      <i class="icon-like">{{ replyLikeStatus[reply._id] ? '❤️' : '🤍' }}</i>
                      <span>{{ reply.likes || 0 }}</span>
                    </button>
                  </div>
                </div>
                
                <div class="reply-content">
                  <div v-if="reply.replyTo" class="reply-to">
                    回复 @{{ reply.replyTo }}:
                  </div>
                  <div class="reply-text" v-html="getCachedFormattedContent(reply.content)"></div>
                </div>

                <!-- 子回复 -->
                <div class="sub-replies" v-if="Array.isArray(reply.children) && reply.children.length > 0">
                  <div 
                    class="sub-reply-item"
                    v-for="subReply in reply.children"
                    :key="subReply._id"
                  >
                    <div class="sub-reply-header">
                      <span class="sub-reply-author">{{ subReply.author }}</span>
                      <span class="sub-reply-time">{{ getCachedFormattedTime(subReply.publishDate) }}</span>
                    </div>
                    <div class="sub-reply-content">
                      <div v-if="subReply.replyTo" class="reply-to">
                        回复 @{{ subReply.replyTo }}:
                      </div>
                      <div class="sub-reply-text" v-html="getCachedFormattedContent(subReply.content)"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多回复 -->
              <div class="load-more-replies" v-if="hasMoreReplies[talk._id] && repliesExpanded[talk._id]">
                <button 
                  class="load-more-btn"
                  @click="loadAllReplies(talk._id)"
                  :disabled="loadingReplies.has(talk._id)"
                >
                  {{ loadingReplies.has(talk._id) ? '加载中...' : '加载全部回复' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-container" v-if="!loading && talkList.length === 0">
        <div class="empty-content">
          <i class="icon-empty">📝</i>
          <h3>暂无说说</h3>
          <p>还没有发布任何说说哦~</p>
        </div>
      </div>

      <!-- 分页：已隐藏，使用无限滚动替代 -->
      <div class="pagination-container" v-if="false">
        <div class="pagination">
          <button 
            class="page-btn prev-btn" 
            :disabled="pagination.current <= 1"
            @click="changePage(pagination.current - 1)"
          >
            <i class="icon-prev">‹</i>
            上一页
          </button>
          <div class="page-numbers">
            <button 
              v-for="page in getPageNumbers()" 
              :key="page"
              class="page-number"
              :class="{ active: page === pagination.current, ellipsis: page === '...' }"
              :disabled="page === '...'"
              @click="page !== '...' && changePage(Number(page))"
            >
              {{ page }}
            </button>
          </div>
          <button 
            class="page-btn next-btn" 
            :disabled="pagination.current >= Math.ceil(pagination.total / pagination.size)"
            @click="changePage(pagination.current + 1)"
          >
            下一页
            <i class="icon-next">›</i>
          </button>
        </div>
      </div>

      <!-- 加载更多按钮 -->
      <div class="load-more-section" v-if="!loading && talkList.length > 0 && !isEnd">
        <button 
          class="load-more-btn"
          @click="loadMore"
          :disabled="loadingMore"
        >
          <div class="btn-content">
            <div class="loading-spinner" v-if="loadingMore">
              <div class="spinner-dots">
                <div class="dot dot-1"></div>
                <div class="dot dot-2"></div>
                <div class="dot dot-3"></div>
              </div>
            </div>
            <div class="btn-icon" v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="btn-text">{{ loadingMore ? '加载中...' : '加载更多' }}</span>
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
    </div>

    <!-- 图片预览模态框 -->
    <div class="image-preview-modal" v-if="showPreview" @click="closePreview">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closePreview">
          <i class="icon-close">✕</i>
        </button>
        
        <div class="preview-container">
          <button 
            class="nav-btn prev-nav" 
            v-if="previewImages.length > 1"
            @click="prevImage"
            :disabled="currentImageIndex <= 0"
          >
            <i class="icon-prev">‹</i>
          </button>
          
          <div class="image-wrapper">
            <img 
              :src="getImageUrl(previewImages[currentImageIndex])" 
              :alt="`预览图片 ${currentImageIndex + 1}`"
              class="preview-image"
            />
          </div>
          
          <button 
            class="nav-btn next-nav" 
            v-if="previewImages.length > 1"
            @click="nextImage"
            :disabled="currentImageIndex >= previewImages.length - 1"
          >
            <i class="icon-next">›</i>
          </button>
        </div>
        
        <div class="preview-info" v-if="previewImages.length > 1">
          {{ currentImageIndex + 1 }} / {{ previewImages.length }}
        </div>
      </div>
    </div>
    </div>
  </div>
  <!-- 页脚组件 -->
  <Footer />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTalkList, likeTalk, unlikeTalk, getTalkLikeStatus, getTalkReplies, addTalkReply, likeReply, unlikeReply } from '@/api/talks'
import { useUserStore } from '@/stores/user'
import { useTalkLikes } from '@/composables/useTalkLikes'
import { useTalksStore } from '@/stores/talks'
import WaveContainer from '@/components/WaveContainer.vue'
import '@/assets/style/common/headpicture.scss'
import Footer from '@/components/Footer.vue'
import { debounceAsync } from '@/utils/debounce'

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

// ==================== 基础响应式数据 ====================
const loading = ref(false)
const talkList = ref<Talk[]>([])
const pagination = ref({
  current: 1,
  size: 10,
  total: 0
})

// ==================== 图片预览相关 ====================
const showPreview = ref(false)
const previewImages = ref<string[]>([])
const currentImageIndex = ref(0)

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
  content: ''
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
      status: 'public' // 只获取公开的说说
    })
    
    if (response && response.records) {
      // 确保每个说说都有正确的likes字段
      const processedTalks = response.records.map(talk => ({
        ...talk,
        likes: talk.likes || 0 // 确保likes字段存在且为数字
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
  if (talkList.value.length >= pagination.value.total && pagination.value.total > 0) {
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
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsedTime))
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
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='
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
    minute: '2-digit'
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
    '开心': '😊',
    '快乐': '😄',
    '兴奋': '🤩',
    '满足': '😌',
    '平静': '😐',
    '无聊': '😑',
    '疲惫': '😴',
    '难过': '😢',
    '生气': '😠',
    '焦虑': '😰',
    '惊讶': '😲',
    '思考': '🤔'
  }
  return moodMap[mood] || '😊'
}

/**
 * 获取天气表情
 */
const getWeatherEmoji = (weather: string) => {
  const weatherMap: Record<string, string> = {
    '晴天': '☀️',
    '多云': '⛅',
    '阴天': '☁️',
    '小雨': '🌦️',
    '中雨': '🌧️',
    '大雨': '⛈️',
    '雪天': '❄️',
    '雾天': '🌫️',
    '风天': '💨',
    '炎热': '🔥',
    '寒冷': '🧊'
  }
  return weatherMap[weather] || '☀️'
}

// ==================== 分页相关 ====================
/**
 * 切换页码
 */
const changePage = (page: number) => {
  if (page < 1 || page > Math.ceil(pagination.value.total / pagination.value.size)) {
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
    currentImageIndex.value--
  }
}

/**
 * 下一张图片
 */
const nextImage = () => {
  if (currentImageIndex.value < previewImages.value.length - 1) {
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
    content: ''
  }
}

// 加载说说回复
const loadTalkReplies = async (talkId: string) => {
  if (loadingReplies.value.has(talkId)) return
  
  try {
    loadingReplies.value.add(talkId)
    const response = await getTalkReplies(talkId, { current: 1, size: 10 }) as Api.Reply.ReplyList
    
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
    
    const response = await getTalkReplies(talkId, { current, size: 10 }) as Api.Reply.ReplyList
    
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
    const response = await getTalkReplies(talkId, { current: 1, size: totalCount }) as Api.Reply.ReplyList
    
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
      author: userStore.userInfo?.nickname || userStore.userInfo?.username || '匿名用户',
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
        const response = await getTalkReplies(talkId, { current: 1, size: 1 }) as Api.Reply.ReplyList
        talkReplyCount.value[talkId] = response?.total || currentReplies.length
      } catch (error) {
        // 如果获取失败，至少增加1（新增的回复）
        talkReplyCount.value[talkId] = (talkReplyCount.value[talkId] || 0) + 1
      }
    }
    
    // 重置表单
    replyForm.value = {
      content: '' // 清空内容
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
      const response = await getTalkReplies(talk._id, { current: 1, size: 1 }) as Api.Reply.ReplyList
      // 保存真实的回复总数
      talkReplyCount.value[talk._id] = response?.total || 0
      console.log(`初始化说说 ${talk._id} 的回复数量: ${talkReplyCount.value[talk._id]}`)
    } catch (error) {
      console.error('获取回复数量失败:', error)
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
        const response = await getTalkReplies(talk._id, { current: 1, size: 1 }) as Api.Reply.ReplyList
        // 保存真实的回复总数
        talkReplyCount.value[talk._id] = response?.total || 0
        console.log(`初始化新说说 ${talk._id} 的回复数量: ${talkReplyCount.value[talk._id]}`)
      } catch (error) {
        console.error('获取回复数量失败:', error)
        talkReplyCount.value[talk._id] = 0
      }
    }
  }
}

// 生命周期
onMounted(async () => {
  await resetTalks()
  // 初始化点赞状态和回复数量（并行执行以提高性能）
  await Promise.all([
    initializeLikeStatus(),
    initializeReplyCount()
  ])
  
  document.addEventListener('keydown', handleKeydown)
  // 页面可见性或窗口获取焦点时自动刷新，确保与后台同步
  window.addEventListener('focus', fetchTalkList as EventListener)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

// 监听点赞状态变化，保持实时同步
watch(() => talksStore.likedTalks, (newLikedTalks) => {
  // 同步本地状态
  for (const talk of talkList.value) {
    talkLikeStatus.value[talk._id] = newLikedTalks.has(talk._id)
  }
}, { deep: true })

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, async (isLoggedIn) => {
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
})
 
 onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  window.removeEventListener('focus', fetchTalkList as EventListener)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  
  // 清理缓存
  formatTimeCache.clear()
  formatContentCache.clear()
  
  // 取消防抖函数
  debouncedLikeTalk.cancel()
  debouncedLikeReply.cancel()
})
 </script>
 
 <style scoped>
.talk-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.talk-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.talk-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.talk-item {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
}

.talk-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.talk-item.is-top {
  border: 2px solid #ff6b6b;
}

.top-badge {
  position: absolute;
  top: -8px;
  right: 2rem;
  background: #ff6b6b;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.top-badge .icon-pin::before {
  content: "📌";
}

.talk-content {
  margin-bottom: 1.5rem;
}

.content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  margin-bottom: 1rem;
}

.content-text :deep(p) {
  margin-bottom: 1rem;
}

.content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.content-images {
  margin-top: 1rem;
}

/* 图片网格样式 - 微信朋友圈风格 */
.image-grid {
  display: grid;
  gap: 0.25rem;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 270px; /* 固定最大宽度，类似微信朋友圈 */
}

/* 统一使用3x3网格布局 */
.image-grid.grid-1 {
  grid-template-columns: 1fr;
  max-width: 90px; /* 单张图片小尺寸 */
}

.image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
  max-width: 180px; /* 两张图片 */
}

.image-grid.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 270px; /* 三张图片 */
}

.image-grid.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  max-width: 180px; /* 四张图片2x2 */
}

.image-grid.grid-5,
.image-grid.grid-6 {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  max-width: 270px; /* 5-6张图片3x2 */
}

.image-grid.grid-7,
.image-grid.grid-8,
.image-grid.grid-9 {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  max-width: 270px; /* 7-9张图片3x3 */
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  border-radius: 4px; /* 减小圆角，更像微信朋友圈 */
  transition: transform 0.2s ease;
}

.image-item:hover {
  transform: scale(1.02); /* 减小悬停效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.03); /* 减小悬停缩放效果 */
}

.more-images-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6); /* 简化背景色 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem; /* 减小字体 */
  font-weight: 600;
  backdrop-filter: blur(2px);
}

/* 响应式优化 - 微信朋友圈风格 */
@media (max-width: 768px) {
  .image-grid {
    max-width: 240px; /* 移动端稍小 */
    gap: 0.2rem;
  }
  
  .image-grid.grid-1 {
    grid-template-columns: 1fr;
    max-width: 80px;
  }
  
  .image-grid.grid-2 {
    grid-template-columns: 1fr 1fr;
    max-width: 160px;
  }
  
  .image-grid.grid-3 {
    grid-template-columns: 1fr 1fr 1fr;
    max-width: 240px;
  }
  
  .image-grid.grid-4 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    max-width: 160px;
  }
  
  .image-grid.grid-5,
  .image-grid.grid-6 {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    max-width: 240px;
  }
  
  .image-grid.grid-7,
  .image-grid.grid-8,
  .image-grid.grid-9 {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    max-width: 240px;
  }
  
  .image-item {
    border-radius: 3px;
  }
  
  .more-images-overlay {
    font-size: 0.8rem;
  }
}

/* 元信息区域重新设计 */
.talk-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
  color: #666;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.publish-time,
.location-info,
.mood-info,
.weather-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.publish-time {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.location-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.mood-info {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.weather-info {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.publish-time:hover,
.location-info:hover,
.mood-info:hover,
.weather-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.status-1 {
  background: #e8f5e8;
  color: #2d8f2d;
}

.status-badge.status-2 {
  background: #fff3cd;
  color: #856404;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: white;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-content {
  text-align: center;
}

.empty-content .icon-empty::before {
  content: "📝";
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.pagination-container {
  margin-top: 3rem;
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.page-btn .icon-arrow-left::before {
  content: "←";
}

.page-btn .icon-arrow-right::before {
  content: "→";
}

.page-info {
  color: #666;
  font-weight: 500;
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
}

.close-btn {
  position: absolute;
  top: -3rem;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn .icon-close::before {
  content: "✕";
}

.preview-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 2rem;
  padding: 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
  z-index: 1001;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.nav-btn.prev-btn {
  left: -4rem;
}

.nav-btn.next-btn {
  right: -4rem;
}

.preview-info {
  color: white;
  margin-top: 1rem;
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .talk-page {
    padding: 1rem 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .talk-card {
    padding: 1.5rem;
    margin: 0 0.5rem;
    border-radius: 16px;
  }
  
  .talk-meta {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .meta-item {
    align-self: flex-start;
  }
  
  .image-grid.grid-4,
  .image-grid.grid-5,
  .image-grid.grid-6,
  .image-grid.grid-7,
  .image-grid.grid-8,
  .image-grid.grid-9 {
    grid-template-columns: 1fr 1fr;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .view-count {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
  
  .nav-btn.prev-btn {
    left: -2rem;
  }
  
  .nav-btn.next-btn {
    right: -2rem;
  }
  
  .image-preview-modal {
    padding: 1rem;
  }
  
  .modal-content .close-btn {
    top: -2rem;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .talk-container {
    padding: 0 0.5rem;
  }
  
  .talk-card {
    padding: 1rem;
    margin: 0;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .content-text {
    font-size: 1rem;
  }
  
  .image-grid {
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .load-more-btn {
    padding: 0.875rem 2rem;
    font-size: 0.9rem;
    min-width: 140px;
    min-height: 45px;
  }
  
  .nav-btn {
    font-size: 1.5rem;
    padding: 0.75rem;
  }
  
  .nav-btn.prev-btn,
  .nav-btn.next-btn {
    position: fixed;
    top: 50%;
  }
  
  .nav-btn.prev-btn {
    left: 1rem;
  }
  
  .nav-btn.next-btn {
    right: 1rem;
  }
  
  .reply-form {
    padding: 1rem;
  }
  
  .reply-item {
    padding: 1rem;
  }
}
.infinite-sentinel {
  width: 100%;
  height: 1px;
}

.end-tip {
  text-align: center;
  color: #888;
  padding: 1rem 0;
}

/* 点赞和回复功能样式 */
.talk-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: #f8f9fa;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: #666;
}

.action-btn:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-btn.liked {
  background: #ffe6e6;
  color: #ff4757;
}

.like-btn.liked:hover {
  background: #ffd6d6;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.9rem;
}

.reply-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.reply-form {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.form-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #666;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.submit-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.submit-btn {
  background: #4dabf7;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #339af0;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background: #e9ecef;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #dee2e6;
  transform: translateY(-2px);
}

/* 回复列表 */
.replies-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.replies-title {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.replies-title::before {
  content: "💭";
}

/* 回复区域头部样式 */
.replies-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.replies-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
}

.replies-count::before {
  content: "💬";
  font-size: 1.1rem;
}

.toggle-replies-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.toggle-replies-btn:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.toggle-replies-btn:active {
  transform: translateY(0);
}

.toggle-icon {
  transition: transform 0.3s ease;
  font-size: 0.9rem;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

/* 回复列表动画 */
.replies-list-container {
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.replies-list-container.collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.replies-list-container.expanded {
  max-height: 2000px;
  opacity: 1;
  margin-top: 1rem;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reply-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.reply-item:hover {
  background: #f1f3f4;
  transform: translateX(5px);
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.reply-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reply-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.reply-time {
  color: #999;
  font-size: 0.8rem;
}

.reply-actions {
  display: flex;
  align-items: center;
}

.reply-like-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reply-like-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.reply-like-btn.liked {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.reply-content {
  margin-bottom: 0.5rem;
}

.reply-to {
  color: #667eea;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.reply-text {
  color: #333;
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
}

/* 加载更多区域 */
.load-more-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
  margin: 2rem 0;
}

.load-more-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2.5rem;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  overflow: hidden;
  min-width: 160px;
  min-height: 50px;
}

.load-more-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.load-more-btn:hover::before {
  left: 100%;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.load-more-btn:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.load-more-btn:disabled {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 15px rgba(148, 163, 184, 0.2);
}

.load-more-btn:disabled::before {
  display: none;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.btn-content .loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: dotPulse 1.4s ease-in-out infinite both;
}

.dot-1 {
  animation-delay: -0.32s;
}

.dot-2 {
  animation-delay: -0.16s;
}

.dot-3 {
  animation-delay: 0s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.load-more-btn:hover .btn-icon {
  transform: rotate(90deg);
}

.btn-text {
  font-weight: 600;
  transition: all 0.3s ease;
}

.load-more-btn:hover .btn-text {
  letter-spacing: 0.8px;
}

/* 加载区域 */
.loading-section {
  text-align: center;
  padding: 2rem 0;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.1rem;
}

.icon-loading::before {
  content: "⏳";
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.infinite-sentinel {
  width: 100%;
  height: 1px;
}

.end-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

.icon-check::before {
  content: "✅";
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
}

.modal-content .close-btn {
  position: absolute;
  top: -3rem;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  padding: 0.75rem;
  border-radius: 50%;
  transition: background 0.2s ease;
  width: auto;
  height: auto;
}

.modal-content .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.preview-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 2rem;
  padding: 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.nav-btn.prev-btn {
  left: -4rem;
}

.nav-btn.next-btn {
  right: -4rem;
}

.icon-chevron-left::before {
  content: "‹";
}

.icon-chevron-right::before {
  content: "›";
}

.preview-info {
  color: white;
  margin-top: 1rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .talk-page {
    padding: 1rem 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .talk-card {
    padding: 1.5rem;
    margin: 0 0.5rem;
    border-radius: 16px;
  }
  
  .talk-meta {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .meta-item {
    align-self: flex-start;
  }
  
  .image-grid.grid-4,
  .image-grid.grid-5,
  .image-grid.grid-6,
  .image-grid.grid-7,
  .image-grid.grid-8,
  .image-grid.grid-9 {
    grid-template-columns: 1fr 1fr;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .view-count {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
  
  .nav-btn.prev-btn {
    left: -2rem;
  }
  
  .nav-btn.next-btn {
    right: -2rem;
  }
  
  .image-preview-modal {
    padding: 1rem;
  }
  
  .modal-content .close-btn {
    top: -2rem;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .talk-container {
    padding: 0 0.5rem;
  }
  
  .talk-card {
    padding: 1rem;
    margin: 0;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .content-text {
    font-size: 1rem;
  }
  
  .image-grid {
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .nav-btn {
    font-size: 1.5rem;
    padding: 0.75rem;
  }
  
  .nav-btn.prev-btn,
  .nav-btn.next-btn {
    position: fixed;
    top: 50%;
  }
  
  .nav-btn.prev-btn {
    left: 1rem;
  }
  
  .nav-btn.next-btn {
    right: 1rem;
  }
  
  .reply-form {
    padding: 1rem;
  }
  
  .reply-item {
    padding: 1rem;
  }
}
</style>