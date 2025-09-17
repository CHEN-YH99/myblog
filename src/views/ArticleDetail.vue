<template>
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
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ article.author }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(article.publishDate) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><View /></el-icon>
              <span>{{ formatNumber(article.views || 0) }} 次阅读</span>
            </div>
            <div class="meta-item">
              <el-icon><Star /></el-icon>
              <span>{{ formatNumber(article.likes || 0) }} 点赞</span>
            </div>
          </div>
          
          <!-- 标签 -->
          <div v-if="article.tags && article.tags.length > 0" class="article-tags">
            <el-tag
              v-for="tag in article.tags"
              :key="tag"
              :style="{ backgroundColor: colorFor(tag), color: '#fff' }"
              class="tag-item"
              @click="goToTagPage(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 文章封面图 -->
        <div v-if="article.image" class="article-image">
          <el-image :src="article.image" :alt="article.title" fit="cover" />
        </div>

        <!-- 文章摘要 -->
        <div v-if="article.excerpt" class="article-excerpt">
          <p>{{ article.excerpt }}</p>
        </div>

        <!-- 文章正文 -->
        <div class="article-content" v-html="article.content"></div>

        <!-- 文章底部操作 -->
        <div class="article-actions">
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <div class="action-buttons">
            <el-button @click="likeArticle" :disabled="hasLiked">
              <el-icon><Star /></el-icon>
              {{ hasLiked ? '已点赞' : '点赞' }} ({{ article.likes || 0 }})
            </el-button>
            <el-button @click="shareArticle">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Calendar, View, Star, ArrowLeft, Share } from '@element-plus/icons-vue'
import { getArticle } from '@/api/articles'
import { formatNumber } from '@/utils/format'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const article = ref<Api.Article.ArticleItem | null>(null)
const loading = ref(true)
const hasLiked = ref(false)

// 获取文章ID
const articleId = route.params.id as string

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
const likeArticle = () => {
  if (hasLiked.value) return
  
  hasLiked.value = true
  if (article.value) {
    article.value.likes = (article.value.likes || 0) + 1
  }
  ElMessage.success('点赞成功！')
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
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.article-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.content-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 20px;
  }
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
  margin-bottom: 30px;
  
  .article-title {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 20px;
    color: #2c3e50;
    
    @media (max-width: 768px) {
      font-size: 24px;
    }
  }
  
  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #666;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .article-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .tag-item {
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.article-image {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  
  :deep(.el-image) {
    width: 100%;
    height: 300px;
  }
}

.article-excerpt {
  background: #f8f9fa;
  border-left: 4px solid #409eff;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 0 8px 8px 0;
  
  p {
    margin: 0;
    font-style: italic;
    color: #555;
    line-height: 1.6;
  }
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  margin-bottom: 40px;
  
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 30px 0 15px 0;
    font-weight: 600;
    line-height: 1.4;
  }
  
  :deep(p) {
    margin-bottom: 16px;
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  :deep(code) {
    background: #f1f2f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
  
  :deep(pre) {
    background: #2d3748;
    color: #e2e8f0;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 20px 0;
  }
}

.article-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 30px;
  border-top: 1px solid #eee;
  
  .action-buttons {
    display: flex;
    gap: 12px;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    
    .action-buttons {
      justify-content: center;
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