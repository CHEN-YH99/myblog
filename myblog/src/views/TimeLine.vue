<template>
  <div class="timeline">
    <!-- 回到顶部控件 -->
    <el-backtop class="backtop animate__animated animate__slideInUp" target="body" />
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/timeline4k.jpg" alt="" />
        <div class="inner-header flex">
          <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer  />
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
    <div v-else-if="articleslist.length" class="timeline_content animate__animated animate__fadeInUp">
      <el-timeline style="max-width: 600px">
       <el-timeline-item 
         v-for="(article, index) in articlesWithYearDisplay"
         :key="article._id || ((currentPage - 1) * pageSize + index)"
         :class="{ 
           reverse: (((currentPage - 1) * pageSize + index) % 2) === 1,
           'same-year': !article.isFirstOfYear
         }"
         :timestamp="getTimestampDisplay(article)"
         :hollow="true" 
         center
         placement="top"
         type="primary"
       >
         <el-card @click="goToArticle(article)" style="cursor: pointer;">
           <div class="timeline-card">
             <el-image 
               class="timeline-card-image" 
               style="width: 100px; height: 100px" 
               fit="cover"
               :src="article.image"
               :lazy="true"
             />
             <div class="timeline-card-content">
               <h4>{{ article.title }}</h4>
               <!-- <p>{{ article.excerpt }}</p> -->
               <div class="publish-time">发布时间：{{ formatFullDate(article.publishDate) }}</div>
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
      hide-on-single-page:true
      background
      layout="prev, pager, next "
      :total="total"
      class=" mt-4 "
    />
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
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

// 路由
const router = useRouter()

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
  retryLoad
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

// 日期格式化函数
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无日期'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效日期'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  // const hours = String(date.getHours()).padStart(2, '0')
  // const minutes = String(date.getMinutes()).padStart(2, '0')
  // const seconds = String(date.getSeconds()).padStart(2, '0')
  // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
   return `${year}-${month}-${day}`
}

// 处理文章年份显示逻辑的计算属性
const articlesWithYearDisplay = computed(() => {
  const articles = pagedArticles.value
  const result: Array<Article & { showYear: boolean; isFirstOfYear: boolean }> = []
  let lastYear = ''
  
  articles.forEach((article, index) => {
    const currentYear = getYearFromDate(article.publishDate)
    const showYear = currentYear !== lastYear
    const isFirstOfYear = showYear
    
    result.push({
      ...article,
      showYear,
      isFirstOfYear
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
  const container = document.querySelector('.main-content') as HTMLElement | null
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

// 分页监听清理函数
let stopWatchingPagination: (() => void) | null = null

// 组件挂载后获取文章列表数据
onMounted(async() => {
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
  margin-top: 2rem;
  box-shadow: 2px 2px 10px 0px #0000001a;
  max-width: 800px;
  margin: 50px auto;
  border-radius: 10px;
  padding: 2.5rem;
  // background-color: #fff;
  :deep .el-timeline-item__node {
    background-color: rgb(88, 191, 242);
  }
  :deep .el-timeline-item__timestamp {
    font-size: 1.5rem;
    color: rgb(88, 191, 242);
  }
  
  // 同年文章缩小行距
  :deep .same-year {
    .el-timeline-item__tail {
      height: 20px; // 缩小连接线高度
    }
    
    .el-timeline-item__wrapper {
      padding-bottom: 10px; // 缩小底部间距
    }
    
    // 隐藏时间戳区域以节省空间
    .el-timeline-item__timestamp {
      display: none;
    }
  }
  .timeline-card {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    // flex: 1 1 100%;
    .timeline-card-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      .publish-time {
        margin-top: 8px;
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
      }
    }
    .timeline-card-image {
       flex-shrink: 0; // 防止图片挤压缩小
    }
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