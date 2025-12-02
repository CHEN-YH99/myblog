<template>
  <div class="category-detail-wrapper">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/category.jpeg" alt="分类详情页面头图" />
        <div class="inner-header flex">
          <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">
            {{ categoryDisplayName }}
          </h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 分类文章列表 -->
    <div
      v-else-if="categoryArticles.length"
      class="articles-container animate__animated animate__fadeInUp"
    >
      <div class="content-wrapper">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
          <el-breadcrumb separator=" - " class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/category' }">
              分类
            </el-breadcrumb-item>
            <el-breadcrumb-item>{{ categoryDisplayName }}</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="article-count">
            共 {{ categoryArticles.length }} 篇文章
          </div>
        </div>

        <!-- 文章网格 -->
        <div class="articles-grid">
          <div
            v-for="article in paginatedArticles"
            :key="article._id"
            class="article-card"
            @click="goToArticleDetail(article._id)"
          >
            <div class="article-image-wrapper">
              <el-image
                class="article-image"
                :src="article.image || '/default-article.jpg'"
                :alt="article.title || '文章封面'"
                fit="cover"
              />
            </div>
            <div class="article-content">
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
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

              <!-- 文章摘要 -->
              <p v-if="article.excerpt" class="article-excerpt">
                {{ article.excerpt }}
              </p>

              <!-- 标签 -->
              <div
                v-if="article.tags && article.tags.length > 0"
                class="article-tags"
              >
                <el-tag
                  v-for="tag in article.tags.slice(0, 3)"
                  :key="tag"
                  :style="{ backgroundColor: colorFor(tag), color: '#fff' }"
                  class="tag-item"
                  size="small"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="article.tags.length > 3" class="more-tags"
                  >+{{ article.tags.length - 3 }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-if="categoryArticles.length > pageSize"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="categoryArticles.length"
          layout="prev, pager, next, jumper"
          class="pagination"
          hide-on-single-page
        />
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
    <div v-else class="empty-container">
      <el-empty
        :description="`暂无 ${categoryDisplayName} 相关文章`"
        :image-size="200"
      >
        <el-button type="primary" @click="goBack">返回分类页面</el-button>
      </el-empty>
    </div>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, View, Star } from '@element-plus/icons-vue'
// import { getAllArticles, getArticle } from '@/api/articles'
import { useCategories } from '@/composables/useCategories'
import { useArticlesStore } from '@/stores/getarticles'
import { useUserStore } from '@/stores/user'
import { formatNumber } from '@/utils/format'
import { mapPathToMenu } from '@/utils/routerMap'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(true)
const error = ref<string | null>(null)
const allArticles = ref<Api.Article.ArticleItem[]>([])
const currentPage = ref(1)
const pageSize = ref(12)

// 使用分类组合式函数
const { findCategory, initCategories } = useCategories()

// 使用文章store
const articlesStore = useArticlesStore()

// 获取分类参数和文章ID参数
const categorySlug = computed(() => route.params.category as string)

// 判断是否为文章详情模式

// 获取分类信息
const currentCategory = ref<Api.Article.CategoryItem | null>(null)

// 分类显示名称
const categoryDisplayName = computed(() => {
  return currentCategory.value?.name || categorySlug.value || '未知分类'
})

// 筛选当前分类的文章
const categoryArticles = computed(() => {
  // if (import.meta.env?.DEV)  console.log('CategoryDetail - 筛选分类文章:', categorySlug.value)
  // if (import.meta.env?.DEV)  console.log('CategoryDetail - 全部文章:', allArticles.value.length)

  if (!categorySlug.value || !allArticles.value.length) {
    return []
  }

  const filtered = allArticles.value.filter((article) => {
    const matchesCategory = article.category === categorySlug.value
    return matchesCategory
  })

  // if (import.meta.env?.DEV)  console.log('CategoryDetail - 筛选后的文章:', filtered.length)
  return filtered
})

// 分页文章
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return categoryArticles.value.slice(start, end)
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

// 跳转到文章详情
const goToArticleDetail = (articleId: string) => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再查看文章详情')
    router.push({
      path: '/login',
      query: { redirect: `/article/${articleId}` },
    })
    return
  }

  const from = mapPathToMenu(route.path)
  const fromPath = route.path
  router.push({ name: 'ArticleDetail', params: { id: String(articleId) }, query: { from, fromPath } })
}

// 返回上一页
const goBack = () => {
  router.push('/category')
}

// 刷新数据
const handleRefresh = async () => {
  await loadData()
  ElMessage.success('刷新成功')
}

// 加载数据
const loadData = async () => {
  // if (import.meta.env?.DEV)  console.log('CategoryDetail - 开始加载数据, 分类:', categorySlug.value)

  try {
    loading.value = true

    // 获取文章数据
    await articlesStore.fetchArticles()
    allArticles.value = articlesStore.articles
    // if (import.meta.env?.DEV)  console.log('CategoryDetail - 获取到文章:', allArticles.value.length)

    // 获取分类数据
    await initCategories()
    const foundCategory = findCategory(categorySlug.value)
    if (foundCategory) {
      currentCategory.value = foundCategory
    }
    // if (import.meta.env?.DEV)  console.log('CategoryDetail - 找到分类:', currentCategory.value)
  } catch (err: any) {
    error.value = err.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化
watch(
  () => route.params.category,
  async (newCategory, oldCategory) => {
    if (newCategory && newCategory !== oldCategory) {
      if (import.meta.env?.DEV)  console.log('CategoryDetail: 路由参数变化，重新加载数据')
      currentPage.value = 1 // 重置分页
      await loadData()
    }
  },
  { immediate: true },
)

// 组件挂载
onMounted(async () => {
  // 初始化时加载数据
  if (allArticles.value.length === 0) {
    await loadData()
  }
})
</script>

<style scoped lang="scss">
.loading-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.articles-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.content-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.breadcrumb-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;

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
        color: #495057;
      }
    }
  }

  .article-count {
    font-size: 14px;
    font-weight: 500;
    color: #6c757d;
    background: rgba(64, 158, 255, 0.1);
    padding: 6px 12px;
    border-radius: 16px;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px;
  }
}

.article-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  background: #fff;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
  }

  .article-image-wrapper {
    width: 100%;
    height: 200px;
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

  .article-content {
    padding: 20px;

    .article-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      line-height: 1.4;
      color: #212529;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 50px;
      transition: color 0.3s ease;
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #6c757d;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .article-excerpt {
      font-size: 14px;
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .article-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;

      .tag-item {
        border: none;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .more-tags {
        font-size: 11px;
        color: #999;

        padding: 2px 6px;
        border-radius: 8px;
      }
    }
  }

  &:hover .article-title {
    color: #409eff;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 30px;
  border-top: 1px solid #f0f0f0;

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

    .btn-prev,
    .btn-next {
      background: #fff;
      border: 1px solid #ddd;

      &:hover {
        background: #f5f7fa;
      }
    }
  }
}

.error-container,
.empty-container {
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
  .articles-container {
    margin: 20px auto;
  }

  .content-wrapper {
    border-radius: 8px;
  }

  .breadcrumb-container {
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
