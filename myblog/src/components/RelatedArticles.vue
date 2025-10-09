<template>
  <div class="related-articles" v-if="relatedArticles.length > 0">
    <div class="related-header">
      <h3>推荐文章</h3>
    </div>
    <div class="articles-list">
      <div 
        v-for="article in relatedArticles" 
        :key="article._id"
        class="article-item"
        @click="navigateToArticle(article._id)"
      >
        <div class="article-image">
          <img 
            :src="article.image || '/default-article.jpg'" 
            :alt="article.title"
          />
        </div>
        <div class="article-content">
          <h4 class="article-title">{{ article.title }}</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getArticlesByCategory } from '@/api/articles'

interface RelatedArticle {
  _id: string
  title: string
  excerpt?: string
  image?: string
  publishDate: string
  category?: string
  tags?: string[]
}

interface Props {
  currentArticleId: string
  category?: string
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 2
})

const router = useRouter()
const relatedArticles = ref<RelatedArticle[]>([])
const categoryName = ref<string>('')

// 获取相关文章
const fetchRelatedArticles = async () => {
  if (!props.category) return

  try {
    const articles = await getArticlesByCategory(props.category, {
      limit: props.limit + 1 // 多获取一篇，用于排除当前文章
    })
    
    // 过滤掉当前文章
    const filtered = articles.filter((article: RelatedArticle) => article._id !== props.currentArticleId)
    relatedArticles.value = filtered.slice(0, props.limit)
    categoryName.value = props.category
  } catch (error) {
    console.error('获取相关文章失败:', error)
    relatedArticles.value = []
  }
}

// 跳转到文章详情
const navigateToArticle = (articleId: string) => {
  router.push(`/article/${articleId}`)
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 监听分类变化
watch(() => props.category, fetchRelatedArticles, { immediate: true })

onMounted(() => {
  fetchRelatedArticles()
})
</script>

<style scoped>
.related-articles {
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(170, 169, 169, 0.848);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.related-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eaecef;
}

.related-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.article-item:hover {
  border-color: #e2e8f0;
}

.article-image {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.article-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-item:hover .article-title {
  color: #667eea;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .related-articles {
    display: none;
  }
}
</style>