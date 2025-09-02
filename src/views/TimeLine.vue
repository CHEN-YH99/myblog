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
    <!-- 内容 -->
    <div v-if="articleslist.length" class="timeline_content animate__animated animate__fadeInUp">
      <el-timeline style="max-width: 600px">
       <el-timeline-item 
         v-for="(article, index) in pagedArticles"
         :key="article._id || ((currentPage - 1) * pageSize + index)"
         :class="{ reverse: (((currentPage - 1) * pageSize + index) % 2) === 1 }"
         :timestamp="formatDate(article.publishDate)"
         :hollow="true" 
         center
         placement="top"
         type="primary"
       >
         <el-card >
           <div class="timeline-card">
             <el-image 
               class="timeline-card-image" 
               style="width: 100px; height: 100px" 
               fit="cover"
               :src="article.image"
             />
             <div class="timeline-card-content">
               <h4>{{ article.title }}</h4>
               <p>{{ article.excerpt }}</p>
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
import { onMounted , watch, nextTick } from 'vue'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

// 请求文章列表数据
const {
  articles: articleslist,
  initArticles,
  pagedArticles,
  currentPage,
  pageSize,
  total
} = useArticles()

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

watch([currentPage, pageSize], async () => {
  await nextTick()
  const container = document.querySelector('.main-content') as HTMLElement | null
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

// 组件挂载后获取文章列表数据
onMounted(async() => {
  await initArticles()
})
</script>
<style scoped lang="scss">
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
  .timeline-card {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    // flex: 1 1 100%;
    .timeline-card-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
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