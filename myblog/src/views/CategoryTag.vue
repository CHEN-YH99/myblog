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

  <!-- 加载状态 -->
  <div v-if="loading" class="loading-container">
    <el-skeleton :rows="6" animated />
  </div>

  <!-- 主要内容区域 -->
  <div v-else-if="filteredArticles.length" class="content-wrapper">
    <div class="content-container animate__animated animate__fadeInUp">
      <!-- 顶部信息栏 -->
      <div class="content-header">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator=" - " class="breadcrumb">
          <el-breadcrumb-item :to="{ path: '/category' }">分类</el-breadcrumb-item>
          <el-breadcrumb-item>{{ displayName }}</el-breadcrumb-item>
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
          class="article-card"
          @click="goToArticle(article)"
        >
          <div class="article-image">
            <el-image 
              :src="article.image || '/default-article.jpg'" 
              :alt="article.title"
              fit="contain"
              lazy
            />
          </div>
          <div class="article-content">
            <h3 class="article-title">{{ article.title }}</h3>
            <div class="article-date">{{ formatDate(article.publishDate) }}</div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </div>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="error-container">
    <el-alert
      title="加载失败"
      :description="error"
      type="error"
      center
      show-icon
    >
      <template #default>
        <el-button @click="handleRefresh" type="primary">重新加载</el-button>
      </template>
    </el-alert>
  </div>

  <!-- 空状态 -->
  <div v-else class="empty">
    <el-empty :description="`暂无 ${displayName} 相关文章`" :image-size="200" />
    <el-button type="primary" @click="$router.push('/category')">
      返回分类页面
    </el-button>
  </div>

  <Footer />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCategories } from '@/composables/useCategories'
import { getAllArticles } from '@/api/articles'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()

// 分页相关
const currentPage = ref(1)
const pageSize = ref(4) // 每页4个，对应一行4个

// 获取分类或标签名
const paramValue = computed(() => decodeURIComponent(route.params.tag as string))

// 使用分类组合式函数
const {
  findCategory,
  initCategories
} = useCategories()

// 状态管理
const loading = ref(true)
const error = ref<string | null>(null)
const articles = ref<Api.Article.ArticleItem[]>([])
const currentCategory = ref<Api.Article.CategoryItem | null>(null)

// 显示名称（优先使用分类名称，否则使用参数值）
const displayName = computed(() => {
  return currentCategory.value?.name || paramValue.value
})

// 筛选当前分类或标签的文章
const filteredArticles = computed(() => {
  console.log('CategoryTag - 开始筛选文章')
  console.log('CategoryTag - 参数值:', paramValue.value)
  console.log('CategoryTag - 当前分类:', currentCategory.value)
  console.log('CategoryTag - 所有文章数量:', articles.value.length)
  
  const filtered = articles.value.filter(article => {
    console.log(`CategoryTag - 检查文章: ${article.title}, 分类: ${article.category}`)
    
    // 检查是否为分类匹配
    if (article.category === paramValue.value || 
        article.category === currentCategory.value?.slug ||
        article.category === currentCategory.value?.name) {
      console.log(`CategoryTag - 匹配成功: ${article.title}`)
      return true
    }
    // 检查是否为标签匹配
    if (article.tags?.includes(paramValue.value)) {
      console.log(`CategoryTag - 标签匹配成功: ${article.title}`)
      return true
    }
    return false
  })
  
  console.log('CategoryTag - 筛选结果数量:', filtered.length)
  return filtered
})

// 分页文章
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredArticles.value.slice(start, end)
})

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

// 跳转到文章详情
const goToArticle = (article: Api.Article.ArticleItem) => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再查看文章详情')
    router.push({
      path: '/login',
      query: { redirect: `/article/${article._id}` }
    })
    return
  }
  
  router.push(`/article/${article._id}`)
}

// 刷新数据
const handleRefresh = async () => {
  await loadData()
  ElMessage.success('刷新成功')
}

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log('CategoryTag - 开始加载数据, 分类参数:', paramValue.value)
    
    // 并行初始化分类数据和获取所有文章
    const [allArticles] = await Promise.all([
      getAllArticles(),
      initCategories()
    ])
    
    console.log('CategoryTag - 获取到所有文章:', allArticles?.length || 0)
    
    // 查找当前分类
    const foundCategory = findCategory(paramValue.value)
    currentCategory.value = foundCategory || null
    console.log('CategoryTag - 找到分类:', currentCategory.value)
    
    // 设置所有文章数据，筛选在computed中处理
    articles.value = Array.isArray(allArticles) ? allArticles : []
    
    console.log('CategoryTag - 筛选后的文章数量:', filteredArticles.value.length)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载数据失败'
    console.error('CategoryTag - 加载数据失败:', err)
    articles.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped lang="scss">
.loading-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.error-container {
  max-width: 600px;
  margin: 100px auto;
  padding: 40px;
}

// 外层容器样式：宽度固定60%
.content-wrapper {
  width: 60%;
  margin: 50px auto;
  
  // 响应式调整容器宽度
  @media (max-width: 1400px) {
    width: 70%;
  }
  
  @media (max-width: 1200px) {
    width: 80%;
  }
  
  @media (max-width: 768px) {
    width: 90%;
    margin: 20px auto;
  }
  
  @media (max-width: 480px) {
    width: 95%;
  }
}

.content-container {
  padding: 0 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(201, 201, 201, 0.7);
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  // background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  // border-bottom: 1px solid #dee2e6;
  
  .breadcrumb {
    font-size: 16px;
    font-weight: 500;
    
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: #51dbfa;
        text-decoration: none;
        transition: color 0.3s ease;
        
        &:hover {
          color: #409eff;
        }
      }
      
      &:last-child .el-breadcrumb__inner {
        font-weight: 600;
        // color: #495057;
      }
    }
  }
  
  .article-count {
    font-size: 14px;
    font-weight: 500;
    // color: #6c757d;
    // background: rgba(64, 158, 255, 0.1);
    padding: 6px 12px;
    border-radius: 16px;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px; // 缩小间距
  padding: 24px; // 缩小内边距
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }
}

.article-card {
  // background: #fff;
  border-radius: 6px; // 缩小圆角
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #ffffff;
  
  &:hover {
    transform: translateY(-2px); // 缩小悬停位移
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); // 缩小阴影
    border-color: #409eff;
  }
  
  .article-image {
    width: 100%;
    height: 140px; // 缩小图片高度
    overflow: hidden;
    // background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    
    :deep(.el-image) {
      width: 100%;
      height: 100%;
      
      img {
        transition: transform 0.3s ease;
        object-fit: contain;
        width: 100%;
        height: 100%;
      }
    }
  }
  
  &:hover .article-image :deep(.el-image img) {
    transform: scale(1.02);
  }
  
  .article-content {
    padding: 12px; // 缩小内边距
    
    .article-title {
      font-size: 14px; // 缩小字体
      font-weight: 600;
      line-height: 1.3;
      margin: 0 0 6px 0; // 缩小间距
      // color: #2c3e50;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 36px; // 缩小最小高度
      transition: color 0.3s ease;
    }
    
    .article-date {
      font-size: 11px; // 缩小字体
      // color: #8a8a8a;
      font-family: 'Courier New', monospace;
    }
  }
  
  &:hover .article-title {
    color: #409eff;
  }
}

// 分页样式优化
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 30px;
  border-top: 1px solid #f0f0f0;
  // background: #fafafa;
  
  .pagination {
    :deep(.el-pagination) {
      .el-pager li {
        // background: #fff;
        border: 1px solid #ddd;
        margin: 0 2px;
        border-radius: 4px;
        min-width: 32px;
        height: 32px;
        line-height: 32px;
        
        &.is-active {
          background: #00d4aa;
          border-color: #00d4aa;
          color: #fff;
        }
        
        &:hover:not(.is-active) {
          background: #f5f7fa;
        }
      }
      
      .btn-prev, .btn-next {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-width: 32px;
        height: 32px;
        line-height: 32px;
        
        &:hover {
          background: #f5f7fa;
        }
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
  .content-wrapper {
    .content-container {
      border-radius: 8px;
    }
    
    .content-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      padding: 16px 20px;
      
      .article-count {
        align-self: flex-end;
      }
    }
    
    .articles-grid {
      .article-card {
        .article-image {
          height: 120px; // 移动端进一步缩小
        }
        
        .article-content {
          padding: 10px;
          
          .article-title {
            font-size: 13px;
            min-height: 32px;
          }
          
          .article-date {
            font-size: 10px;
          }
        }
      }
    }
    
    .pagination-wrapper {
      padding: 20px;
    }
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    .articles-grid {
      .article-card {
        .article-image {
          height: 110px; // 小屏幕最小尺寸
        }
      }
    }
  }
}
</style>