<!-- path: src/views/Home.vue -->
<template>
  <div class="home-page">
    <div class="header">
      <div class="inner-header flex">
        <h1>小灰个人博客</h1>
      </div>
      <el-icon color="#ffffff" size="30px" class="turndown" @click="scrollDown"><arrow-down-bold /></el-icon>
      <!-- 海水波浪 -->
      <div class="wave-container">
        <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
          <defs>
            <path id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g class="parallax">
            <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" />
            <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
            <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
            <use xlink:href="#gentle-wave" x="48" y="7" fill="#fff" />
          </g>
        </svg>
      </div>
    </div>
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 回到顶部 -->
      <el-backtop class="backtop" target="body" />

      <el-row>
        <!-- 内容区域 -->
        <div class="content-list flex">
          <el-col :span="18">
            <div
              v-for="(article, index) in pagedArticles"
              :key="article._id || ((currentPage - 1) * pageSize + index)"
              class="article-card"
              :class="{
                // 使用全局索引保证跨页也交错
                reverse: (((currentPage - 1) * pageSize + index) % 2) === 1
              }"
            >
              <div class="card-image">
                <el-image style="width: 100%; height: 100%;" :src="article.cover || url" :fit="fit" />
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

                <div class="article-stats">
                  <span>👍 {{ article.likes || 0 }}</span>
                  <span>👁 {{ article.views || 0 }}</span>
                </div>

                <p class="article-excerpt">{{ article.excerpt || '' }}</p>
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
                  <p>📖 文章116</p>
                </div>
                <div class="pub-item">
                  <p>👍 点赞量116</p>
                </div>
                <div class="pub-item">
                  <p>🎉 阅读量1.5w</p>
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
                  <p>📅 创建于2025-08-03</p>
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
                  <p> 文章数目: {{ articleslist.length }}</p>
                  <p>运行时间: {{ formatTime(Date.now() - startTime) }}</p>
                  <p>访问人数: 2356</p>
                </div>
              </div>
            </div>
          </el-col>
        </div>	
      </el-row>
    </div>
    <Footer/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { ArrowDownBold } from '@element-plus/icons-vue'
import type { Article } from '@/api/articles'
import { ArticleService } from '../api/articles'
import Footer from '@/components/Footer.vue'

import '../assets/style/index.scss'
import bgImage from '../assets/images/shunsea1.jpg'  // 图片地址 - 正确的静态资源引用方式

// 获取网站运行时间
const startTime: number = new Date('2025-06-03').getTime(); 
const formatTime = (ms: number): string => {
  const days: number = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}天`;
}

// 扩展前端可用的显示字段，添加封面图等前端特有字段
type ArticleView = Article & {
  cover?: string  // 封面图片，前端使用
}

const articleslist = ref<ArticleView[]>([])
const url = ref(bgImage)
const fit = ref('cover')

// 点击按钮下滑
const scrollDown =() => {
  document.body.scrollTo({ 
    top:  document.documentElement.scrollTop + window.innerHeight, 
    behavior: 'smooth'
  })
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

// 分页状态与当前页数据
const currentPage = ref(1)
const pageSize = ref(5)
const total = computed(() => articleslist.value.length)
const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return articleslist.value.slice(start, start + pageSize.value)
})


// 翻页时回到顶部（根据你实际滚动容器选择 main-content 或 window）
watch([currentPage, pageSize], async () => {
  await nextTick()
  const container = document.querySelector('.main-content') as HTMLElement | null
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

// 在组件挂载时获取 MongoDB 数据并在控制台输出
onMounted(async () => {
  try {
    const res = await ArticleService.getAllArticles()
    console.log(`获取到的文章数据为：`, res)

    articleslist.value = res
    console.log(`共获取到 ${res.length} 篇文章`)
    currentPage.value = 1
  } catch (error) {
    console.error('获取 MongoDB 数据失败:', error)
  }
})
</script>

<style scoped lang="scss">
/* 样式已移动到 index.css 中 */

</style>
