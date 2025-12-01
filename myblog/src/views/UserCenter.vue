<template>
  <div class="user-center-view">
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="个人中心页面头图" />
      <div class="inner-header flex">
        <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">个人中心</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer />
  </div>

  <!-- 个人中心内容 -->
  <div class="user-center-container animate__animated animate__fadeInUp">
    <div class="content-wrapper">
      <!-- 用户信息卡片 -->
      <div class="user-info-card">
        <div class="user-avatar">
          <el-avatar :size="120" :src="displayAvatar" />
        </div>
        <div class="user-details">
          <h2 class="username">
            {{ userInfo?.nickname || userInfo?.username || '用户' }}
          </h2>
          <p class="user-email" v-if="userInfo?.email">{{ userInfo.email }}</p>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStats.articlesLiked }}</span>
              <span class="stat-label">点赞文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.talksLiked }}</span>
              <span class="stat-label">点赞说说</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.repliesCount }}</span>
              <span class="stat-label">回复数量</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能区域 -->
      <div class="function-area">
        <!-- 我的点赞 -->
        <div class="function-card">
          <div class="card-header">
            <h3>
              <el-icon><Star /></el-icon> 我的点赞
            </h3>
          </div>
          <div class="card-content">
            <el-tabs v-model="activeTab" class="user-tabs">
              <el-tab-pane label="点赞文章" name="articles">
                <div v-if="likedArticlesList.length === 0" class="empty-state">
                  <el-empty description="暂无点赞的文章" :image-size="100" />
                </div>
                <div v-else>
                  <div class="articles-grid">
                    <div
                      v-for="article in displayedLikedArticles"
                      :key="article._id"
                      class="article-item"
                      @click="goToArticle(article)"
                    >
                      <div class="article-cover">
                        <img
                          :src="article.image || '/default-article.svg'"
                          :alt="article.title"
                        />
                      </div>
                      <div class="article-info">
                        <h4 class="article-title">{{ article.title }}</h4>
                        <p class="article-summary">{{ article.excerpt }}</p>
                        <div class="article-meta">
                          <span class="article-date">
                            {{ formatDate(article.publishDate) }}
                          </span>
                          <span class="article-views">
                            {{ article.views }} 阅读
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 加载动画 / 触发器 / 全部加载完成 -->
                  <div v-if="isLoadingMore" class="load-more">
                    <el-icon class="loading-icon"><Loading /></el-icon>
                    正在加载...
                  </div>
                  <div v-else-if="hasMore" ref="loadMoreSentinel" class="load-more-sentinel"></div>
                  <div v-else class="load-more done">已加载全部</div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="点赞说说" name="talks">
                <div v-if="likedTalksList.length === 0" class="empty-state">
                  <el-empty description="暂无点赞的说说" :image-size="100" />
                </div>
                <div v-else class="talks-list">
                  <div
                    v-for="talk in likedTalksList"
                    :key="talk._id"
                    class="talk-item"
                  >
                    <div
                      class="talk-content"
                      v-html="formatContent(talk.content)"
                    ></div>
                    <div class="talk-meta">
                      <span class="talk-date">
                        {{ formatDate(talk.publishDate) }}
                      </span>
                      <span class="talk-likes">{{ talk.likes }} 点赞</span>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 账户设置 -->
        <div class="function-card">
          <div class="card-header">
            <h3>
              <el-icon><Setting /></el-icon> 账户设置
            </h3>
          </div>
          <div class="card-content">
            <div class="setting-item">
              <span class="setting-label">修改密码</span>
              <el-button
                type="primary"
                size="small"
                @click="showPasswordDialog = true"
              >
                修改
              </el-button>
            </div>
            <div class="setting-item">
              <span class="setting-label">退出登录</span>
              <el-button type="danger" size="small" @click="handleLogout">
                退出
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 修改密码对话框 -->
  <el-dialog
    v-model="showPasswordDialog"
    title="修改密码"
    width="400px"
    :before-close="handleClosePasswordDialog"
  >
    <el-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      label-width="100px"
    >
      <el-form-item label="当前密码" prop="currentPassword">
        <el-input
          v-model="passwordForm.currentPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
        <!-- 密码强度指示器 -->
        <div
          v-if="passwordForm.newPassword"
          class="password-strength-indicator"
        >
          <div class="strength-bar">
            <div
              class="strength-fill"
              :class="passwordStrength"
              :style="{ backgroundColor: passwordStrengthColor }"
            ></div>
          </div>
          <span class="strength-text" :style="{ color: passwordStrengthColor }">
            密码强度：{{ passwordStrengthText }}
          </span>
        </div>
        <!-- 密码要求提示 -->
        <div class="password-tips">
          <p class="tip-title">密码要求：</p>
          <ul class="tip-list">
            <li :class="{ valid: passwordForm.newPassword.length >= 6 }">
              至少6个字符
            </li>
            <li
              :class="{
                valid:
                  /[a-zA-Z]/.test(passwordForm.newPassword) &&
                  /\d/.test(passwordForm.newPassword),
              }"
            >
              包含字母和数字
            </li>
            <li :class="{ valid: passwordStrength === 'strong' }">
              建议包含大小写字母、数字和特殊字符
            </li>
          </ul>
        </div>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleChangePassword"
          :loading="changingPassword"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 页脚 -->
  <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Setting, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useArticlesStore } from '@/stores/getarticles'
import { useTalksStore } from '@/stores/talks'
// import { getUserLikedArticles } from '@/api/articles'
import { changePassword, type ChangePasswordParams } from '@/api/user'

import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import avatarUrl from '@/assets/images/hui.svg'

const router = useRouter()
const userStore = useUserStore()
const articlesStore = useArticlesStore()
const talksStore = useTalksStore()

// 与后台管理列表一致的默认头像生成策略
const getDefaultAvatar = (name) => {
  const safeName = name || 'User'
  const colors = ['409eff', '67c23a', 'e6a23c', 'f56c6c', '909399']
  const color = colors[safeName.length % colors.length]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${color}&color=fff&size=200`
}

// 统一的展示头像：优先使用用户头像；无则按用户名/ID生成默认头像
const displayAvatar = computed(() => {
  const user = userStore.userInfo
  if (user && user.avatar) return user.avatar
  const name =
    user?.nickname || user?.username || (user?.id ? String(user.id) : 'User')
  return getDefaultAvatar(name)
})

// 响应式数据
const activeTab = ref('articles')
const showPasswordDialog = ref(false)
const changingPassword = ref(false)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 用户统计数据（使用 getter/可枚举数组确保响应式更新）
const userStats = computed(() => ({
  // 和 Home.vue 的点赞状态保持一致，直接以列表数量为准，避免和服务器返回不一致
  articlesLiked: likedArticlesList.value.length,
  talksLiked: talksStore.likedTalksCount,
  repliesCount: 0, // 暂时设为0，后续可以从API获取
}))

// 点赞的文章列表
const likedArticlesList = ref<Api.Article.ArticleItem[]>([])

// 懒加载相关
const pageSizeLiked = 12
const displayedCount = ref(pageSizeLiked)
const isLoadingMore = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

const displayedLikedArticles = computed(() =>
  likedArticlesList.value.slice(0, displayedCount.value),
)

const hasMore = computed(() =>
  displayedCount.value < likedArticlesList.value.length,
)

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  // 模拟短暂加载动画，提升体验
  await new Promise((r) => setTimeout(r, 400))
  displayedCount.value = Math.min(
    likedArticlesList.value.length,
    displayedCount.value + pageSizeLiked,
  )
  isLoadingMore.value = false
}

const setupIntersection = async () => {
  await nextTick()
  if (!loadMoreSentinel.value) return
  if (io) {
    io.disconnect()
    io = null
  }
  io = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting) {
      loadMore()
    }
  })
  io.observe(loadMoreSentinel.value)
}

const resetLazy = async () => {
  displayedCount.value = pageSizeLiked
  await setupIntersection()
}

// 点赞的说说列表
const likedTalksList = ref<Api.Talk.TalkItem[]>([])

// 加载状态
const loadingLikedArticles = ref(false)
const loadingLikedTalks = ref(false)

// 修改密码表单
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordFormRef = ref()

// 密码强度状态
const passwordStrength = ref<'weak' | 'medium' | 'strong'>('weak')
const passwordStrengthText = ref('弱')
const passwordStrengthColor = ref('#f56c6c')

// 密码强度校验函数
const checkPasswordStrength = (password: string) => {
  if (!password) {
    passwordStrength.value = 'weak'
    passwordStrengthText.value = '弱'
    passwordStrengthColor.value = '#f56c6c'
    return
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  const typeCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length

  if (password.length >= 8 && typeCount >= 3) {
    passwordStrength.value = 'strong'
    passwordStrengthText.value = '强'
    passwordStrengthColor.value = '#67c23a'
  } else if (password.length >= 6 && typeCount >= 2) {
    passwordStrength.value = 'medium'
    passwordStrengthText.value = '中'
    passwordStrengthColor.value = '#e6a23c'
  } else {
    passwordStrength.value = 'weak'
    passwordStrengthText.value = '弱'
    passwordStrengthColor.value = '#f56c6c'
  }
}

// 密码表单验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 1, message: '当前密码不能为空', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { max: 20, message: '密码长度不能超过20位', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback()
          return
        }

        // 检查密码强度
        checkPasswordStrength(value)

        // 必须包含字母和数字
        const hasLetter = /[a-zA-Z]/.test(value)
        const hasNumber = /\d/.test(value)

        if (!hasLetter || !hasNumber) {
          callback(new Error('密码必须包含字母和数字'))
          return
        }

        // 不能与当前密码相同
        if (value === passwordForm.value.currentPassword) {
          callback(new Error('新密码不能与当前密码相同'))
          return
        }

        // 不能包含常见弱密码
        const weakPasswords = [
          '123456',
          'password',
          'qwerty',
          '111111',
          '123123',
        ]
        if (weakPasswords.some((weak) => value.toLowerCase().includes(weak))) {
          callback(new Error('密码过于简单，请使用更复杂的密码'))
          return
        }

        callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 跳转到文章详情
const goToArticle = (article: any) => {
  const id = article?._id
  if (!id) return

  // 乐观更新本地浏览量，提升体验
  try {
    const current = typeof article.views === 'number' ? article.views : 0
    article.views = current + 1
  } catch (e) {
    // ignore
  }

  // 浏览量由文章详情接口在服务端自增，这里不再重复上报，避免 404

  // 跳转到详情页（使用命名路由与 params，避免路径注入）
  router.push({ name: 'ArticleDetail', params: { id: String(id) } })
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化内容
const formatContent = (content: string) => {
  // 简单的文本格式化，实际可以使用markdown解析
  return content.replace(/\n/g, '<br>')
}

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout()
      router.push('/')
      ElMessage.success('已退出登录')
    })
    .catch(() => {
      // 用户取消退出
    })
}

// 处理修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()

    // 检查密码强度，如果是弱密码给出警告
    if (passwordStrength.value === 'weak') {
      const confirmResult = await ElMessageBox.confirm(
        '您的新密码强度较弱，建议使用包含大小写字母、数字和特殊字符的强密码。是否继续？',
        '密码强度提醒',
        {
          confirmButtonText: '继续修改',
          cancelButtonText: '重新设置',
          type: 'warning',
        },
      ).catch(() => false)

      if (!confirmResult) {
        return
      }
    }

    changingPassword.value = true

    // 调用修改密码的API
    const passwordData: ChangePasswordParams = {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    }

    await changePassword(passwordData)

    ElMessage.success('密码修改成功，请使用新密码重新登录')
    showPasswordDialog.value = false
    resetPasswordForm()

    // 修改密码成功后，退出登录让用户重新登录
    setTimeout(() => {
      userStore.logout()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    console.error('修改密码失败:', error)

    // 更详细的错误处理
    let errorMessage = '修改密码失败，请稍后重试'

    if (error?.response?.status === 400) {
      errorMessage = '当前密码错误，请检查后重试'
    } else if (error?.response?.status === 401) {
      errorMessage = '登录已过期，请重新登录'
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 1500)
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    changingPassword.value = false
  }
}

// 关闭密码对话框
const handleClosePasswordDialog = () => {
  resetPasswordForm()
  showPasswordDialog.value = false
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordStrength.value = 'weak'
  passwordStrengthText.value = '弱'
  passwordStrengthColor.value = '#f56c6c'
  passwordFormRef.value?.clearValidate()
}

// 监听新密码输入，实时更新密码强度
watch(
  () => passwordForm.value.newPassword,
  (newPassword) => {
    checkPasswordStrength(newPassword)
  },
)

// 获取用户已点赞的文章列表（严格以前端点赞状态为准，和 Home.vue 一致）
const loadLikedArticles = async () => {
  if (!userStore.isLoggedIn) return

  loadingLikedArticles.value = true
  try {
    // 确保文章数据与点赞状态已就绪
    if (articlesStore.articles.length === 0) {
      await articlesStore.fetchArticles()
    } else if (!articlesStore.likeStatusInitialized) {
      await articlesStore.initializeLikeStatus()
    }

    // 以 store 的点赞状态为唯一来源，避免与服务端状态不一致
    const likedArticleIds = articlesStore.likedArticleIds

    if (!likedArticleIds.length) {
      likedArticlesList.value = []
      return
    }

    // 从已加载的文章中过滤
    const allArticles = articlesStore.articles
    likedArticlesList.value = allArticles.filter((a) =>
      likedArticleIds.includes(a._id),
    )
  } catch (error) {
    ElMessage.error('获取已点赞文章失败')
  } finally {
    loadingLikedArticles.value = false
    // 重新设置懒加载（仅在文章Tab下）
    if (activeTab.value === 'articles') {
      await resetLazy()
    }
  }
}

// 获取用户已点赞的说说列表
const loadLikedTalks = async () => {
  if (!userStore.isLoggedIn) return

  loadingLikedTalks.value = true
  try {
    // 确保点赞状态已初始化
    if (!talksStore.likeStatusInitialized) {
      await talksStore.initializeLikeStatus()
    }

    // 从store中获取已点赞的说说ID
    const likedTalkIds = Array.from(talksStore.likedTalks)

    if (likedTalkIds.length === 0) {
      likedTalksList.value = []
      return
    }

    // 尝试从Talk页面获取说说数据（如果可用）
    try {
      const { getTalkList } = await import('@/api/talks')
      const response = await getTalkList({
        current: 1,
        size: 100, // 获取足够多的说说来匹配点赞的ID
        status: 'public',
      })

      if (response && response.records) {
        // 筛选出已点赞的说说
        const likedTalks = response.records.filter((talk) =>
          likedTalkIds.includes(talk._id),
        )
        likedTalksList.value = likedTalks
      } else {
        likedTalksList.value = []
      }
    } catch (error) {
      console.warn('无法获取说说列表，使用空列表:', error)
      likedTalksList.value = []
    }
  } catch (error) {
    console.error('获取已点赞说说失败:', error)
    // 不显示错误消息，因为这不是关键功能
    likedTalksList.value = []
  } finally {
    loadingLikedTalks.value = false
  }
}

// 初始化数据
const initData = async () => {
  if (!userStore.isLoggedIn) return

  try {
    // 确保点赞状态已初始化
    if (articlesStore.likedArticles.size === 0) {
      await articlesStore.initializeLikeStatus()
    }

    // 确保文章数据已加载
    if (articlesStore.articles.length === 0) {
      // console.log('文章数据为空，开始加载文章数据...')
      await articlesStore.fetchArticles()
    }

    // 加载已点赞的说说列表（内部会处理点赞状态初始化）
    await loadLikedTalks()

    // 加载已点赞的文章列表
    await loadLikedArticles()
  } catch (error) {
    console.error('初始化用户数据失败:', error)
  }
}

onMounted(async () => {
  await initData()
  await nextTick()
  if (activeTab.value === 'articles') {
    await resetLazy()
  }
})

// 监听用户登录状态变化
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      // 用户登录后重新初始化数据
      await initData()
    } else {
      // 用户登出后清空数据
      likedArticlesList.value = []
      likedTalksList.value = []
    }
  },
)

// 监听点赞状态变化，实时更新列表（使用派生数组以确保响应式触发）
watch(
  () => articlesStore.likedArticleIds,
  () => {
    if (userStore.isLoggedIn && activeTab.value === 'articles') {
      loadLikedArticles()
    }
  },
  { deep: false },
)

watch(
  () => talksStore.likedTalkIds,
  (newLikedTalkIds: string[]) => {
    if (userStore.isLoggedIn && activeTab.value === 'talks') {
      const likedSet = new Set(newLikedTalkIds)
      likedTalksList.value = likedTalksList.value.filter((talk) =>
        likedSet.has(talk._id),
      )
    }
  },
  { deep: false },
)

// 监听tab切换，确保数据及时更新
watch(activeTab, (newTab) => {
  if (!userStore.isLoggedIn) return

  if (newTab === 'articles') {
    loadLikedArticles()
  } else if (newTab === 'talks') {
    loadLikedTalks()
  }
})

onBeforeUnmount(() => {
  if (io) {
    io.disconnect()
    io = null
  }
})
</script>

<style scoped>
.user-center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 200px);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 用户信息卡片 */
.user-info-card {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.user-email {
  color: var(--text-color-secondary);
  margin: 0 0 1rem 0;
}

.user-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

/* 功能区域 */
.function-area {
  display: grid;
  gap: 2rem;
}

.function-card {
  background: var(--bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--primary-color-light)
  );
}

.card-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-content {
  padding: 1.5rem;
}

/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.article-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.article-cover {
  height: 150px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-info {
  padding: 1rem;
}

.article-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

/* 说说列表 */
.talks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.talk-item {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color-secondary);
}

.talk-content {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.talk-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 2rem;
}

/* 密码强度指示器样式 */
.password-strength-indicator {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  width: 33%;
}

.strength-fill.medium {
  width: 66%;
}

.strength-fill.strong {
  width: 100%;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* 密码要求提示样式 */
.password-tips {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.tip-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.tip-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tip-list li {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
  position: relative;
  padding-left: 16px;
}

.tip-list li:before {
  content: '○';
  position: absolute;
  left: 0;
  color: #dc3545;
  transition: all 0.3s ease;
}

.tip-list li.valid {
  color: #28a745;
}

.tip-list li.valid:before {
  content: '●';
  color: #28a745;
}

.tip-list li:last-child {
  margin-bottom: 0;
}

/* 懒加载样式 */
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0;
  color: var(--text-color-secondary);
}

.load-more.done {
  color: var(--text-color-secondary);
}

.load-more-sentinel {
  height: 1px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-center-container {
    padding: 1rem;
  }

  .user-info-card {
    flex-direction: column;
    text-align: center;
  }

  .user-stats {
    justify-content: center;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
