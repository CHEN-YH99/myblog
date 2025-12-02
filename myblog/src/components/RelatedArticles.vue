<template>
  <div class="related-articles-container">
    <!-- 推荐文章区域 -->
    <div v-if="relatedArticles.length > 0" class="related-articles">
      <div class="related-header">
        <h3>推荐文章</h3>
      </div>
      <div class="articles-list">
        <div
          v-for="article in relatedArticles"
          :key="article._id"
          class="article-item"
          @click.prevent="navigateToArticle(article)"
        >
          <div class="article-image">
            <img :src="article.image || '/default-article.jpg'" :alt="article.title" />
          </div>
          <div class="article-content">
            <h4 class="article-title">{{ article.title }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- 无推荐文章时的提示 -->
    <div v-else-if="!loading && category" class="no-recommendations">
      <div class="related-header">
        <h3>推荐文章</h3>
      </div>
      <div class="empty-state">
        <p>暂无相关推荐</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAllArticles } from '@/api/articles'
import { mapPathToMenu } from '@/utils/routerMap'

const props = defineProps({
  currentArticleId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    default: 2,
  },
})

const router = useRouter()
const route = useRoute()
const relatedArticles = ref([])
const loading = ref(false)

const fetchRelatedArticles = async () => {
  if (!props.category) {
    void 0 && console.log('RelatedArticles: 没有分类信息，跳过获取')
    return
  }

  loading.value = true

  try {
    void 0 && console.log('RelatedArticles: 开始获取相关文章')
    void 0 && console.log('RelatedArticles: 当前分类:', props.category)
    void 0 && console.log('RelatedArticles: 当前文章ID:', props.currentArticleId)

    // 获取所有文章
    const allArticles = await getAllArticles()
    void 0 && console.log('RelatedArticles: API返回的所有文章数量:', allArticles?.length || 0)

    if (allArticles && allArticles.length > 0) {
      void 0 && console.log('RelatedArticles: 第一篇文章的数据结构:', allArticles[0])
      void 0 && console.log('RelatedArticles: 第一篇文章的所有字段:', Object.keys(allArticles[0]))

      // 检查ID字段
      allArticles.slice(0, 3).forEach((article, index) => {
        void 0 &&
          console.log(`RelatedArticles: 文章${index + 1}的ID字段:`, {
            _id: article._id,
            id: article.id,
            title: article.title,
            category: article.category,
          })
      })
    }

    if (!allArticles || allArticles.length === 0) {
      void 0 && console.log('RelatedArticles: 没有获取到文章数据')
      relatedArticles.value = []
      return
    }

    // 过滤相同分类的文章，排除当前文章
    const sameCategory = allArticles.filter((article) => {
      const isSameCategory = article.category === props.category
      const isNotCurrentArticle =
        article._id !== props.currentArticleId && article.id !== props.currentArticleId

      void 0 &&
        console.log('RelatedArticles: 文章过滤检查:', {
          title: article.title,
          articleCategory: article.category,
          targetCategory: props.category,
          isSameCategory,
          articleId: article._id || article.id,
          currentId: props.currentArticleId,
          isNotCurrentArticle,
          shouldInclude: isSameCategory && isNotCurrentArticle,
        })

      return isSameCategory && isNotCurrentArticle
    })

    void 0 && console.log('RelatedArticles: 过滤后的相同分类文章数量:', sameCategory.length)

    // 限制为2篇
    const limitedArticles = sameCategory.slice(0, 2)
    void 0 &&
      console.log(
        'RelatedArticles: 最终推荐文章:',
        limitedArticles.map((a) => ({
          title: a.title,
          id: a._id || a.id,
          category: a.category,
        })),
      )

    relatedArticles.value = limitedArticles
  } catch (error) {
    console.error('RelatedArticles: 获取相关文章失败:', error)
    relatedArticles.value = []
  } finally {
    loading.value = false
  }
}

const navigateToArticle = async (article) => {
  void 0 && console.log('RelatedArticles: 点击文章跳转')
  void 0 && console.log('RelatedArticles: 文章对象:', article)

  // 优先使用 _id 字段，因为这是MongoDB的主键
  const articleId = article._id || article.id
  void 0 && console.log('RelatedArticles: 最终使用的ID:', articleId)

  if (!articleId) {
    console.error('RelatedArticles: 文章ID为空，无法跳转')
    return
  }

  try {
    void 0 && console.log('RelatedArticles: 开始跳转到文章:', `/article/${articleId}`)

    // 使用push进行导航，这是标准的Vue Router导航方式
    const from = mapPathToMenu(route.path)
    const fromPath = route.path // 仅使用路径，避免嵌套叠加
    await router.push({ name: 'ArticleDetail', params: { id: String(articleId) }, query: { from, fromPath } })
    void 0 && console.log('RelatedArticles: 路由跳转成功')
  } catch (error) {
    console.error('RelatedArticles: 路由跳转失败:', error)
    // 如果路由跳转失败，显示错误信息
    console.error('跳转失败，请刷新页面重试')
  }
}

// 监听props变化
watch(
  [() => props.category, () => props.currentArticleId],
  () => {
    fetchRelatedArticles()
  },
  { immediate: true },
)

onMounted(() => {
  fetchRelatedArticles()
})
</script>

<style scoped>
.related-articles-container {
  margin: 5px 0;
}

.related-articles {
  /* 取消内层阴影与背景，由外层容器负责卡片感 */
  background: transparent;
  border-radius: 10px;
  padding: 0;
  box-shadow: none;
}

.no-recommendations {
  background: transparent;
  border-radius: 10px;
  padding: 0;
  box-shadow: none;
}

.related-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.related-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  /* color: #333; */
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  /* background: #fafafa; */
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.article-item:hover {
  /* background: #f0f8ff; */
  border-color: #4a90e2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
}

.article-image {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  flex: 1;
}

.article-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  /* color: #333; */
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .related-articles-container {
    margin: 20px 0;
  }

  .related-articles,
  .no-recommendations {
    padding: 16px;
    margin: 0 -16px;
    border-radius: 0;
  }

  .article-item {
    padding: 12px;
  }

  .article-image {
    width: 60px;
    height: 45px;
    margin-right: 12px;
  }

  .article-title {
    font-size: 14px;
  }

  .related-header h3 {
    font-size: 18px;
  }
}
</style>
