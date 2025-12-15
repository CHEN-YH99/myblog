<!-- path: src/views/Home.vue -->
<template>
  <div class="home-page">
    <div class="header" ref="headerRef">
      <!-- LCP/首图：使用 <img>，便于浏览器尽早发现与调度，并设置 fetchpriority -->
      <img
        ref="headerBgRef"
        class="header-bg"
        :src="url"
        alt="首页头图"
        fetchpriority="high"
        loading="eager"
        decoding="async"
        sizes="100vw"
        width="1920"
        height="1080"
      :style="heroStyle"
      />
      <div class="inner-header flex" ref="innerHeaderRef">
        <h1 v-typing="{ duration: 1000 }" v-once class="animate__animated animate__backInDown">小灰个人博客</h1>
      </div>
      <el-icon color="#ffffff" size="30px" class="turndown" @click="scrollDown"
        ><arrow-down-bold
      /></el-icon>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    <!-- 内容区域 -->
    <div class="main-content">
      <!-- 回到顶部控件（带入场/离场动画；交由 v-show 控制，组件内部始终可见） -->
      <transition
        appear
        enter-active-class="animate__animated animate__slideInUp"
        leave-active-class="animate__animated animate__slideOutDown"
      >
        <el-backtop
          v-show="backTopVisible"
          :visibility-height="-1"
          class="backtop"
          target="body"
        />
      </transition>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
        <el-skeleton :rows="5" animated />
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <el-alert title="加载失败" :description="error" type="error" show-icon :closable="false" />
        <el-button type="primary" @click="retryLoadData" class="retry-btn">重新加载</el-button>
      </div>

      <!-- 正常内容 -->
      <el-row v-else class="animate__animated animate__fadeInUp">
        <div v-if="articleslist.length" class="content-list flex">
          <!-- 左侧文章列表 -->
          <el-col :span="18">
            <div
              v-for="(article, index) in displayedArticles"
              :key="article._id || (currentPage - 1) * pageSize + index"
              class="article-card"
              :class="{
                // 使用全局索引保证跨页也交错
                reverse: ((currentPage - 1) * pageSize + index) % 2 === 1,
              }"
              @click="goToArticle(article)"
              style="cursor: pointer"
            >
              <div class="card-image">
                <el-image
                  style="width: 100%; height: 100%"
                  :src="article.image || url"
                  :alt="article.title || '文章封面'"
                  :fit="fit"
                  :lazy="index !== 0"
                  @error="handleImageError"
                >
                  <template #placeholder>
                    <div class="image-placeholder">
                      <el-icon class="is-loading"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>

              <div class="card-content">
                <h3 class="article-title">{{ article.title || '无标题' }}</h3>

                <div class="article-meta">
                  <span v-if="article.isTop" class="meta-item">📌 置顶</span>
                  <span class="meta-item">📅 发表于 {{ formatDate(article.publishDate) }}</span>
                  <span class="meta-item">🔄 更新于 {{ formatDate(article.updateDate) }}</span>
                </div>

                <div class="article-tags">
                  <template
                    v-if="article.tags && Array.isArray(article.tags) && article.tags.length"
                  >
                    <span
                      class="tag"
                      v-for="(tag, i) in article.tags"
                      :key="i"
                      :style="{ backgroundColor: colorFor(tag), color: '#fff' }"
                    >
                      {{ tag }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="tag">博客部署</span>
                    <span class="tag">linux</span>
                    <span class="tag">阿里云轻量服务器</span>
                    <span class="tag">宝塔面板</span>
                  </template>
                </div>

                <div class="article-stats">
                  <span
                    class="like-btn"
                    :class="{
                      liked: isLiked(article._id),
                      loading: isLiking(article._id),
                    }"
                    @click.stop="onToggleLike(article._id)"
                  >
                    <el-icon v-if="!isLiking(article._id)">
                      {{ isLiked(article._id) ? '❤️' : '🤍' }}
                    </el-icon>
                    <el-icon v-else class="loading-icon">
                      <Loading />
                    </el-icon>
                    {{ formatNumber(article.likes || 0) }}
                  </span>
                  <span>👁 {{ formatNumber(article.views || 0) }}</span>
                </div>

                <p class="article-excerpt">
                  {{ truncateText(article.excerpt || '', 100) }}
                </p>
              </div>
            </div>
            <!-- 分页控件：双向绑定当前页与每页条数 -->
            <el-pagination
              v-if="total > pageSize"
              size="small"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :hide-on-single-page="true"
              background
              layout="prev, pager, next"
              :total="total"
              class="mt-4"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </el-col>
          <!-- 右侧个人信息栏 -->
          <el-col v-if="sidebarReady" :span="6">
            <!-- 右侧个人信息栏 -->
            <div class="about-me">
              <el-image :src="url" :fit="fit" alt="个人头像/关于我图片" lazy />
              <el-avatar class="avatar" shape="circle" size="large" :src="url" />
              <h5>小灰的个人博客</h5>
              <div class="pub about-me-content">
                <p>👋 写出<i>HelloWord你就可以拿高薪了</i></p>
              </div>
              <div class="pub my-data">
                <div class="pub-item">
                  <p>📖 文章{{ formatNumber(articleslist.length) }}</p>
                </div>
                <div class="pub-item">
                  <p>👍 点赞量{{ formatNumber(totalLikes) }}</p>
                </div>
                <div class="pub-item">
                  <p>🎉 阅读量{{ formatNumber(totalViews) }}</p>
                </div>
              </div>
              <div class="my-tags">
                <button class="custom-gitee-btn" @click="openGitee">
                  <el-icon class="icon" size="18">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill="currentColor"
                        d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"
                      />
                    </svg>
                  </el-icon>
                  <span>My Gitee</span>
                </button>
              </div>
              <div class="my-links">
                <img src="../assets/images/csdn.svg" alt="CSDN" @click="openLink('csdn')" />
                <img src="../assets/images/github.svg" alt="GitHub" @click="openLink('github')" />
                <img
                  src="../assets/images/哔哩哔哩.svg"
                  alt="哔哩哔哩"
                  @click="openLink('bilibili')"
                />
              </div>
            </div>
            <!-- 公告栏 -->
            <div class="about-me article-info">
              <div class="tag-cloud">
                <div class="tag-header">📢公告</div>
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
                  <router-link
                    v-for="tag in tagslist"
                    :key="tag"
                    class="tag"
                    :to="{ name: 'CategoryTag', params: { tag } }"
                    :style="`background-color: ${colorFor(tag)} !important; color: #fff; padding: 4px 8px; border-radius: 4px;`"
                  >
                    {{ tag }}
                  </router-link>
                </div>
              </section>
            </div>
            <!-- 网站咨询栏 -->
            <div class="about-me article-info">
              <div class="tag-cloud">
                <div class="tag-header">📒网站咨询</div>
                <div class="tags-content">
                  <p>文章数目: {{ formatNumber(articleslist.length) }}</p>
                  <p>运行时间: {{ formatTime(Date.now() - startTime) }}</p>
                  <p>用户: {{ formatNumber(userStats.totalUsers) }}</p>
                  <p>今日访问: {{ formatNumber(todayVisits) }}</p>
                </div>
              </div>
            </div>
          </el-col>
        </div>
        <div v-else class="empty">
          <el-empty description="暂无文章" :image-size="200">
            <el-button type="primary" @click="retryLoadData">刷新</el-button>
          </el-empty>
        </div>
      </el-row>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch, nextTick, defineAsyncComponent } from 'vue'
import { ArrowDownBold, Loading, Picture } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useArticles } from '@/composables/useArticles'
// import { useLikes } from '@/composables/useLikes'
import { useUserStore } from '@/stores/user'
import { useArticlesStore } from '@/stores/getarticles'
import { formatNumber } from '@/utils/format'
import { getUserStats } from '@/api/user'

const WaveContainer = defineAsyncComponent(() => import('@/components/WaveContainer.vue'))
const Footer = defineAsyncComponent(() => import('@/components/Footer.vue'))
// 已全局引入 index.scss 于 main.ts，无需重复引入
import bgImage from '@/assets/images/shunsea1.jpg'
import { useExternalLinkConfirm } from '@/composables/useExternalLinkConfirm'
import { debounce } from '@/utils/debounce'
import { useParallax } from '@/composables/useParallax'

// 路由
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()
const articlesStore = useArticlesStore()

// 首屏优化：侧边栏延迟渲染与空闲时加载
const sidebarReady = ref(false)
const scheduleIdle = (cb: () => void) => {
  try {
    const ric = (window as any).requestIdleCallback
    if (typeof ric === 'function') {
      ric(cb, { timeout: 1200 })
      return
    }
  } catch {}
  setTimeout(cb, 300)
}

// 使用优化后的 composable
const {
  articles: articleslist,
  loading,
  error,
  total,
  pagedArticles,
  currentPage,
  pageSize,
  initArticles,
  cleanup,
  goToArticle,
  watchPagination,
} = useArticles({
  routeName: 'Home',
  autoInit: true,
  defaultPageSize: 10,
})

// 仅渲染首屏少量卡片，待空闲再补齐，降低初始渲染压力
const INITIAL_RENDER_COUNT = 4
const displayedArticles = computed(() => {
  const all = pagedArticles.value
  return sidebarReady.value ? all : all.slice(0, Math.min(INITIAL_RENDER_COUNT, pageSize.value))
})

// 点赞功能（直接使用 articlesStore 提供的状态与动作）
const likedIds = computed(() => articlesStore.likedArticleIds)
const isLiked = (id: string) => likedIds.value.includes(id)
const isLiking = (id: string) => articlesStore.isLiking(id)
const onToggleLike = async (id: string) => {
  try {
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再进行点赞')
      return
    }

    const prevLiked = likedIds.value.includes(id)

    await articlesStore.toggleLike(id)

    const nowLiked = likedIds.value.includes(id)

    if (nowLiked !== prevLiked) {
      ElMessage.success(nowLiked ? '点赞成功' : '已取消点赞')
    }
  } catch (error: any) {
    const msg = error?.message || '操作失败，请重试'
    ElMessage.error(msg)
  }
}

// 用户统计数据
const userStats = ref({
  totalUsers: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newUsersThisMonth: 0,
})

// 今日访问量（模拟数据）
const todayVisits = ref(0)

// 计算总点赞数
const totalLikes = computed(() => {
  return articleslist.value.reduce(
    (total, article) => total + (article.likes || 0),
    0,
  )
})

// 计算总阅读量
const totalViews = computed(() => {
  return articleslist.value.reduce(
    (total, article) => total + (article.views || 0),
    0,
  )
})

// 获取网站运行时间
const startTime: number = new Date('2025-06-03').getTime()
const url = ref(bgImage)
const fit = ref('cover')
const innerHeaderRef = ref<HTMLElement | null>(null)
const headerBgRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const heroProgress = ref(0)
const headerHeight = ref(0)
const heroScrollY = ref(0)
const parallaxReady = ref(false)
let initialParallaxTimer: number | null = null
const heroStyle = computed(() => {
  // 初次激活/返回时，先稳定为 0，待同步完成后再启用视差
  if (!parallaxReady.value) {
    return { transform: 'translate3d(0, 0, 0)', willChange: 'transform' }
  }
  const baseH = headerHeight.value || window.innerHeight || 1
  const y = Math.min(Math.max(0, heroScrollY.value), baseH) // 限制在首屏高度内
  const translateY = y * 0.4 // 视差系数，略增强调可见度
  return {
    transform: `translate3d(0, ${translateY.toFixed(2)}px, 0)`,
    willChange: 'transform',
  }
})
let heroRaf = 0
const safeScrollTop = () => {
  try {
    return (
      (document.documentElement && document.documentElement.scrollTop) ||
      (document.body && document.body.scrollTop) ||
      window.pageYOffset ||
      0
    )
  } catch {
    return 0
  }
}
const updateHeaderHeight = () => {
  // 以视口高度作为基准，避免容器 padding/布局变化引起的高度测量误差
  headerHeight.value = window.innerHeight || 1
}
const updateHeroProgress = () => {
  const baseH = headerHeight.value || (headerRef.value?.getBoundingClientRect().height || window.innerHeight || 1)
  const top = safeScrollTop()
  heroProgress.value = Math.min(top / baseH, 1)
}
const updateHeroScrollY = () => {
  // 使用 header 的几何信息计算在视口内的偏移，更稳健地反映真实显示位置
  try {
    const el = headerRef.value as HTMLElement | null
    if (el) {
      const rect = el.getBoundingClientRect()
      headerHeight.value = rect.height || headerHeight.value || (window.innerHeight || 1)
      heroScrollY.value = Math.max(0, -rect.top)
    } else {
      headerHeight.value = window.innerHeight || 1
      heroScrollY.value = safeScrollTop()
    }
  } catch {
    headerHeight.value = window.innerHeight || 1
    heroScrollY.value = safeScrollTop()
  }
}
const onHeroScroll = () => {
  cancelAnimationFrame(heroRaf)
  heroRaf = requestAnimationFrame(() => {
    updateHeroScrollY()
    updateHeroProgress()
  })
}

// 在返回/恢复/激活时强制同步一次，避免浏览器滚动位置恢复在我们挂监听之前完成而导致视差不同步
const syncHeroProgressSoon = () => {
  try {
    updateHeroScrollY()
    updateHeroProgress()
    requestAnimationFrame(() => {
      updateHeroScrollY()
      updateHeroProgress()
    })
    setTimeout(() => {
      updateHeroScrollY()
      updateHeroProgress()
    }, 0)
  } catch {}
}

let heroScrollBound = false
const bindHeroScroll = () => {
  if (heroScrollBound) return
  window.addEventListener('scroll', onHeroScroll, { passive: true })
  heroScrollBound = true
}
const unbindHeroScroll = () => {
  if (!heroScrollBound) return
  window.removeEventListener('scroll', onHeroScroll as any)
  heroScrollBound = false
}

// 浏览器后退使用 BFCache 恢复时触发，确保滚动位与视差同步
const onPageShow = () => {
  // 返回首页时强制回到顶部，彻底避免背景图偏移
  try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch {}
  updateHeaderHeight()
  parallaxReady.value = false
  syncHeroProgressSoon()
  requestAnimationFrame(() => {
    parallaxReady.value = true
  })
}

// 视口尺寸变化时（地址栏显隐或旋转），同步一次，避免 translate 误差
const onResize = () => {
  updateHeaderHeight()
  syncHeroProgressSoon()
}

// 标题视差：向上移动速度较快，保持清晰
useParallax(innerHeaderRef, { speed: 0.8 })

// 格式化日期
const formatTime = (ms: number): string => {
  const days: number = Math.floor(ms / (1000 * 60 * 60 * 24))
  return `${days}天`
}

// 日期格式化函数
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '暂无日期'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '无效日期'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '日期格式错误'
  }
}

// 文本截断函数
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 点击按钮下滑
const scrollDown = () => {
  try {
    const target = document.body || document.documentElement
    target.scrollTo({
      top: target.scrollTop + window.innerHeight,
      behavior: 'smooth',
    })
  } catch (error) {
    console.error('滚动失败:', error)
    window.scrollBy(0, window.innerHeight)
  }
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  if (import.meta.env?.DEV) console.warn('图片加载失败:', event)
}

// 分页变化处理
const handlePageChange = async (page: number) => {
  try {
    currentPage.value = page
    await nextTick()
    scrollToTop()
  } catch (error) {
    console.error('分页切换失败:', error)
  }
}

// 每页大小变化处理
const handleSizeChange = async (size: number) => {
  try {
    pageSize.value = size
    currentPage.value = 1
    await nextTick()
    scrollToTop()
  } catch (error) {
    console.error('分页大小切换失败:', error)
  }
}

// 滚动到顶部
const scrollToTop = () => {
  try {
    const container = document.querySelector(
      '.main-content',
    ) as HTMLElement | null
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (error) {
    console.error('滚动到顶部失败:', error)
  }
}

// 外链确认
const { confirmAndOpen } = useExternalLinkConfirm()

// 打开外部链接（带确认）
const openGitee = () => {
  confirmAndOpen('https://gitee.com/xanxus99')
}

const openLink = (type: string) => {
  const links = {
    csdn: 'https://blog.csdn.net/',
    github: 'https://github.com/CHEN-YH99',
    bilibili: 'https://www.bilibili.com/',
  }

  const url = links[type as keyof typeof links]
  if (url) {
    confirmAndOpen(url)
  }
}

// 根据标签搜索：跳转到分类标签下的文章列表页
const searchByTag = (tag: string) => {
  const t = (tag || '').trim()
  if (!t) return
  router.push({
    name: 'CategoryTag',
    params: { tag: t },
  })
}

// 加载用户统计数据
const loadUserStats = async () => {
  try {
    const stats = await getUserStats()
    userStats.value = stats

    todayVisits.value = Math.floor(Math.random() * 1000) + 100
  } catch (error) {
    console.error('加载用户统计失败:', error)
  }
}

// 彩色板标签云
const tagslist = computed(() => {
  try {
    const allTags = Array.from(
      new Set(
        articleslist.value
          .flatMap((article) => article.tags || [])
          .filter(
            (tag): tag is string =>
              tag !== undefined && tag !== null && tag.trim() !== '',
          ),
      ),
    )

    return [...allTags].sort(() => Math.random() - 0.5).slice(0, 20)
  } catch (error) {
    console.error('生成标签列表失败:', error)
    return []
  }
})

// 稳定配色
const colorFor = (str: string) => {
  try {
    if (!str) return '#666'

    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    const hue = hash % 360
    const sat = 72
    const light = 68
    return `hsl(${hue}deg, ${sat}%, ${light}%)`
  } catch (error) {
    console.error('生成颜色失败:', error)
    return '#666'
  }
}

// 监听分页变化
watch([currentPage, pageSize], async () => {
  try {
    await nextTick()
    scrollToTop()
  } catch (error) {
    console.error('分页监听失败:', error)
  }
})

// 分页监听清理函数
let stopWatchingPagination: (() => void) | null = null

onMounted(async () => {
  try {
    // 返回或首次进入首页时，强制回到顶部，避免首图因浏览器滚动恢复而出现偏移
    try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch {}
    await initArticles()

    if (userStore.isLoggedIn && !articlesStore.likeStatusInitialized) {
      await articlesStore.initializeLikeStatus()
    }

    await loadUserStats()

    stopWatchingPagination = watchPagination()

    // 空闲时再补齐列表渲染，降低首屏压力
    scheduleIdle(() => {
      sidebarReady.value = true
    })
    parallaxReady.value = false
    bindHeroScroll()
    updateHeaderHeight()
    updateHeroScrollY()
    syncHeroProgressSoon()
    requestAnimationFrame(() => {
      updateHeroScrollY()
      requestAnimationFrame(() => {
        parallaxReady.value = true
      })
    })
    window.addEventListener('pageshow', onPageShow as any)
    window.addEventListener('resize', onResize as any)
  } catch (error) {
    console.error('组件初始化失败:', error)
  }
})

// 监听用户登录状态变化
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    try {
      if (isLoggedIn) {
        await articlesStore.initializeLikeStatus()
      } else {
        articlesStore.resetLikeStatus()
      }
    } catch (error) {
      console.error('用户状态变化处理失败:', error)
    }
  },
)

onActivated(() => {
  parallaxReady.value = false
  updateHeaderHeight()
  bindHeroScroll()
  syncHeroProgressSoon()
  requestAnimationFrame(() => {
    parallaxReady.value = true
  })
})

onDeactivated(() => {
  unbindHeroScroll()
  cancelAnimationFrame(heroRaf)
})

onBeforeUnmount(() => {
  try {
    cleanup()
    if (stopWatchingPagination) {
      stopWatchingPagination()
    }
    unbindHeroScroll()
    window.removeEventListener('pageshow', onPageShow as any)
    window.removeEventListener('resize', onResize as any)
    cancelAnimationFrame(heroRaf)
  } catch (error) {
    console.error('组件清理失败:', error)
  }
})

// 回到顶部-动画可见性控制（增强版：同时监听 window/document/body/html）
const backTopVisible = ref(false)
const backTopThreshold = 200
const getScrollTop = () => {
  try {
    return (
      (document.documentElement && document.documentElement.scrollTop) ||
      (document.body && document.body.scrollTop) ||
      window.pageYOffset ||
      0
    )
  } catch {
    return 0
  }
}
const setBackTopVisibility = () => {
  backTopVisible.value = getScrollTop() > backTopThreshold
}
// 统一防抖：避免频繁进入/离开动画
const onBackTopScroll = debounce(setBackTopVisibility, 150)

let _backTopScrollTargets: EventTarget[] = []

onMounted(() => {
  const bodyEl = document.body
  const docEl = document.documentElement
  _backTopScrollTargets = [window, document, bodyEl, docEl].filter(Boolean) as EventTarget[]
  _backTopScrollTargets.forEach((t) => {
    t.addEventListener?.('scroll', onBackTopScroll as any, { passive: true })
    t.addEventListener?.('wheel', onBackTopScroll as any, { passive: true })
    t.addEventListener?.('touchmove', onBackTopScroll as any, { passive: true })
  })
  setBackTopVisibility()
})

onBeforeUnmount(() => {
  _backTopScrollTargets.forEach((t) => {
    t.removeEventListener?.('scroll', onBackTopScroll as any)
    t.removeEventListener?.('wheel', onBackTopScroll as any)
    t.removeEventListener?.('touchmove', onBackTopScroll as any)
  })
  _backTopScrollTargets = []
})

// 重新加载数据
const retryLoadData = async () => {
  try {
    await initArticles()
    await loadUserStats()
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('重新加载失败:', error)
    ElMessage.error('重新加载失败，请稍后再试')
  }
}
</script>

<style scoped>
/* 居中空状态 */
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 40px 0;
}
/* 保证 Element距拉偏 */
.empty :deep(.el-empty) {
  margin: 0 auto;
}

/* 文章卡片悬停扫光动画 */
.article-card {
  position: relative;
  overflow: hidden; /* 隐藏伪元素溢出部分 */
}

.article-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%; /* 初始位置在卡片左侧外部 */
  width: 75%;
  height: 100%;
  background: linear-gradient(
    100deg,
    rgba(96, 165, 250, 0) 0%,
    rgba(96, 165, 250, 0.3) 20%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(96, 165, 250, 0.3) 80%,
    rgba(96, 165, 250, 0) 100%
  );
  transform: skewX(-25deg); /* 倾斜光效 */
  transition: left 0.8s cubic-bezier(0.23, 1, 0.32, 1); /* 平滑过渡效果 */
  pointer-events: none; /* 确保不影响鼠标事件 */
}

.article-card:hover::before {
  left: 100%; /* 鼠标悬停时，移动到卡片右侧外部 */
}

/* ICP 备案信息 */
</style>
