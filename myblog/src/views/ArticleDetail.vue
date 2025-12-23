<!-- eslint-disable prettier/prettier -->
<template>
  <div class="article-detail-view">
  <!-- 阅读进度条 -->
  <ReadingProgress v-if="article && !loading" />
  
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="文章详情" />
      <div class="inner-header flex">
        <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">文章详情</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer />
  </div>

  <!-- 加载状态 -->
  <div v-if="loading" class="loading-container">
    <el-skeleton :rows="8" animated />
    <el-skeleton :rows="6" animated />
    <el-skeleton :rows="4" animated />
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="error-container">
    <el-alert
      title="加载失败"
      :description="error"
      type="error"
      show-icon
      :closable="false"
    />
    <el-button type="primary" @click="retryLoad" class="retry-btn">
      重新加载
    </el-button>
  </div>

  <!-- 文章内容 -->
  <div v-else-if="article" class="article-container animate__animated animate__fadeInUp">
    <div class="content-wrapper">
      <!-- 主要内容区域 -->
      <div class="article-main">
        <!-- 文章内容区域 -->
        <div class="article-content-wrapper">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
          <el-breadcrumb separator=" - " class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/category' }">分类</el-breadcrumb-item>
            <el-breadcrumb-item v-if="article.category" :to="{ path: `/category/${encodeURIComponent(article.category)}` }">
              {{ article.category }}
            </el-breadcrumb-item>
            <el-breadcrumb-item>{{ truncateText(article.title || '无标题', 30) }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 文章头部信息 -->
        <div class="article-header">
          <!-- 分类标签 -->
          <div v-if="article.category" class="article-category">
            <el-tag type="primary" size="large" class="category-tag">
              {{ article.category }}
            </el-tag>
          </div>
          
          <h1 class="article-title">{{ article.title || '无标题' }}</h1>
          
          <!-- 文章摘要 -->
          <div v-if="article.excerpt" class="article-excerpt">
            <p>{{ article.excerpt }}</p>
          </div>
          
          <div class="article-meta">
            <div class="meta-left">
              <div class="author-info">
                <div class="author-avatar">
                  <el-avatar :size="40" :src="article.image || '/default-avatar.png'">
                    <template #error>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-avatar>
                </div>
                <div class="author-details">
                  <div class="author-name">{{ article.author || '匿名' }}</div>
                  <div class="publish-date">{{ formatDate(article.publishDate) }}</div>
                </div>
              </div>
            </div>
            <div class="meta-right">
              <div class="stats-item">
                <el-icon class="stats-icon"><View /></el-icon>
                <span>{{ formatNumber(article.views || 0) }}</span>
              </div>
              <div class="stats-item">
                <el-icon class="stats-icon"><Star /></el-icon>
                <span>{{ formatNumber(article.likes || 0) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 标签 -->
          <div v-if="article.tags && article.tags.length > 0" class="article-tags">
            <span class="tags-label">标签：</span>
            <el-tag
              v-for="tag in article.tags"
              :key="tag"
              :style="{ backgroundColor: colorFor(tag), color: '#fff' }"
              class="tag-item"
              @click="goToTagPage(tag)"
              size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 文章封面图 -->
        <div v-if="article.image" class="article-image">
          <el-image 
            :src="article.image" 
            :alt="article.title || '文章封面'" 
            fit="cover"
            lazy
            :loading="'lazy'"
            @error="handleImageErrorEnhanced"
          >
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <!-- 文章正文 -->
        <div ref="contentRef" class="article-content markdown-body" v-html="renderedContent"></div>

        <!-- 文章底部操作 -->
        <div class="article-actions">
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <div class="action-buttons">
            <el-button 
              @click="likeArticle" 
              :disabled="!article?._id || isLiking(article?._id || '')"
              :class="{ 'liked': isLiked(article?._id || '') }"
            >
              <el-icon v-if="!isLiking(article?._id || '')">
                <Star />
              </el-icon>
              <el-icon v-else class="loading-icon">
                <Loading />
              </el-icon>
              {{ isLiked(article?._id || '') ? '已点赞' : '点赞' }} ({{ formatNumber(article?.likes || 0) }})
            </el-button>
            <el-button @click="shareArticle">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </div>
        </div> <!-- 关闭 article-content-wrapper -->
      </div> <!-- 关闭 article-main -->
      
      <!-- 桌面端右侧推荐和目录区域 -->
      <aside class="sidebar desktop-sidebar">
        <!-- 推荐文章区域 -->
        <div class="recommendations-section">
          <RelatedArticles 
            v-if="article"
            :current-article-id="article._id"
            :category="article.category || ''"
            :limit="2"
          />
        </div>
        
        <!-- 目录区域 -->
        <div class="toc-section">
          <TableOfContents 
            v-if="!loading && article"
            :key="articleId"
            ref="tocRef"
            content-selector=".article-content"
          />
        </div>
      </aside>
    </div> <!-- 关闭 content-wrapper -->

    <!-- 移动端推荐文章浮动按钮 -->
    <teleport to="body">
    <div
      ref="triggerRef"
      class="mobile-recommend-trigger"
      :style="triggerStyle"
      @click="handleTriggerClick"
      @pointerdown.prevent="onPointerDown"
    >
      <el-badge :value="2" :max="9" class="recommend-badge">
        <el-icon :size="24">
          <Reading />
        </el-icon>
      </el-badge>
      <span class="trigger-text">推荐</span>
    </div>
    </teleport>
    <!-- 移动端推荐文章抽屉 -->
    <teleport to="body">
    <transition name="drawer-fade">
      <div v-if="mobileDrawerVisible" class="mobile-drawer-overlay" @click="handleOverlayClick">
        <transition name="drawer-slide">
          <div v-if="mobileDrawerVisible" class="mobile-drawer" :style="drawerStyle" @click.stop>
            <div class="drawer-header">
              <h3 class="drawer-title">
                <el-icon class="title-icon"><Reading /></el-icon>
                推荐文章
              </h3>
              <el-button 
                circle 
                size="small" 
                @click="closeMobileDrawer"
                class="close-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="drawer-content">
              <RelatedArticles 
                v-if="article"
                :current-article-id="article._id"
                :category="article.category || ''"
                :limit="5"
              />
            </div>
          </div>
        </transition>
      </div>
    </transition>
    </teleport>
  </div> <!-- 关闭 article-container -->

  <!-- 空状态 -->
  <div v-else class="error-container">
    <el-empty description="文章不存在或已被删除" :image-size="200">
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </el-empty>
  </div>

  <!-- 图片查看器（点击正文图片放大预览） -->
  <el-image-viewer
    v-if="imageViewer.visible"
    :url-list="imageViewer.urls"
    :initial-index="imageViewer.index"
    @close="closeViewer"
  />

  <!-- 页脚 -->
  <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, reactive, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  View,
  Star,
  Share,
  ArrowLeft,
  Loading,
  Picture,
  Reading,
  Close,
} from '@element-plus/icons-vue'
import ReadingProgress from '@/components/ReadingProgress.vue'
import WaveContainer from '@/components/WaveContainer.vue'

import { useArticlesStore } from '@/stores/articles'


import { formatNumber } from '@/utils/format'
import { handleError } from '@/utils/error-handler'
import { getArticle } from '@/api/articles'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import Footer from '@/components/Footer.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import RelatedArticles from '@/components/RelatedArticles.vue'
import { applySEO } from '@/utils/seo'

const route = useRoute()
const router = useRouter()

// 响应式数据
const article = ref<Api.Article.ArticleItem | null>(null)
const loading = ref(true)
const error = ref<string>('')
const tocRef = ref<InstanceType<typeof TableOfContents> | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const mobileDrawerVisible = ref(false)
const drawerStyle = ref({})

// 推荐按钮拖动相关
const triggerRef = ref<HTMLElement | null>(null)
const triggerPos = reactive({
  x: 0,
  y: 0,
})
const isDragging = ref(false)
const dragMoved = ref(false)

// 按钮样式（动态定位）
const triggerStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${triggerPos.x}px`,
  top: `${triggerPos.y}px`,
  right: 'auto',
  bottom: 'auto',
}))

const imageViewer = reactive({
  visible: false,
  urls: [] as string[],
  index: 0,
})

const closeViewer = () => {
  imageViewer.visible = false
}

const contentClickHandler = ref<((e: Event) => void) | null>(null)

const bindImagePreview = () => {
  const container = contentRef.value
  if (!container) return

  // remove previous to avoid duplicate bindings
  if (contentClickHandler.value) {
    container.removeEventListener('click', contentClickHandler.value)
  }

  contentClickHandler.value = (e: Event) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const img = (target.tagName === 'IMG' ? (target as HTMLImageElement) : target.closest('img')) as HTMLImageElement | null
    if (!img) return

    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
    const urls = imgs.map((i) => i.getAttribute('data-src') || i.src).filter(Boolean) as string[]
    let index = imgs.findIndex((i) => i === img)
    if (index < 0) index = 0

    imageViewer.urls = urls
    imageViewer.index = index
    imageViewer.visible = true

    // 如果图片被包裹在链接里，阻止默认跳转
    const a = img.closest('a')
    if (a) e.preventDefault()
  }

  container.addEventListener('click', contentClickHandler.value)
}

const unbindImagePreview = () => {
  const container = contentRef.value
  if (container && contentClickHandler.value) {
    container.removeEventListener('click', contentClickHandler.value)
  }
  contentClickHandler.value = null
}

onBeforeUnmount(() => {
  unbindImagePreview()
  // 恢复 body 滚动
  document.body.style.overflow = ''
})

// 使用全局点赞状态管理
const articlesStore = useArticlesStore()

// 获取文章ID
const articleId = computed(() => route.params.id as string)

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (error) {
        
      }
    }
    return (
      '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>'
    ) // 使用外部默认转义
  },
})

// 计算渲染后的文章内容
const renderedContent = computed(() => {
  if (!article.value?.content) {
    return '<p class="empty-content">暂无内容</p>'
  }
  try {
    return md.render(article.value.content)
  } catch (error) {
    return `<div class="markdown-error">
      <p>内容解析失败，显示原始内容：</p>
      <pre>${article.value.content}</pre>
    </div>`
  }
})

// 文本截断函数
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 获取文章详情
const fetchArticle = async () => {
  const currentArticleId = articleId.value

  if (!currentArticleId) {
    error.value = '文章ID不存在'
    ElMessage.error('文章ID不存在')
    router.push('/category')
    return
  }

  try {
    loading.value = true
    error.value = ''
    

    const result = await getArticle(currentArticleId)
    if (!result) {
      throw new Error('文章不存在')
    }

    article.value = result


    // 文章详情页SEO：使用文章标题/摘要/封面
    try {
      applySEO({
        title: article.value.title || '文章详情',
        description: article.value.excerpt || undefined,
        canonical: typeof window !== 'undefined' ? window.location.href : undefined,
        image: article.value.image || undefined,
        robots: 'index,follow',
      })
    } catch {}

    // 文章加载完成后，等待DOM更新并刷新目录
    // 第一次 nextTick：等待 article.value 的响应式更新
    await nextTick()
    

    // 第二次 nextTick：等待 v-html 渲染完成
    await nextTick()
    

    // 延迟刷新目录，确保 markdown 内容完全渲染
    setTimeout(() => {
      try {
        
        tocRef.value?.refresh()
        
      } catch (error) {
        handleError(error, { showMessage: false, logToConsole: false })
      }
    }, 300)
    // 初始化正文图片点击放大预览
    try {
      bindImagePreview()
    } catch {}

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取文章失败'
    error.value = errorMessage

    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 重新加载数据
const retryLoad = async () => {
  try {
    await fetchArticle()
    ElMessage.success('文章加载成功')
  } catch (error) {
    
    ElMessage.error('重新加载失败，请稍后再试')
  }
}

// 处理图片加载错误
const handleImageErrorEnhanced = (
  event: Event,
  fallbackSrc = '/default-article.svg',
) => {
  try {
    const img = event.target as HTMLImageElement
    if (img.src !== fallbackSrc) {
      img.src = fallbackSrc
      img.classList.add('error')
    }
  } catch (error) {
    handleError(error, { showMessage: false })
  }
}

// 格式化日期
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无日期'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '无效日期'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return '日期格式错误'
  }
}

// 标签颜色生成
const colorFor = (str: string) => {
  try {
    if (!str) return '#666'

    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    const hue = hash % 360
    const sat = 72
    const light = 68
    return `hsl(${hue}deg, ${sat}%, ${light}%)`
  } catch (error) {

    return '#666'
  }
}

// 跳转到标签页面
const goToTagPage = (tag: string) => {
  try {
    router.push(`/category/${encodeURIComponent(tag)}`)
  } catch (error) {
    handleError(error, { showMessage: false, logToConsole: false })
    ElMessage.error('跳转失败')
  }
}

// 返回上一页（避免返回后白屏：优先根据来源 from 定位页面，而不是直接 history.back）
const goBack = () => {
  try {
    const fromPath = typeof route.query.fromPath === 'string' ? route.query.fromPath : ''
    const from = typeof route.query.from === 'string' ? route.query.from : ''

    const isSafeInternalPath = (p: string): boolean => {
      try {
        const u = new URL(p, window.location.origin)
        // 仅允许与本站同源的相对路径
        return u.origin === window.location.origin && u.pathname.startsWith('/')
      } catch {
        return false
      }
    }

    // 将菜单索引映射为路由路径（白名单）
    const mapFromToPath = (m: string): string => {
      switch (m) {
        case 'home':
          return '/'
        case 'timeline':
          return '/timeline'
        case 'frontend':
          return '/frontend'
        case 'backend':
          return '/backend'
        case 'category':
          return '/category'
        case 'photos':
          return '/photoAlbum'
        case 'talk':
          return '/talk'
        default:
          return '/'
      }
    }

    // 1) 优先使用 fromPath（需校验同源且为站内路径）
    if (fromPath && isSafeInternalPath(fromPath)) {
      const u = new URL(fromPath, window.location.origin)
      const q: Record<string, string> = {}
      u.searchParams.forEach((v, k) => (q[k] = v))
      q._r = String(Date.now())
      router.replace({ path: u.pathname, query: q })
      return
    }

    // 2) 使用来源白名单映射
    if (from) {
      const targetPath = mapFromToPath(from)
      router.replace({ path: targetPath, query: { _r: String(Date.now()) } })
      return
    }

    // 3) 回退或返回首页
    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace('/')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 分享文章
const shareArticle = async () => {
  if (!article.value) return

  const url = window.location.href
  const title = article.value.title || '分享文章'
  const text = article.value.excerpt || ''

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      ElMessage.success('感谢分享！')
    } catch (error) {

      ElMessage.info('已取消分享')
    }
  } else {
    try {
      await navigator.clipboard.writeText(url)
      ElMessage.success('文章链接已复制到剪贴板')
    } catch (error) {

      ElMessage.error('复制链接失败')
    }
  }
}

// 移动端抽屉控制
const handleTriggerClick = (e: MouseEvent) => {
  if (dragMoved.value) {
    // 如果是拖动行为，不触发展开
    dragMoved.value = false
    return
  }
  toggleMobileDrawer()
}

const handleOverlayClick = () => {
  closeMobileDrawer()
}

const updateDrawerPosition = () => {
  if (!triggerRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const drawerWidth = 300 // 假设抽屉宽度
  const drawerHeight = 400 // 假设抽屉高度
  const gap = 10 // 按钮和抽屉之间的间隙

  const margin = 10 // 弹窗与屏幕边缘的最小间距
  let left;

  // 检查按钮左侧是否有足够空间
  const hasSpaceOnLeft = triggerRect.left > drawerWidth + gap + margin;
  // 检查按钮右侧是否有足够空间
  const hasSpaceOnRight = window.innerWidth - triggerRect.right > drawerWidth + gap + margin;

  if (hasSpaceOnLeft) {
    // 优先放在左边
    left = triggerRect.left - drawerWidth - gap;
  } else if (hasSpaceOnRight) {
    // 其次放在右边
    left = triggerRect.right + gap;
  } else {
    // 如果两边都不够，则在屏幕中居中显示
    left = (window.innerWidth - drawerWidth) / 2;
  }

  let top = triggerRect.top + triggerRect.height / 2 - drawerHeight / 2
  // 确保不超出视口顶部和底部
  top = Math.max(10, Math.min(top, window.innerHeight - drawerHeight - 10))

  drawerStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
  }
}

const toggleMobileDrawer = () => {
  mobileDrawerVisible.value = !mobileDrawerVisible.value
  if (mobileDrawerVisible.value) {
    nextTick(() => {
      updateDrawerPosition()
    })
  }
  // 防止背景滚动
  if (mobileDrawerVisible.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileDrawer = () => {
  mobileDrawerVisible.value = false
  document.body.style.overflow = ''
}

// 不再拦截离开详情页的导航，避免覆盖用户从导航栏主动跳转的意图
onBeforeRouteLeave((_to, _from, next) => {
  next()
})

// 点赞功能（直接使用 articlesStore，组件内只负责本地文章详情的乐观更新）
const isLiked = (id: string) => articlesStore.isLiked(id)
const isLiking = (id: string) => articlesStore.isLiking(id)

const likeArticle = async () => {
  if (!article.value?._id) return
  const id = article.value._id
  const willLike = !isLiked(id)
  const prevLikes = article.value.likes || 0

  // 组件本地乐观更新：store 不会自动更新详情对象的 likes
  article.value.likes = Math.max(0, prevLikes + (willLike ? 1 : -1))

  try {
    const res = await (willLike
      ? articlesStore.likeArticle(id)
      : articlesStore.unlikeArticle(id))
    if (res && typeof res.likes === 'number') {
      article.value.likes = res.likes
    }
  } catch (error) {
    // 回滚本地乐观更新
    article.value.likes = prevLikes
    handleError(error)
  }
}

// 监听路由参数变化 - 用于处理同一页面内的路由切换
watch(
  () => route.params.id,
  async (newId, oldId) => {
    // 只在路由参数实际改变时重新加载（不使用 immediate）
    if (newId && newId !== oldId) {

      await fetchArticle()
    }
  },
)

// ------------------ 推荐按钮拖动逻辑 ------------------
const initTriggerPos = () => {
  try {
    const size = 56 // 按钮大小
    triggerPos.x = window.innerWidth - size - 20
    triggerPos.y = window.innerHeight - size - 80
  } catch {}
}

let startX = 0
let startY = 0
let offsetX = 0
let offsetY = 0

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  dragMoved.value = true
  const size = 56
  const minX = 0
  const maxX = window.innerWidth - size
  const minY = 0
  const maxY = window.innerHeight - size
  triggerPos.x = Math.min(maxX, Math.max(minX, e.clientX - offsetX))
  triggerPos.y = Math.min(maxY, Math.max(minY, e.clientY - offsetY))
}

const onPointerUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}

const onPointerDown = (e: PointerEvent) => {
  if (mobileDrawerVisible.value) return // 抽屉展开时禁止拖动
  isDragging.value = true
  startX = e.clientX
  startY = e.clientY
  offsetX = e.clientX - triggerPos.x
  offsetY = e.clientY - triggerPos.y
  document.addEventListener('pointermove', onPointerMove, {
    passive: false,
  })
  document.addEventListener('pointerup', onPointerUp)
}

// ------------------ 生命周期钩子 ------------------
// 生命周期钩子 - 初始化加载
onMounted(async () => {
  // 初始化推荐按钮位置
  initTriggerPos()
  triggerRef.value?.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('resize', initTriggerPos)

  // 初始化时加载文章
  if (!article.value) {
    await fetchArticle()
  }
})
</script>

<style scoped>
.loading-container,
.error-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

.retry-btn {
  margin-top: 20px;
}

.article-container {
  padding: 20px;
}

.content-wrapper {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
  align-items: flex-start; /* Align items to the top for sticky sidebar to work */
}

.article-main {
  flex: 1;
  min-width: 0;
}

.article-content-wrapper {
  background-color: var(--el-bg-color);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  /* 让容器在移动端不超出屏幕 */
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word; /* 防止超长单词导致溢出 */
}

/* 桌面端侧边栏 - 默认显示 */
.sidebar.desktop-sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  display: block;
}

.recommendations-section,
.toc-section {
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.breadcrumb-container {
  margin-bottom: 20px;
}

.article-header {
  margin-bottom: 30px;
  text-align: center;
}

.article-category .category-tag {
  margin-bottom: 15px;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.article-excerpt {
  font-size: 1.1rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 25px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 20px;
}

.meta-left,
.meta-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.publish-date {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.stats-icon {
  font-size: 1.1rem;
}

.article-tags {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.tags-label {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.tag-item {
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.article-image {
  margin-bottom: 30px;
  text-align: center;
}

.article-image .el-image {
  border-radius: 8px;
  max-height: 500px;
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
  color: var(--el-text-color-regular);
}

/* 让正文中的图片不超过容器宽度，超出时等比例缩放 */
.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  cursor: zoom-in;
}

/* 兼容某些 markdown 渲染为 figure 的情况 */
.article-content :deep(figure) {
  max-width: 100%;
  overflow: hidden;
}

/* 如果图片外层是链接，避免默认样式影响布局 */
.article-content :deep(a img) {
  border: 0;
}

/* 代码块容器样式 */
.article-content pre {
  position: relative;
  margin: 20px 0;
}

.article-content pre:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
}

/* 代码块滚动条美化 */
.article-content pre::-webkit-scrollbar {
  height: 8px;
}

.article-content pre::-webkit-scrollbar-track {
  background: transparent;
}

.article-content pre::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.article-content pre::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

.dark .article-content pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark .article-content pre::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 确保滚动到标题时不会被固定导航遮挡 */
.article-content h1,
.article-content h2,
.article-content h3,
.article-content h4,
.article-content h5,
.article-content h6 {
  scroll-margin-top: 100px;
}

.article-actions {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons .el-button.liked {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.action-buttons .loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端推荐文章浮动按钮 */
.mobile-recommend-trigger {
  display: none;
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  cursor: pointer;
  z-index: 999;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #fff;
}

.mobile-recommend-trigger:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
}

.mobile-recommend-trigger:active {
  transform: translateY(-2px);
}

.mobile-recommend-trigger .trigger-text {
  font-size: 11px;
  margin-top: 2px;
  font-weight: 500;
}

.mobile-recommend-trigger .recommend-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端抽屉遮罩层 */
.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  backdrop-filter: blur(4px);
}

/* 移动端抽屉 */
.mobile-drawer {
  /* position, top, left are now dynamically set by drawerStyle */
  width: 300px;
  height: 400px;
  background-color: var(--el-bg-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  z-index: 2001;
  overflow: hidden; /* Ensure content respects border-radius */
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color));
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-title .title-icon {
  color: var(--el-color-primary);
  font-size: 20px;
}

.drawer-header .close-btn {
  background-color: var(--el-fill-color-light);
  border: none;
  transition: all 0.3s;
}

.drawer-header .close-btn:hover {
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  transform: rotate(90deg);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-content::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}

/* 抽屉动画 */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  /* 在移动端隐藏桌面侧边栏 */
  .sidebar.desktop-sidebar {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
  
  /* 显示移动端浮动按钮 */
  .mobile-recommend-trigger {
    display: flex !important;
  }
}

@media (max-width: 768px) {
  .article-content-wrapper {
    padding: 20px;
  }
  .article-title {
    font-size: 2rem;
  }
  .article-meta {
    flex-direction: column;
    gap: 15px;
  }
  
  .mobile-drawer {
    width: 90%;
  }
  
  .mobile-recommend-trigger {
    right: 16px;
    bottom: 70px;
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 615px) {
  .article-container {
    padding: 10px;
  }
  
  .article-main {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }
  
  .article-content-wrapper {
    padding: 13px;
  }
  
  .article-title {
    font-size: 1.8rem;
  }
}

.markdown-body pre {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
  border-left: 4px solid var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.markdown-body code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #d63384;
  font-size: 0.9em;
}

.markdown-body pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

.dark .markdown-body pre {
  background-color: #1e1e1e;
  border-left-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .markdown-body code {
  background-color: #2d2d2d;
  color: #ff7b72;
}
</style>
