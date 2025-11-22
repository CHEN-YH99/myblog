<template>
  <!-- 阅读进度条 -->
  <ReadingProgress v-if="article && !loading" />
  
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="文章详情" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">文章详情</h1>
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
            <el-breadcrumb-item v-if="article.category" :to="{ path: `/category/${article.category}` }">
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
        <div class="article-content markdown-body" v-html="renderedContent"></div>

        <!-- 文章底部操作 -->
        <div class="article-actions">
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <div class="action-buttons">
            <el-button 
              @click="likeArticle" 
              :disabled="!article?._id || isLiking(article._id)"
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
      
      <!-- 右侧推荐和目录区域 -->
      <aside class="sidebar">
        <!-- 推荐文章区域 -->
        <div class="recommendations-section">
          <RelatedArticles 
            v-if="article"
            :current-article-id="article._id"
            :category="article.category"
            :limit="2"
          />
        </div>
        
        <!-- 目录区域 -->
        <div class="toc-section">
          <TableOfContents 
            ref="tocRef"
            content-selector=".article-content"
          />
        </div>
      </aside>
    </div> <!-- 关闭 content-wrapper -->
  </div> <!-- 关闭 article-container -->

  <!-- 空状态 -->
  <div v-else class="error-container">
    <el-empty description="文章不存在或已被删除" :image-size="200">
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </el-empty>
  </div>

  <!-- 页脚 -->
  <Footer />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, View, Star, Share, ArrowLeft, ArrowRight, ChatDotRound } from '@element-plus/icons-vue'
import ReadingProgress from '@/components/ReadingProgress.vue'
import WaveContainer from '@/components/WaveContainer.vue'
import CommentSection from '@/components/CommentSection.vue'
import { useArticlesStore } from '@/stores/getarticles'
import { useUserStore } from '@/stores/user'
import { useLikes } from '@/composables/useLikes'
import { formatNumber, timestampToTime } from '@/utils/format'
import { debounce, throttle, lazyLoadImage, performanceMonitor, timerManager } from '@/utils/performance'
import { handleError } from '@/utils/error-handler'
import { getArticle } from '@/api/articles'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import Footer from '@/components/Footer.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import RelatedArticles from '@/components/RelatedArticles.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const article = ref<Api.Article.ArticleItem | null>(null)
const loading = ref(true)
const error = ref<string>('')
const tocRef = ref<InstanceType<typeof TableOfContents> | null>(null)

// 使用全局点赞状态管理


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
        console.warn('代码高亮失败:', error)
      }
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>' // 使用外部默认转义
  }
})

// 计算渲染后的文章内容
const renderedContent = computed(() => {
  if (!article.value?.content) {
    return '<p class="empty-content">暂无内容</p>'
  }
  try {
    return md.render(article.value.content)
  } catch (error) {
    console.error('Markdown 解析失败:', error)
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
    console.log('ArticleDetail: 开始获取文章详情，ID:', currentArticleId)
    
    const result = await getArticle(currentArticleId)
    if (!result) {
      throw new Error('文章不存在')
    }
    
    article.value = result
    console.log('ArticleDetail: 文章获取成功:', article.value?.title)
    
    // 文章加载完成后，等待DOM更新并刷新目录
    await nextTick()
    setTimeout(() => {
      try {
        tocRef.value?.refresh()
      } catch (error) {
        console.warn('目录刷新失败:', error)
      }
    }, 300)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取文章失败'
    error.value = errorMessage
    console.error('获取文章失败:', err)
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
    console.error('重新加载失败:', error)
    ElMessage.error('重新加载失败，请稍后再试')
  }
}

// 处理图片加载错误
const handleImageErrorEnhanced = (event: Event, fallbackSrc = '/default-article.svg') => {
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
    console.error('日期格式化错误:', error)
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
    console.error('生成颜色失败:', error)
    return '#666'
  }
}

// 跳转到标签页面
const goToTagPage = (tag: string) => {
  try {
    router.push(`/category/${encodeURIComponent(tag)}`)
  } catch (error) {
    console.error('跳转标签页面失败:', error)
    ElMessage.error('跳转失败')
  }
}

// 返回上一页
const goBack = () => {
  try {
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('返回失败:', error)
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
      console.warn('Web Share API 调用失败:', error)
      ElMessage.info('已取消分享')
    }
  } else {
    try {
      await navigator.clipboard.writeText(url)
      ElMessage.success('文章链接已复制到剪贴板')
    } catch (error) {
      console.error('复制链接失败:', error)
      ElMessage.error('复制链接失败')
    }
  }
}

// 点赞功能
const { isLiked, isLiking, handleLike } = useLikes()

const likeArticle = async () => {
  if (!article.value?._id) return
  
  try {
    await handleLike(article.value._id)
    
    // Optimistic update: 立即更新UI
    const liked = isLiked(article.value._id)
    if (liked) {
      article.value.likes = (article.value.likes || 0) + 1
    } else {
      article.value.likes = Math.max(0, (article.value.likes || 0) - 1)
    }
  } catch (error) {
    handleError(error)
  }
}

// 生命周期钩子
onMounted(async () => {
  await fetchArticle()
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
  padding: 20px 0;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
}

.recommendations-section,
.toc-section {
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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

.meta-left, .meta-right {
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 992px) {
  .content-wrapper {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    order: -1; /* 在移动端将侧边栏移到顶部 */
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
}

.markdown-body pre {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.dark .markdown-body pre {
  background-color: #2d2d2d;
}
</style>
