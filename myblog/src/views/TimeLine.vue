<template>
  <div class="timeline">
    <!-- 回到顶部控件 -->
    <el-backtop
      class="backtop animate__animated animate__slideInUp"
      target="body"
    />
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/timeline4k.jpg" alt="" />
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
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
      <el-skeleton :rows="4" animated />
      <el-skeleton :rows="3" animated />
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
      <el-button type="primary" @click="handleRetry" class="retry-btn">
        重新加载
      </el-button>
    </div>

    <!-- 内容 -->
    <div
      v-else-if="articleslist.length"
      class="timeline_content animate__animated animate__fadeInUp"
    >
      <el-timeline class="timeline-list">
        <el-timeline-item
          v-for="(article, index) in articlesWithYearDisplay"
          :key="article._id || (currentPage - 1) * pageSize + index"
          :class="{
            reverse: ((currentPage - 1) * pageSize + index) % 2 === 1,
            'same-year': !article.isFirstOfYear,
          }"
          :timestamp="getTimestampDisplay(article)"
          :hollow="true"
          center
          placement="top"
          type="primary"
        >
          <el-card class="tl-card" shadow="hover" @click="goToArticle(article)">
            <div class="timeline-card">
              <el-image
                class="timeline-card-image"
                fit="cover"
                :src="article.image"
                :lazy="true"
              />
              <div class="timeline-card-content">
                <h4>{{ article.title }}</h4>
                <!-- <p>{{ article.excerpt }}</p> -->
                <div class="publish-time">
                  发布时间：{{ formatFullDate(article.publishDate) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
    <div v-else class="empty">
      <el-empty description="暂无文章" :image-size="200" />
    </div>
    <!-- 分页控件：双向绑定当前页与每页条数 -->
    <el-pagination
      size="small"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
:hide-on-single-page="true"
      background
      layout="prev, pager, next "
      :total="total"
      class="mt-4"
    />
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
// import { useRouter } from 'vue-router'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import { ElMessage } from 'element-plus'

interface Article {
  _id: string
  title: string
  publishDate: string
  excerpt?: string
  category?: string
  tags?: string[]
  image?: string
  views?: number
  showYear?: boolean
  isFirstOfYear?: boolean
}


// 请求文章列表数据
const {
  articles: articleslist,
  loading,
  error,
  initArticles,
  pagedArticles,
  currentPage,
  pageSize,
  total,
  goToArticle,
  watchPagination,
  cleanup,
  retryLoad,
} = useArticles()

// 重试加载处理
const handleRetry = async () => {
  try {
    await retryLoad()
    ElMessage.success('重新加载成功')
  } catch (err) {
    ElMessage.error('重新加载失败，请稍后再试')
  }
}

// 日期格式化函数 - 只显示年份
const getYearFromDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无年份'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效年份'

  return date.getFullYear().toString()
}

// 完整日期格式化函数 - 显示年月日时分秒
const formatFullDate = (dateString: string | Date | undefined): string => {
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


// 处理文章年份显示逻辑的计算属性
const articlesWithYearDisplay = computed(() => {
  const articles = pagedArticles.value
  const result: Array<Article & { showYear: boolean; isFirstOfYear: boolean }> =
    []
  let lastYear = ''

  articles.forEach((article, index) => {
    const currentYear = getYearFromDate(article.publishDate)
    const showYear = currentYear !== lastYear
    const isFirstOfYear = showYear

    result.push({
      ...article,
      showYear,
      isFirstOfYear,
    })

    if (showYear) {
      lastYear = currentYear
    }
  })

  return result
})

// 获取时间戳显示内容
const getTimestampDisplay = (article: Article) => {
  return article.showYear ? getYearFromDate(article.publishDate) : ''
}

// goToArticle 方法现在由 useArticles 提供

watch([currentPage, pageSize], async () => {
  await nextTick()
  const container = document.querySelector(
    '.main-content',
  ) as HTMLElement | null
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

// 分页监听清理函数
let stopWatchingPagination: (() => void) | null = null

// 组件挂载后获取文章列表数据
onMounted(async () => {
  try {
    await initArticles()
    // 启用分页状态监听
    stopWatchingPagination = watchPagination()
  } catch (err) {
    console.error('TimeLine组件初始化失败:', err)
    ElMessage.error('页面加载失败，请刷新重试')
  }
})

onBeforeUnmount(() => {
  try {
    cleanup()
    // 清理分页监听
    if (stopWatchingPagination) {
      stopWatchingPagination()
    }
  } catch (err) {
    console.error('TimeLine组件清理失败:', err)
  }
})
</script>
<style scoped lang="scss">
// 加载状态样式
.loading-container {
  padding: 40px 20px;
  max-width: 800px;
  margin: 50px auto;

  .el-skeleton {
    margin-bottom: 20px;
  }
}

// 错误状态样式
.error-container {
  text-align: center;
  padding: 60px 20px;
  max-width: 600px;
  margin: 50px auto;

  .retry-btn {
    margin-top: 20px;
  }
}

// 内容
.timeline_content {
  --tl-primary: #58bff2;
  --tl-accent: #7f5af0;
  --tl-spine: linear-gradient(180deg, var(--tl-primary), var(--tl-accent));
  --tl-card-bg: rgba(255, 255, 255, 0.5);
  --tl-card-bg-strong: rgba(255, 255, 255, 0.65);
  --tl-card-border: rgba(255, 255, 255, 0.45);
  --tl-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  --tl-shadow-hover: 0 16px 40px rgba(0, 0, 0, 0.25);

  margin-top: 2rem;
  max-width: 1100px;
  margin: 50px auto;
  border-radius: 16px;
  padding: 1rem 1rem 2rem;

  @media (prefers-color-scheme: dark) {
    --tl-card-bg: rgba(17, 17, 26, 0.45);
    --tl-card-bg-strong: rgba(17, 17, 26, 0.6);
    --tl-card-border: rgba(255, 255, 255, 0.12);
    --tl-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
    --tl-shadow-hover: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  @media (prefers-reduced-motion: reduce) {
    :deep(.el-timeline-item),
    :deep(.el-timeline-item__node) {
      animation: none !important;
    }
    .tl-card {
      transition: none !important;
    }
  }

  .timeline-list {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
  }

  // 主时间轴强化
  :deep(.el-timeline) {
    position: relative;
  }

  :deep(.el-timeline-item) {
    animation: tl-reveal 0.6s ease both;
  }
  :deep(.el-timeline-item:nth-child(1)) {
    animation-delay: 0.05s;
  }
  :deep(.el-timeline-item:nth-child(2)) {
    animation-delay: 0.1s;
  }
  :deep(.el-timeline-item:nth-child(3)) {
    animation-delay: 0.15s;
  }
  :deep(.el-timeline-item:nth-child(4)) {
    animation-delay: 0.2s;
  }

  // 年份时间戳
  :deep(.el-timeline-item__timestamp) {
    font-weight: 800;
    font-size: 1.75rem;
    letter-spacing: 0.02em;
    background: linear-gradient(90deg, var(--tl-primary), var(--tl-accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-transform: none;
    margin-bottom: 10px;
  }

  // 连接线
  :deep(.el-timeline-item__tail) {
    left: calc(50% - 1px);
    width: 2px;
    background-image: var(--tl-spine);
    background-size: 100% 100%;
    border: none;
    opacity: 0.9;
  }
  // 内容容器与中轴对齐在右侧，默认放在右半区；给定宽度确保左右对称
  :deep(.el-timeline-item__wrapper) {
    margin-left: calc(50% + 18px);
    width: calc(50% - 32px);
  }
  // 交错布局：每隔一个放到左半区
  :deep(.reverse .el-timeline-item__wrapper) {
    margin-left: 0;
    margin-right: calc(50% + 18px);
    width: calc(50% - 32px);
    text-align: right;
  }

  // 节点
  :deep(.el-timeline-item__node) {
    width: 14px;
    height: 14px;
    left: calc(50% - 7px);
    z-index: 2;
    border: 2px solid rgba(255, 255, 255, 0.7);
    background: radial-gradient(
      circle at 30% 30%,
      #fff 0%,
      var(--tl-primary) 40%,
      var(--tl-accent) 100%
    );
    box-shadow: 0 0 0 0 rgba(127, 90, 240, 0.25), 0 6px 12px rgba(0, 0, 0, 0.2);
    animation: tl-pulse 2.8s ease-out infinite;
  }

  // 同年文章缩小行距
  :deep(.same-year) {
    .el-timeline-item__tail {
      height: 18px; // 缩小连接线高度
    }

    .el-timeline-item__wrapper {
      padding-bottom: 6px; // 缩小底部间距
    }

    // 隐藏时间戳区域以节省空间
    .el-timeline-item__timestamp {
      display: none;
    }
  }

  .tl-card {
    border: 1px solid var(--tl-card-border);
    background: linear-gradient(180deg, var(--tl-card-bg), var(--tl-card-bg-strong));
    backdrop-filter: saturate(150%) blur(12px);
    -webkit-backdrop-filter: saturate(150%) blur(12px);
    border-radius: 16px;
    box-shadow: var(--tl-shadow);
    transition: transform 260ms ease, box-shadow 260ms ease, background 260ms ease, border-color 260ms ease;
    overflow: hidden;
    cursor: pointer;
  }
  .tl-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--tl-shadow-hover);
  }
  .tl-card:active {
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: 16px 18px;
  }

  .timeline-card {
    display: flex;
    align-items: center;
    gap: 16px;

    .timeline-card-content {
      display: flex;
      flex-direction: column;
      justify-content: center;

      h4 {
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1.35;
        color: var(--el-text-color-primary, #1f2937);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .publish-time {
        margin-top: 8px;
        font-size: 0.875rem;
        color: var(--el-text-color-secondary, #6b7280);
        font-style: normal;
      }
    }

    .timeline-card-image {
      width: 110px;
      height: 110px;
      border-radius: 12px;
      object-fit: cover;
      overflow: hidden;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      position: relative;
      flex-shrink: 0; // 防止图片挤压缩小
      background: #f4f4f5;
      transition: transform 260ms ease, box-shadow 260ms ease, filter 260ms ease;
    }

    .timeline-card-image:hover {
      transform: translateZ(0) scale(1.02);
      filter: saturate(110%);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }
  }

  // 左右分栏时，左侧项把图片放到靠近中轴的一侧
  :deep(.reverse .el-card__body .timeline-card) {
    flex-direction: row-reverse;
  }

  @media (max-width: 768px) {
    .timeline-list {
      max-width: 100%;
    }
    :deep(.el-timeline-item__timestamp) {
      font-size: 1.25rem;
    }
    :deep(.el-timeline-item__tail) {
      left: 12px;
    }
    :deep(.el-timeline-item__wrapper) {
      margin-left: 28px;
      margin-right: 0;
      width: auto;
      text-align: left;
    }
    :deep(.reverse .el-timeline-item__wrapper) {
      margin-left: 28px;
      margin-right: 0;
      width: auto;
      text-align: left;
    }
    .timeline-card {
      align-items: flex-start;
      flex-direction: row;
      gap: 12px;
    }
    .timeline-card .timeline-card-image {
      width: 88px;
      height: 88px;
      border-radius: 10px;
    }
  }

  @media (max-width: 480px) {
    :deep(.el-timeline-item__wrapper) {
      margin-left: 20px;
    }
    .timeline-card {
      flex-direction: column;
      align-items: stretch;
    }
    .timeline-card .timeline-card-image {
      width: 100%;
      height: 180px;
    }
  }
}

// 动画
@keyframes tl-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tl-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(127, 90, 240, 0.35), 0 6px 12px rgba(0, 0, 0, 0.2);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(127, 90, 240, 0), 0 6px 12px rgba(0, 0, 0, 0.2);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(127, 90, 240, 0), 0 6px 12px rgba(0, 0, 0, 0.2);
  }
}
// 分页控件
.mt-4 {
  display: flex;
  justify-content: center;
  margin: 40px 0px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 50%;
  transform: translateX(-50%);
}
.empty {
  margin: 0 auto;
}
</style>
