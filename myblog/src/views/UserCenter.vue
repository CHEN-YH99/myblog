<template>
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/category.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">个人中心</h1>
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
          <el-avatar :size="120" :src="userInfo?.avatar || avatarUrl" />
        </div>
        <div class="user-details">
          <h2 class="username">{{ userInfo?.nickname || userInfo?.username || '用户' }}</h2>
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
            <h3><el-icon><Star /></el-icon> 我的点赞</h3>
          </div>
          <div class="card-content">
            <el-tabs v-model="activeTab" class="user-tabs">
              <el-tab-pane label="点赞文章" name="articles">
                <div v-if="likedArticlesList.length === 0" class="empty-state">
                  <el-empty description="暂无点赞的文章" :image-size="100" />
                </div>
                <div v-else class="articles-grid">
                  <div 
                    v-for="article in likedArticlesList" 
                    :key="article._id"
                    class="article-item"
                    @click="goToArticle(article)"
                  >
                    <div class="article-cover">
                      <img :src="article.image || '/default-article.svg'" :alt="article.title" />
                    </div>
                    <div class="article-info">
                      <h4 class="article-title">{{ article.title }}</h4>
                      <p class="article-summary">{{ article.excerpt }}</p>
                      <div class="article-meta">
                        <span class="article-date">{{ formatDate(article.publishDate) }}</span>
                        <span class="article-views">{{ article.views }} 阅读</span>
                      </div>
                    </div>
                  </div>
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
                    <div class="talk-content" v-html="formatContent(talk.content)"></div>
                    <div class="talk-meta">
                      <span class="talk-date">{{ formatDate(talk.publishDate) }}</span>
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
            <h3><el-icon><Setting /></el-icon> 账户设置</h3>
          </div>
          <div class="card-content">
            <div class="setting-item">
              <span class="setting-label">修改密码</span>
              <el-button type="primary" size="small" @click="showPasswordDialog = true">
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
        <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 页脚 -->
  <Footer />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useArticlesStore } from '@/stores/getarticles'
import { useTalksStore } from '@/stores/talks'
import { getUserLikedArticles } from '@/api/articles'
import { changePassword, type ChangePasswordParams } from '@/api/user'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import avatarUrl from '@/assets/images/hui.svg'

const router = useRouter()
const userStore = useUserStore()
const articlesStore = useArticlesStore()
const talksStore = useTalksStore()

// 响应式数据
const activeTab = ref('articles')
const showPasswordDialog = ref(false)
const changingPassword = ref(false)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 用户统计数据
const userStats = computed(() => ({
  articlesLiked: articlesStore.likedArticles.size,
  talksLiked: talksStore.likedTalks.size,
  repliesCount: 0 // 暂时设为0，后续可以从API获取
}))

// 点赞的文章列表
const likedArticlesList = ref<Api.Article.ArticleItem[]>([])

// 点赞的说说列表
const likedTalksList = ref<Api.Talk.TalkItem[]>([])

// 加载状态
const loadingLikedArticles = ref(false)
const loadingLikedTalks = ref(false)

// 修改密码表单
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()

// 密码表单验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
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
      trigger: 'blur'
    }
  ]
}

// 跳转到文章详情
const goToArticle = (article: any) => {
  router.push(`/article/${article._id}`)
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
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '退出确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    userStore.logout()
    router.push('/')
    ElMessage.success('已退出登录')
  }).catch(() => {
    // 用户取消退出
  })
}

// 处理修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    // 调用修改密码的API
    const passwordData: ChangePasswordParams = {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
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
    const errorMessage = error?.response?.data?.message || error?.message || '修改密码失败，请稍后重试'
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
    confirmPassword: ''
  }
  passwordFormRef.value?.clearValidate()
}

// 获取用户已点赞的文章列表
const loadLikedArticles = async () => {
  if (!userStore.isLoggedIn) return
  
  loadingLikedArticles.value = true
  try {
    // 优先从store中获取已点赞的文章ID
    const likedArticleIds = Array.from(articlesStore.likedArticles)
    
    if (likedArticleIds.length === 0) {
      likedArticlesList.value = []
      return
    }
    
    // 从所有文章中筛选出已点赞的文章
    const allArticles = articlesStore.articles
    const localLikedArticles = allArticles.filter(article => 
      likedArticleIds.includes(article._id)
    )
    
    // 如果本地文章数据完整（找到了所有已点赞的文章），直接使用
    if (localLikedArticles.length === likedArticleIds.length) {
      likedArticlesList.value = localLikedArticles
    } else {
      // 否则从API获取完整的已点赞文章列表
      try {
        const response = await getUserLikedArticles()
        likedArticlesList.value = response || []
        console.log('从API获取已点赞文章:', response?.length || 0, '篇')
      } catch (error) {
        console.warn('从API获取已点赞文章失败，使用本地数据:', error)
        likedArticlesList.value = localLikedArticles
      }
    }
  } catch (error) {
    console.error('获取已点赞文章失败:', error)
    ElMessage.error('获取已点赞文章失败')
  } finally {
    loadingLikedArticles.value = false
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
        status: 'public'
      })
      
      if (response && response.records) {
        // 筛选出已点赞的说说
        const likedTalks = response.records.filter(talk => 
          likedTalkIds.includes(talk._id)
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
      console.log('文章数据为空，开始加载文章数据...')
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

onMounted(() => {
  initData()
})

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    // 用户登录后重新初始化数据
    await initData()
  } else {
    // 用户登出后清空数据
    likedArticlesList.value = []
    likedTalksList.value = []
  }
})

// 监听点赞状态变化，实时更新列表
watch(
  () => articlesStore.likedArticles,
  () => {
    // 当点赞状态发生变化时，重新加载已点赞的文章列表
    if (userStore.isLoggedIn && activeTab.value === 'articles') {
      loadLikedArticles()
    }
  },
  { deep: true }
)

watch(
  () => talksStore.likedTalks,
  (newLikedTalks) => {
    // 当点赞状态发生变化时，过滤已有的说说列表而不是重新加载
    if (userStore.isLoggedIn && activeTab.value === 'talks') {
      // 过滤出仍然被点赞的说说
      likedTalksList.value = likedTalksList.value.filter(talk => 
        newLikedTalks.has(talk._id)
      )
    }
  },
  { deep: true }
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
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
}

.card-header h3 {
  margin: 0;
  color: white;
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