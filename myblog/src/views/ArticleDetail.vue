<template>
  <!-- 阅读进度条 -->
  <ReadingProgress v-if="article && !loading" />
  
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="" />
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
            <el-breadcrumb-item>{{ article.title }}</el-breadcrumb-item>
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
          
          <h1 class="article-title">{{ article.title }}</h1>
          
          <!-- 文章摘要 -->
          <div v-if="article.excerpt" class="article-excerpt">
            <p>{{ article.excerpt }}</p>
          </div>
          
          <div class="article-meta">
            <div class="meta-left">
              <div class="author-info">
                <div class="author-avatar">
                  <el-avatar :size="40" :src="article.image || '/default-avatar.png'">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                </div>
                <div class="author-details">
                  <div class="author-name">{{ article.author }}</div>
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
          <el-image :src="article.image" :alt="article.title" fit="cover" />
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
            <el-button @click="likeArticle" :disabled="!article?._id || isLiking(article._id)">
              <el-icon><Star /></el-icon>
              {{ isLiked(article?._id || '') ? '已点赞' : '点赞' }} ({{ article?.likes || 0 }})
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

  <!-- 错误状态 -->
  <div v-else class="error-container">
    <el-empty description="文章不存在或已被删除" :image-size="200">
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </el-empty>
  </div>

  <!-- 页脚 -->
  <Footer />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Calendar, View, Star, ArrowLeft, Share } from '@element-plus/icons-vue'
import { getArticle } from '@/api/articles'
import { formatNumber } from '@/utils/format'
import { useLikes } from '@/composables/useLikes'
import { useUserStore } from '@/stores/user'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import ReadingProgress from '@/components/ReadingProgress.vue'
import RelatedArticles from '@/components/RelatedArticles.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const article = ref<Api.Article.ArticleItem | null>(null)
const loading = ref(true)
const tocRef = ref<InstanceType<typeof TableOfContents> | null>(null)

// 使用全局点赞状态管理
const { isLiked, isLiking, handleLike } = useLikes()

// 获取文章ID
const articleId = route.params.id as string

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用外部默认转义
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
    return article.value.content // 如果解析失败，返回原始内容
  }
})

// 获取文章详情
const fetchArticle = async () => {
  if (!articleId) {
    ElMessage.error('文章ID不存在')
    router.push('/category')
    return
  }

  try {
    loading.value = true
    article.value = await getArticle(articleId)
    
    // 文章加载完成后，等待DOM更新并刷新目录
    await nextTick()
    setTimeout(() => {
      tocRef.value?.refresh()
    }, 300)
  } catch (error) {
    console.error('获取文章失败:', error)
    ElMessage.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无日期'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效日期'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 标签颜色生成
const colorFor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  const sat = 72
  const light = 68
  return `hsl(${hue}deg, ${sat}%, ${light}%)`
}

// 跳转到标签页面
const goToTagPage = (tag: string) => {
  router.push(`/category/${encodeURIComponent(tag)}`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 点赞文章
const likeArticle = async () => {
  if (!article.value?._id) return
  
  // 检查用户是否已登录
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再点赞')
    router.push('/login')
    return
  }
  
  await handleLike(article.value._id)
}

// 分享文章
const shareArticle = () => {
  if (navigator.share && article.value) {
    navigator.share({
      title: article.value.title,
      text: article.value.excerpt,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// 组件挂载
onMounted(async () => {
  await fetchArticle()
})
</script>

<style scoped lang="scss">
.loading-container {
  width: 80%;
  margin: 50px auto;
  padding: 0 20px;
}

.article-container {
  width: 80%;
  margin: 50px auto;
  padding: 0 20px;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 20px;
  }
}

.article-main {
  flex: 0 0 60%;
  width: 60%;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(215, 215, 215, 0.584);
  
  @media (max-width: 768px) {
    padding: 20px;
  }
  
  @media (max-width: 1200px) {
    flex: none;
    width: 100%;
  }
}

.sidebar {
  flex: 0 0 20%;
  width: 20%;
  position: sticky;
  top: 0px;
  max-height: calc(100vh - 100px);
  overflow-y: none;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1200px) {
    flex: none;
    width: 100%;
    position: static;
    max-height: none;
  }
}

.recommendations-section {
  flex-shrink: 0;
}

.toc-section {
  flex: 1;
  min-height: 0;
}

.article-content-wrapper {
  width: 100%;
}

.breadcrumb-container {
  margin-bottom: 30px;
  
  .breadcrumb {
    font-size: 14px;
    
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: #51dbfa;
        &:hover {
          color: #409eff;
        }
      }
    }
  }
}

.article-header {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eaecef;
  
  .article-category {
    margin-bottom: 16px;
    
    .category-tag {
      font-weight: 500;
      border-radius: 20px;
      padding: 8px 16px;
    }
  }
  
  .article-title {
    font-size: 36px;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 20px;
    letter-spacing: -0.02em;
    
    @media (max-width: 768px) {
      font-size: 28px;
    }
  }
  
  .article-excerpt {
    margin-bottom: 24px;
    
    p {
      font-size: 18px;
      line-height: 1.6;
      margin: 0;
      font-weight: 400;
    }
  }
  
  .article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 0;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .meta-left {
      .author-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .author-avatar {
          flex-shrink: 0;
        }
        
        .author-details {
          .author-name {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
          }
          
          .publish-date {
            font-size: 14px;
            color: #718096;
          }
        }
      }
    }
    
    .meta-right {
      display: flex;
      gap: 20px;
      
      .stats-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #718096;
        
        .stats-icon {
          font-size: 16px;
        }
      }
    }
  }
  
  .article-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    
    .tags-label {
      font-size: 14px;
      font-weight: 500;
      margin-right: 4px;
    }
    
    .tag-item {
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      border-radius: 12px;
      font-size: 12px;
      padding: 4px 12px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(60, 213, 25, 0.816);
      }
    }
  }
}

.article-image {
  margin-bottom: 40px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  
  :deep(.el-image) {
    width: 100%;
    height: 400px;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }
  
  @media (max-width: 768px) {
    :deep(.el-image) {
      height: 250px;
    }
  }
}

.article-content {
  line-height: 1.6;
  font-size: 14px;
  margin-bottom: 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 40px 0 24px 0;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.02em;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:hover {
      .header-anchor {
        opacity: 1;
      }
    }
  }
  
  :deep(h1) {
    font-size: 26px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 12px;
  }
  
  :deep(h2) {
    font-size: 22px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 10px;
  }
  
  :deep(h3) {
    font-size: 19px;
  }
  
  :deep(h4) {
    font-size: 16px;
  }
  
  :deep(h5) {
    font-size: 15px;
  }
  
  :deep(h6) {
    font-size: 14px;
    color: #6b7280;
  }
  
  :deep(p) {
    margin: 20px 0;
    text-align: justify;
    word-break: break-word;
  }
  
  :deep(ul), :deep(ol) {
    margin: 20px 0;
    padding-left: 28px;
    
    li {
      margin: 12px 0;
      
      p {
        margin: 8px 0;
      }
    }
  }
  
  :deep(ul) {
    li {
      list-style-type: disc;
      
      &::marker {
        color: #6366f1;
      }
    }
  }
  
  :deep(li) {
    margin-bottom: 8px;
  }
  
  :deep(blockquote) {
    margin: 24px 0;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-left: 4px solid #6366f1;
    border-radius: 0 12px 12px 0;
    position: relative;
    
    &::before {
      content: '"';
      position: absolute;
      top: 8px;
      left: 8px;
      font-size: 24px;
      color: #6366f1;
      opacity: 0.3;
    }
    
    p {
      margin: 0;
      color: #4b5563;
      font-style: italic;
      font-size: 16px;
    }
  }
  
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 16px;
      text-align: left;
    }
    
    th {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-weight: 600;
      color: #374151;
    }
    
    tbody tr {
      &:nth-child(even) {
        background: #f9fafb;
      }
      
      &:hover {
        background: #f3f4f6;
      }
    }
  }
  
  :deep(th), :deep(td) {
    border: 1px solid #dfe2e5;
    padding: 8px 12px;
    text-align: left;
  }
  
  :deep(th) {
    background: #f6f8fa;
    font-weight: 600;
  }
  
  :deep(img) {
    max-width: 80%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
  }
  
  :deep(code) {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 14px;
    color: #dc2626;
    font-weight: 500;
    border: 1px solid #fed7aa;
  }
  
  :deep(pre) {
    background: #f6f8fa;
    color: #24292e;
    padding: 24px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 24px 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e1e4e8;
    
    code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 14px;
      border: none;
    }
  }
  
  :deep(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
    margin: 40px 0;
  }
  
  :deep(a) {
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid transparent;
    transition: all 0.3s ease;
    
    &:hover {
      color: #4f46e5;
      border-bottom-color: #6366f1;
    }
  }
  
  :deep(strong) {
    font-weight: 700;
    color: #1f2937;
  }
  
  :deep(em) {
    font-style: italic;
    color: #4b5563;
  }
}

.article-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 50px 0;
  padding: 30px 0;
  border-top: 2px solid #f1f5f9;
  border-radius: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .el-button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #4b5563;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }
    
    &:hover {
      border-color: #6366f1;
      color: #6366f1;
      transform: translateY(-3px);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.25);
      
      &::before {
        left: 100%;
      }
    }
    
    &:active {
      transform: translateY(-1px);
    }
    
    .el-icon {
      font-size: 20px;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 16px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;
      align-items: center;
    }
  }
}

.error-container {
  max-width: 600px;
  margin: 100px auto;
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
</style>