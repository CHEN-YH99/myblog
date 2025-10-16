<!-- path: src/views/Home.vue -->
<template>
  <div class="home-page">
    <div class="header">
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">小灰个人博客</h1>
      </div>
      <el-icon color="#ffffff" size="30px" class="turndown" @click="scrollDown"><arrow-down-bold /></el-icon>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    <!-- 内容区域 -->
    <div class="main-content">
      <!-- 回到顶部控件 -->
      <el-backtop class="backtop animate__animated animate__slideInUp" target="body" />

      <el-row class="animate__animated animate__fadeInUp">
        <div v-if="articleslist.length" class="content-list flex ">
          <!-- 左侧文章列表 -->
          <el-col :span="18">
            <div
              v-for="(article, index) in pagedArticles"
              :key="article._id || ((currentPage - 1) * pageSize + index)"
              class="article-card"
              :class="{
                // 使用全局索引保证跨页也交错
                reverse: (((currentPage - 1) * pageSize + index) % 2) === 1
              }"
              @click="goToArticle(article)"
              style="cursor: pointer;"
            >
              <div class="card-image">
                <el-image style="width: 100%; height: 100%;" :src="article.image || url" :fit="fit" />
              </div>

              <div class="card-content">
                <h3 class="article-title">{{ article.title }}</h3>

                <div class="article-meta">
                  <span class="meta-item">📌 置顶</span>
                  <span class="meta-item">📅 发表于 {{ formatDate(article.publishDate) }}</span>
                  <span class="meta-item">🔄 更新于 {{ formatDate(article.updateDate) }}</span>
                </div>

                <div class="article-tags">
                  <template v-if="Array.isArray(article.tags) && article.tags.length">
                    <span class="tag" v-for="(tag, i) in article.tags" :key="i">{{ tag }}</span>
                  </template>
                  <template v-else>
                    <span class="tag">博客部署</span>
                    <span class="tag">linux</span>
                    <span class="tag">阿里云轻量服务器</span>
                    <span class="tag">宝塔面板</span>
                  </template>
                </div>

                <!-- <div class="article-stats">
                  <span>👍 {{ article.likes || 0 }}</span>
                  <span>👁 {{ article.views || 0 }}</span>
                </div> -->

                <div class="article-stats">
                  <span 
                    class="like-btn"
                    :class="{ 
                      'liked': isLiked(article._id), 
                      'loading': isLiking(article._id) 
                    }"
                    @click.stop="handleLike(article._id)"
                  >
                    <el-icon v-if="!isLiking(article._id)">
                      {{ isLiked(article._id) ? '❤️' : '🤍' }}
                    </el-icon>
                    <el-icon v-else class="loading-icon">
                      <Loading />
                    </el-icon>
                    {{ article.likes || 0 }}
                  </span>
                  <span>👁 {{ formatNumber(article.views || 0) }}</span>
                </div>

                <p class="article-excerpt">{{ (article.excerpt || '').length > 30 ? (article.excerpt || '').substring(0, 30) + '...' : (article.excerpt || '') }}</p>
              </div>
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
          </el-col>
          <!-- 右侧个人信息栏 -->
          <el-col :span="6">
            <!-- 右侧个人信息栏 -->
            <div class="about-me">
              <el-image :src="url" :fit="fit"/>
              <el-avatar class="avatar" shape="circle" size="large" :src="url" />
              <h5>小灰的个人博客</h5>
              <div class="pub about-me-content">
                <p>👋 写出<i>HelloWord你就可以拿高薪了</i></p>
              </div>
              <div class="pub my-data">
                <div class="pub-item">
                  <p>📖 文章{{ articleslist.length }}</p>
                </div>
                <div class="pub-item">
                  <p>👍 点赞量{{ totalLikes }}</p>
                </div>
                <div class="pub-item">
                  <p>🎉 阅读量{{ formatNumber(totalViews) }}</p>
                </div>
              </div>
              <div class="my-tags">
                <button class="custom-gitee-btn">
                  <el-icon class="icon" size="18">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"/>
                    </svg>
                  </el-icon>
                  My Gitee
                </button>
              </div>
              <div class="my-links">
                <img src="../assets/images/csdn.svg"/>
                <img src="../assets/images/github.svg"/>
                <img src="../assets/images/哔哩哔哩.svg"/>
              </div>
            </div>
            <!-- 公告栏 -->
            <div class="about-me article-info ">
              <div class="tag-cloud">
                <div class="tag-header"> 📢公告 </div>
                <div class="tags-content">
                  <p>📅 创建于2025-06-03</p>
                  <p>📝 博客地址:https://github.com/CHEN-YH99/myblog</p>
                  <p>🗨️ 技术交流群: 1060899124</p>
                  <p>更多内容敬请期待...</p>
                </div>
              </div>
            </div>
            <!-- 标签栏 -->
            <div class="about-me tags-info">
              <section class="tag-cloud">
                <div class="tag-header">📋标签</div>
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
            <!-- 网站咨询栏 -->
            <div class="about-me article-info"> 
              <div class="tag-cloud"> 
                <div class="tag-header"> 📒网站咨询 </div>
                <div class="tags-content">
                  <p>文章数目: {{ articleslist.length }}</p>
                  <p>运行时间: {{ formatTime(Date.now() - startTime) }}</p>
                  <p>用户: 34</p>
                </div>
              </div>
            </div>
          </el-col>
        </div>	
        <div v-else class="empty">
           <el-empty description="暂无文章" :image-size="200" />
        </div>
      </el-row>
    </div>
    <Footer/>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ArrowDownBold, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import { useLikes } from '@/composables/useLikes'       // 引入获取到点赞数据文件
import { formatNumber } from '@/utils/format'         // 引入数字格式化函数
import { useUserStore } from '@/stores/user'          // 引入用户状态管理
import { useArticlesStore } from '@/stores/getarticles' // 引入文章状态管理

import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import '@/assets/style/index.scss'
import bgImage from '@/assets/images/shunsea1.jpg'  // 图片地址 - 正确的静态资源引用方式

// 路由
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()
const articlesStore = useArticlesStore()

// 使用 composable
const {
  articles: articleslist,
  // loading,
  // error,
  total,
  // tagslist,
  pagedArticles,
  currentPage,
  pageSize,
  initArticles,
  cleanup,
  goToArticle,
  watchPagination
} = useArticles('Home')

// 点赞功能
const { isLiked, isLiking, handleLike } = useLikes()
// 计算总点赞数
const totalLikes = computed(() => {
  return articleslist.value.reduce((total, article) => total + (article.likes || 0), 0)
})

// 计算总阅读量
const totalViews = computed(() => {
  return articleslist.value.reduce((total, article) => total + (article.views || 0), 0)
})


// 获取网站运行时间
const startTime: number = new Date('2025-06-03').getTime(); 
const url = ref(bgImage)
const fit = ref('cover')

// 格式化日期
const formatTime = (ms: number): string => {
  const days: number = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}天`;
}

// 日期格式化函数
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

// 点击按钮下滑
const scrollDown =() => {
  document.body.scrollTo({ 
    top:  document.documentElement.scrollTop + window.innerHeight, 
    behavior: 'smooth'
  })
}

// goToArticle 方法现在由 useArticles 提供

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
    .slice(0, 20)
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

onMounted(async () => {
  await initArticles()
  // 启用分页状态监听
  stopWatchingPagination = watchPagination()
})

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    // 用户登录后重新初始化点赞状态
    await articlesStore.initializeLikeStatus()
  } else {
    // 用户登出后重置点赞状态
    articlesStore.resetLikeStatus()
  }
})

onBeforeUnmount(() => {
  cleanup()
  // 清理分页监听
  if (stopWatchingPagination) {
    stopWatchingPagination()
  }
})
</script>

<style scoped lang="scss">
/* 样式已移动到 index.css 中 */
 .empty {
   margin: 0 auto;
 }
</style>
