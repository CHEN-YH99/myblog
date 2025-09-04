<template>
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer  />
  </div>
  <!-- 内容 -->
  <div v-if="articleslist.length" class="timeline_content animate__animated animate__fadeInUp">
    <!-- <el-timeline style="max-width: 600px">
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
   </el-timeline> -->
    <!-- 标签栏 -->
    <div class="about-me tags-info">
      <section class="tag-cloud">
        <h3 class="tag-header">分类</h3>
        <div class="tags-content">
          <a
            v-for="tag in tagslist"
            :key="tag"
            class="tag"
            :style="{ color: colorFor(tag) }"
        
          >
            {{ tag }}
          </a>
        </div>
      </section>
    </div>
  </div>
  <div v-else class="empty">
    <el-empty description="暂无文章" :image-size="200" />
  </div>
  <!-- 页脚 -->
  <Footer />
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue';
import Footer from '@/components/Footer.vue';

// 请求文章列表数据
const {
  articles: articleslist,
  initArticles,
} = useArticles()

// 彩色板标签云
const tagslist = computed(() => {
  // 收集所有标签并去重
  const allTags = Array.from(
    new Set(
      articleslist.value
        .flatMap(article => article.tags)
        .filter((tag): tag is string => tag !== undefined)
    )
  )
  
  // 随机选择20个标签
  return [...allTags]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
})

// 稳定配色：根据标签文本 -> HSL 颜色（同一标签始终同色）
const colorFor=(str:string)=> {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360          // 色相 0-359
  const sat = 72                  // 饱和度，深色背景下略高更鲜明
  const light = 68                // 明度，注意和背景对比度
  return `hsl(${hue}deg, ${sat}%, ${light}%)`
}

// 组件挂载后获取文章列表数据
onMounted(async() => {
  await initArticles()
})
</script>
<style scoped lang="scss">
.tags-info {
  width: 50%;
  margin: 50px auto 200px auto;
  @media (max-width: 768px) {
    width: 80% !important; // 平板宽度
    margin: 50px auto 200px auto !important; // 外边距完全一样
  }
  
  @media (max-width: 480px) {
    width: 95% !important; // 手机宽度
    margin: 50px auto 200px auto !important; // 外边距完全一样
  }
  .tag-cloud{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px; 
    .tag-header {
      font-size: 20px;
    }
  }
  
}

</style>