<template>
  <div class="category-page-wrapper">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/category.jpeg" alt="" />
        <div class="inner-header flex">
          <h1 class="animate__animated animate__backInDown">
            {{ $route.meta.title }}
          </h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-container animate__animated animate__fadeInUp"
    >
      <el-skeleton :rows="6" animated>
        <template #template>
          <div class="timeline_content">
            <div class="about-me tags-info">
              <section class="tag-cloud">
                <el-skeleton-item
                  variant="h3"
                  style="width: 200px; margin-bottom: 20px"
                />
                <div class="tags-content">
                  <el-skeleton-item
                    v-for="i in 6"
                    :key="i"
                    variant="button"
                    style="width: 80px; height: 32px; margin: 4px"
                  />
                </div>
              </section>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 内容 -->
    <div
      v-else-if="categoriesWithCount.length"
      class="timeline_content animate__animated animate__fadeInUp"
    >
      <!-- 标签栏 -->
      <div class="about-me tags-info">
        <section class="tag-cloud">
          <h3 class="tag-header">分类 -- {{ categoriesWithCount.length }}</h3>
          <div class="tags-content">
            <a
              v-for="category in categoriesWithCount"
              :key="category.slug"
              class="tag"
              :style="{
                color: category.color || colorFor(category.name),
                borderColor: category.color || colorFor(category.name),
              }"
              @click="goToCategoryPage(category.slug)"
            >
              <span class="tag-name">{{ category.name }}</span>
            </a>
          </div>
        </section>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="error"
      class="error-container animate__animated animate__fadeInUp"
    >
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
      <el-empty description="暂无分类" :image-size="200" />
    </div>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCategories } from '@/composables/useCategories'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()

// 使用分类组合式函数
const { categories, loading, error, initCategories } = useCategories()

// 使用文章组合式函数获取文章数据来统计分类文章数量
const { articles: articleslist, initArticles, cleanup } = useArticles()

// 计算每个分类的文章数量
const categoriesWithCount = computed(() => {
  const result = categories.value.map((category) => {
    const articleCount = articleslist.value.filter(
      (article) => article.category === category.name,
    ).length

    return {
      ...category,
      articleCount,
    }
  })

  return result
})

// 跳转到分类页面（模板中使用的函数名）
const goToCategoryPage = (categorySlug: string) => {
  router.push(`/category/${encodeURIComponent(categorySlug)}`)
}

// 稳定配色：根据分类文本 -> HSL 颜色（同一分类始终同色）
const colorFor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360 // 色相 0-359
  const sat = 72 // 饱和度，深色背景下略高更鲜明
  const light = 68 // 明度，注意和背景对比度
  return `hsl(${hue}deg, ${sat}%, ${light}%)`
}

// 刷新数据
const handleRefresh = async () => {
  try {
    await Promise.all([initCategories(true), initArticles(true)])
    ElMessage.success('刷新成功')
  } catch (err) {
    ElMessage.error('刷新失败')
  }
}

// 组件挂载后获取分类和文章数据
onMounted(async () => {
  try {
    // 使用 Promise.all 并行加载，但不强制刷新，让组合式函数自己决定是否需要刷新
    await Promise.all([
      initCategories(), // 不强制刷新，使用缓存策略
      initArticles(), // 不强制刷新，使用缓存策略
    ])
  } catch (err) {
    console.error('Category.vue - 初始化数据失败:', err)
    ElMessage.error('初始化数据失败，请刷新页面重试')
  }
})

// 组件卸载后清除数据
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.tags-info {
  width: 50%;
  margin: 50px auto 200px auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(192, 192, 192, 0.7);
  padding: 30px;
  @media (max-width: 768px) {
    width: 80%;
  }
  @media (max-width: 480px) {
    width: 95%;
  }

  .tag-cloud {
    text-align: center;

    .tag-header {
      font-size: 24px;
      margin-bottom: 20px;
      // color: #333;
    }

    .tags-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;

      .tag {
        display: inline-block;
        padding: 6px 12px;
        margin: 5px;
        text-align: center;
        text-decoration: none;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          opacity: 0.8;
        }

        .tag-name {
          margin-right: 4px;
        }

        .tag-count {
          font-size: 12px;
        }
      }
    }
  }
}

.loading-container,
.error-container {
  width: 50%;
  margin: 50px auto 200px auto;
  @media (max-width: 768px) {
    width: 80%;
  }
  @media (max-width: 480px) {
    width: 95%;
  }
}
</style>
