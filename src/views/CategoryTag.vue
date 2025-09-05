<template>
  <!-- 页头 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">相关文章</h1>
      </div>
    </div>
    <WaveContainer />
  </div>

  <!-- 主要内容区域 -->
  <div v-if="filteredArticles.length" class="content-container animate__animated animate__fadeInUp">
    <!-- 顶部信息栏 -->
    <div class="content-header">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator=" - " class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/category' }">分类</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tagName }}</el-breadcrumb-item>
      </el-breadcrumb>
      
      <!-- 文章总数 -->
      <div class="article-count">
        文章总数: {{ filteredArticles.length }}
      </div>
    </div>

    <!-- 文章网格 -->
    <div class="articles-grid">
      <div 
        v-for="article in paginatedArticles" 
        :key="article._id"
        class="article-item"
        @click="goToArticle(article)"
      >
        <div class="article-image-wrapper">
          <el-image 
            class="article-image" 
            :src="article.image" 
            :alt="article.title"
            fit="cover"
          />
        </div>
        <div class="article-info">
          <h3 class="article-title">{{ article.title }}</h3>
          <div class="article-date">{{ formatDate(article.publishDate) }}</div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="filteredArticles.length > pageSize"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="filteredArticles.length"
      layout="prev, pager, next"
      class="pagination"
      hide-on-single-page
    />
  </div>

  <!-- 空状态 -->
  <div v-else class="empty">
    <el-empty :description="`暂无 ${tagName} 相关文章`" :image-size="200" />
    <el-button type="primary" @click="$router.push('/category')">
      返回分类页面
    </el-button>
  </div>

  <Footer />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticles } from '@/composables/useArticles'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()

// 分页相关
const currentPage = ref(1)
const pageSize = ref(8) // 每页8个，对应4x2的网格

// 获取标签名
const tagName = computed(() => decodeURIComponent(route.params.tag as string))

// 获取文章数据
const { articles, initArticles, loading } = useArticles()

// 筛选当前标签的文章
const filteredArticles = computed(() => {
  return articles.value.filter(article => 
    article.tags?.includes(tagName.value)
  )
})

// 分页文章
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredArticles.value.slice(start, end)
})

// 其他函数保持不变...
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无日期'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效日期'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const goToArticle = (article: any) => {
  // console.log('点击文章:', article.title)
  router.push(`/article/${article._id}`)
}

onMounted(async () => {
  await initArticles()
})
</script>

<style scoped lang="scss">
.content-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(215, 215, 215, 0.6);
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  border-bottom: 1px solid #f0f0f0;
  
  .breadcrumb {
    font-size: 16px;
    font-weight: 500;
    
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: #51dbfa;
        &:hover {
          color: #409eff;
        }
      }
      
      &:last-child .el-breadcrumb__inner {
        font-weight: 600;
      }
    }
  }
  
  .article-count {
    font-size: 14px;
    font-weight: 500;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 20px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.article-item {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
  }
  
  .article-image-wrapper {
    width: 100%;
    height: 160px;
    overflow: hidden;
    
    .article-image {
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease;
    }
  }
  
  &:hover .article-image {
    transform: scale(1.05);
  }
  
  .article-info {
    padding: 16px;
    
    .article-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 44px; // 确保两行的最小高度
    }
    
    .article-date {
      font-size: 12px;
      font-family: 'Courier New', monospace;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 30px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  
  :deep(.el-pagination) {
    .el-pager li {
      background: #fff;
      border: 1px solid #ddd;
      margin: 0 2px;
      
      &.is-active {
        background: #409eff;
        border-color: #409eff;
        color: #fff;
      }
      
      &:hover:not(.is-active) {
        background: #f5f7fa;
      }
    }
    
    .btn-prev, .btn-next {
      background: #fff;
      border: 1px solid #ddd;
      
      &:hover {
        background: #f5f7fa;
      }
    }
  }
}

.empty {
  max-width: 600px;
  margin: 100px auto;
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

// 响应式调整
@media (max-width: 768px) {
  .content-container {
    margin: 20px auto;
    border-radius: 8px;
  }
  
  .content-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 20px;
    
    .article-count {
      align-self: flex-end;
    }
  }
}
</style>