<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="login-content">
      <!-- 左侧信息区域 -->
      <div class="info-section">
        <div class="brand-info">
          <h1 class="brand-title">欢迎来到我的博客</h1>
          <p class="brand-subtitle">分享技术，记录生活，探索未知</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon><Document /></el-icon>
              <span>精彩文章分享</span>
            </div>
            <div class="feature-item">
              <el-icon><Picture /></el-icon>
              <span>美好时光记录</span>
            </div>
            <div class="feature-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>互动交流平台</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="form-section">
        <div class="form-container">
          <!-- 标题切换 -->
          <div class="form-header">
            <h2 class="form-title">{{ isLogin ? '用户登录' : '用户注册' }}</h2>
            <p class="form-subtitle">{{ isLogin ? '欢迎回来，请登录您的账户' : '创建新账户，开始您的博客之旅' }}</p>
          </div>

          <!-- 登录表单 -->
          <el-form
            v-if="isLogin"
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="auth-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名/邮箱"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="captcha">
              <div class="captcha-container">
                <el-input
                  v-model="loginForm.captcha"
                  placeholder="请输入验证码"
                  size="large"
                  :prefix-icon="Lock"
                  clearable
                />
                <div class="captcha-image" @click="refreshCaptcha">
                  <canvas ref="captchaCanvas" width="120" height="40"></canvas>
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="loginForm.rememberMe">
                  七天免登录
                </el-checkbox>
                <el-link type="primary" @click="showForgotPassword">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :loading="loginLoading"
                @click="handleLogin"
              >
                {{ loginLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 注册表单 -->
          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="auth-form"
            @submit.prevent="handleRegister"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名（3-20个字符）"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                size="large"
                :prefix-icon="Message"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码（6-20个字符）"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="captcha">
              <div class="captcha-container">
                <el-input
                  v-model="registerForm.captcha"
                  placeholder="请输入验证码"
                  size="large"
                  :prefix-icon="Lock"
                  clearable
                />
                <div class="captcha-image" @click="refreshCaptcha">
                  <canvas ref="captchaCanvas" width="120" height="40"></canvas>
                </div>
              </div>
            </el-form-item>

            <el-form-item prop="agreement">
              <el-checkbox v-model="registerForm.agreement">
                我已阅读并同意
                <el-link type="primary" @click="showTerms">《用户协议》</el-link>
                和
                <el-link type="primary" @click="showPrivacy">《隐私政策》</el-link>
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :loading="registerLoading"
                @click="handleRegister"
              >
                {{ registerLoading ? '注册中...' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 切换登录/注册 -->
          <div class="form-footer">
            <span class="switch-text">
              {{ isLogin ? '还没有账户？' : '已有账户？' }}
            </span>
            <el-link type="primary" @click="toggleMode">
              {{ isLogin ? '立即注册' : '立即登录' }}
            </el-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <el-dialog
      v-model="forgotPasswordVisible"
      title="找回密码"
      width="400px"
      :before-close="closeForgotPassword"
    >
      <el-form ref="forgotFormRef" :model="forgotForm" :rules="forgotRules">
        <el-form-item prop="email">
          <el-input
            v-model="forgotForm.email"
            placeholder="请输入注册邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeForgotPassword">取消</el-button>
        <el-button type="primary" :loading="forgotLoading" @click="handleForgotPassword">
          发送重置邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  User,
  Lock,
  Message,
  Document,
  Picture,
  ChatDotRound
} from '@element-plus/icons-vue'
import { loginApi, registerApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { useArticlesStore } from '@/stores/getarticles'
import { useTalksStore } from '@/stores/talks'

const router = useRouter()
const userStore = useUserStore()

// 表单模式切换
const isLogin = ref(true)

// 表单引用
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const forgotFormRef = ref<FormInstance>()

// 验证码相关
const captchaCanvas = ref<HTMLCanvasElement>()
const currentCaptcha = ref('')

// 加载状态
const loginLoading = ref(false)
const registerLoading = ref(false)
const forgotLoading = ref(false)

// 忘记密码弹窗
const forgotPasswordVisible = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  rememberMe: false
})

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  agreement: false
})

// 忘记密码表单
const forgotForm = reactive({
  email: ''
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为4位', trigger: 'blur' }
  ]
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为4位', trigger: 'blur' }
  ],
  agreement: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请阅读并同意用户协议和隐私政策'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const forgotRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 生成验证码
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  let captcha = ''
  for (let i = 0; i < 4; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  currentCaptcha.value = captcha
  return captcha
}

// 绘制验证码
const drawCaptcha = () => {
  if (!captchaCanvas.value) return
  
  const canvas = captchaCanvas.value
  const ctx = canvas.getContext('2d')!
  const captcha = generateCaptcha()
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 设置背景
  ctx.fillStyle = '#f0f2f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制干扰线
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.stroke()
  }
  
  // 绘制验证码文字
  ctx.font = '20px Arial'
  ctx.textBaseline = 'middle'
  
  for (let i = 0; i < captcha.length; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`
    ctx.save()
    ctx.translate(20 + i * 20, canvas.height / 2)
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.fillText(captcha[i], 0, 0)
    ctx.restore()
  }
  
  // 绘制干扰点
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%)`
    ctx.beginPath()
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  drawCaptcha()
}

// 验证验证码
const validateCaptcha = (inputCaptcha: string) => {
  return inputCaptcha.toLowerCase() === currentCaptcha.value.toLowerCase()
}

// 切换登录/注册模式
const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 清空表单
  if (isLogin.value) {
    Object.assign(loginForm, {
      username: '',
      password: '',
      captcha: '',
      rememberMe: false
    })
  } else {
    Object.assign(registerForm, {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      captcha: '',
      agreement: false
    })
  }
  refreshCaptcha()
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    // 验证验证码
    if (!validateCaptcha(loginForm.captcha)) {
      ElMessage.error('验证码错误')
      refreshCaptcha()
      return
    }
    
    loginLoading.value = true
    
    const response = await loginApi({
      username: loginForm.username,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe
    })
    
    // 保存用户信息和token
    userStore.setToken(response.token)
    userStore.setUserInfo(response.userInfo)
    
    // 初始化用户相关数据
    const articlesStore = useArticlesStore()
    const talksStore = useTalksStore()
    
    // 并行初始化点赞状态
    await Promise.all([
      articlesStore.initializeLikeStatus(),
      talksStore.initializeLikeStatus()
    ])
    
    // 设置七天免登录
    if (loginForm.rememberMe) {
      const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天
      localStorage.setItem('tokenExpire', expireTime.toString())
    }
    
    ElMessage.success('登录成功')
    router.push('/')
    
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
    refreshCaptcha()
  } finally {
    loginLoading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    
    // 验证验证码
    if (!validateCaptcha(registerForm.captcha)) {
      ElMessage.error('验证码错误')
      refreshCaptcha()
      return
    }
    
    registerLoading.value = true
    
    // 调用注册API
    await registerApi({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword
    })
    
    // 注册成功后，同步用户数据到后台管理系统
    try {
      const { syncUserToAdmin } = await import('@/api/user')
      await syncUserToAdmin({
        username: registerForm.username,
        email: registerForm.email,
        role: '普通用户',
        status: 'active',
        createTime: new Date().toISOString(),
        registerSource: 'frontend'
      })
    } catch (syncError) {
      console.warn('用户数据同步失败，但注册成功:', syncError)
      // 同步失败不影响注册流程
    }
    
    ElMessage.success('注册成功，请登录')
    isLogin.value = true
    
    // 自动填充用户名到登录表单
    loginForm.username = registerForm.username
    
    // 清空注册表单
    Object.assign(registerForm, {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      captcha: '',
      agreement: false
    })
    
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败')
    refreshCaptcha()
  } finally {
    registerLoading.value = false
  }
}

// 显示忘记密码弹窗
const showForgotPassword = () => {
  forgotPasswordVisible.value = true
}

// 关闭忘记密码弹窗
const closeForgotPassword = () => {
  forgotPasswordVisible.value = false
  forgotForm.email = ''
}

// 处理忘记密码
const handleForgotPassword = async () => {
  if (!forgotFormRef.value) return
  
  try {
    await forgotFormRef.value.validate()
    forgotLoading.value = true
    
    // 这里应该调用忘记密码API
    // await forgotPasswordApi(forgotForm.email)
    
    ElMessage.success('重置密码邮件已发送，请查收')
    closeForgotPassword()
    
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    forgotLoading.value = false
  }
}

// 显示用户协议
const showTerms = () => {
  ElMessageBox.alert('这里是用户协议内容...', '用户协议', {
    confirmButtonText: '确定'
  })
}

// 显示隐私政策
const showPrivacy = () => {
  ElMessageBox.alert('这里是隐私政策内容...', '隐私政策', {
    confirmButtonText: '确定'
  })
}

// 组件挂载后初始化验证码
onMounted(() => {
  nextTick(() => {
    drawCaptcha()
  })
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  .bg-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
    
    &.bg-circle-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }
    
    &.bg-circle-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 15%;
      animation-delay: 2s;
    }
    
    &.bg-circle-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 20%;
      animation-delay: 4s;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-content {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.info-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
  
  .brand-info {
    max-width: 500px;
    
    .brand-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #fff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .brand-subtitle {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      line-height: 1.6;
    }
    
    .feature-list {
      .feature-item {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        
        .el-icon {
          margin-right: 0.8rem;
          font-size: 1.5rem;
          color: #a5b4fc;
        }
      }
    }
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.form-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  
  .form-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .form-subtitle {
    color: #6b7280;
    font-size: 0.9rem;
  }
}

.auth-form {
  .el-form-item {
    margin-bottom: 1.5rem;
  }
  
  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #667eea;
    }
    
    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.captcha-container {
  display: flex;
  gap: 0.5rem;
  
  .el-input {
    flex: 1;
  }
  
  .captcha-image {
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #667eea;
      transform: scale(1.02);
    }
    
    canvas {
      display: block;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .el-checkbox {
    :deep(.el-checkbox__label) {
      color: #6b7280;
      font-size: 0.9rem;
    }
  }
  
  .el-link {
    font-size: 0.9rem;
  }
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  
  .switch-text {
    color: #6b7280;
    font-size: 0.9rem;
    margin-right: 0.5rem;
  }
  
  .el-link {
    font-size: 0.9rem;
    font-weight: 500;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .login-content {
    flex-direction: column;
  }
  
  .info-section {
    flex: none;
    padding: 1rem;
    
    .brand-info {
      text-align: center;
      
      .brand-title {
        font-size: 2rem;
      }
      
      .brand-subtitle {
        font-size: 1rem;
      }
    }
  }
  
  .form-section {
    flex: none;
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .form-container {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .info-section {
    .brand-info {
      .brand-title {
        font-size: 1.8rem;
      }
      
      .feature-list {
        display: none;
      }
    }
  }
}

// Element Plus 样式覆盖
:deep(.el-dialog) {
  border-radius: 16px;
  
  .el-dialog__header {
    padding: 1.5rem 1.5rem 1rem;
    
    .el-dialog__title {
      font-weight: 600;
      color: #1f2937;
    }
  }
  
  .el-dialog__body {
    padding: 0 1.5rem 1rem;
  }
  
  .el-dialog__footer {
    padding: 1rem 1.5rem 1.5rem;
  }
}
</style>