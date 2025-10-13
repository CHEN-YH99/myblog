<template>
  <div class="personal-center">
    <!-- 个人信息卡片 -->
    <div class="profile-section">
      <el-card class="profile-card" shadow="hover">
        <div class="profile-header">
          <div class="avatar-section">
            <AvatarUpload
              v-model="userProfile.avatar"
              :size="100"
              @change="handleAvatarChange"
            />
            <div class="user-info">
              <h2 class="username">{{ userProfile.username }}</h2>
              <p class="user-role">{{ userProfile.role }}</p>
              <p class="join-date">加入时间：{{ formatDate(userProfile.createTime) }}</p>
            </div>
          </div>
          <div class="profile-actions">
            <el-button type="primary" @click="showEditProfile">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
            <el-button @click="showChangePassword">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-button>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-number">{{ userStats.articleCount }}</div>
            <div class="stat-label">发布文章</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.commentCount }}</div>
            <div class="stat-label">评论数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.viewCount }}</div>
            <div class="stat-label">浏览量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.likeCount }}</div>
            <div class="stat-label">获赞数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 功能区域 -->
    <div class="content-section">
      <div class="left-content">
        <!-- 个人详细信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><User /></el-icon>个人信息</span>
            </div>
          </template>
          <div class="info-list">
            <div class="info-item">
              <label>用户名：</label>
              <span>{{ userProfile.username }}</span>
            </div>
            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ userProfile.email }}</span>
            </div>
            <div class="info-item">
              <label>手机号：</label>
              <span>{{ userProfile.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>性别：</label>
              <span>{{ userProfile.gender || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>生日：</label>
              <span>{{ userProfile.birthday || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>个人简介：</label>
              <span>{{ userProfile.bio || '这个人很懒，什么都没有留下' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 安全设置 -->
        <el-card class="security-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Lock /></el-icon>安全设置</span>
            </div>
          </template>
          <div class="security-list">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">登录密码</div>
                <div class="security-desc">定期更换密码，保护账户安全</div>
              </div>
              <el-button type="primary" link @click="showChangePassword">修改</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">手机号码</div>
                <div class="security-desc">{{ userProfile.phone || '未绑定手机号' }}</div>
              </div>
              <el-button type="primary" link @click="showBindPhone">{{ userProfile.phone ? '修改' : '绑定' }}</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">邮箱地址</div>
                <div class="security-desc">{{ userProfile.email }}</div>
              </div>
              <el-button type="primary" link @click="showChangeEmail">修改</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-content">
        <!-- 更新日志 -->
        <el-card class="changelog-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Document /></el-icon>更新日志</span>
            </div>
          </template>
          <div class="changelog-list">
            <div v-for="item in upgradeLogList.slice(0, 5)" :key="item.version" class="changelog-item">
              <div class="changelog-header">
                <div class="version-tag">{{ item.version }}</div>
                <div class="changelog-date">{{ item.date }}</div>
              </div>
              <div class="changelog-title">{{ item.title }}</div>
              <div v-if="item.detail && item.detail.length > 0" class="changelog-details">
                <div v-for="(detail, index) in item.detail.slice(0, 2)" :key="index" class="detail-item">
                  • {{ detail }}
                </div>
                <div v-if="item.detail.length > 2" class="more-details">
                  还有 {{ item.detail.length - 2 }} 项更新...
                </div>
              </div>
            </div>
          </div>
          <div class="changelog-footer">
            <el-button type="primary" link @click="showFullChangelog">查看完整更新日志</el-button>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card class="quick-actions-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Operation /></el-icon>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="goToUserManagement">
              <el-icon><UserFilled /></el-icon>
              <span>用户管理</span>
            </div>
            <div class="action-item" @click="goToArticleManagement">
              <el-icon><Document /></el-icon>
              <span>文章管理</span>
            </div>
            <div class="action-item" @click="goToSystemSettings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </div>
            <div class="action-item" @click="clearCache">
              <el-icon><Delete /></el-icon>
              <span>清理缓存</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog
      v-model="editProfileVisible"
      title="编辑个人资料"
      width="600px"
      :before-close="closeEditProfile"
    >
      <el-form
        ref="profileFormRef"
        :model="editProfileForm"
        :rules="profileRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editProfileForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editProfileForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editProfileForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editProfileForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
            <el-radio value="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日" prop="birthday">
          <el-date-picker
            v-model="editProfileForm.birthday"
            type="date"
            placeholder="请选择生日"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="editProfileForm.bio"
            type="textarea"
            :rows="4"
            placeholder="请输入个人简介"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditProfile">取消</el-button>
        <el-button type="primary" :loading="profileLoading" @click="saveProfile">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="changePasswordVisible"
      title="修改密码"
      width="500px"
      :before-close="closeChangePassword"
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
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeChangePassword">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="changePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 完整更新日志弹窗 -->
    <el-dialog
      v-model="changelogVisible"
      title="更新日志"
      width="800px"
      :before-close="closeChangelog"
    >
      <div class="full-changelog">
        <div v-for="item in upgradeLogList" :key="item.version" class="changelog-item-full">
          <div class="changelog-header-full">
            <div class="version-tag-full">{{ item.version }}</div>
            <div class="changelog-date-full">{{ item.date }}</div>
          </div>
          <div class="changelog-title-full">{{ item.title }}</div>
          <div v-if="item.detail && item.detail.length > 0" class="changelog-details-full">
            <div v-for="(detail, index) in item.detail" :key="index" class="detail-item-full">
              {{ index + 1 }}. {{ detail }}
            </div>
          </div>
          <div v-if="item.remark" class="changelog-remark">
            <strong>备注：</strong>{{ item.remark }}
          </div>
          <div v-if="item.requireReLogin" class="require-relogin">
            <el-tag type="warning" size="small">需要重新登录</el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Edit,
  Lock,
  User,
  Document,
  Operation,
  UserFilled,
  Setting,
  Delete
} from '@element-plus/icons-vue'
import AvatarUpload from '@/components/AvatarUpload.vue'

// 升级日志数据 - 实际项目中应从API获取
const upgradeLogList = ref([])

defineOptions({ name: 'PersonalCenter' })

const router = useRouter()

// 用户资料
const userProfile = ref({
  id: 1,
  username: '管理员',
  email: 'admin@example.com',
  phone: '138****8888',
  gender: 'male',
  birthday: '1990-01-01',
  bio: '这是一个简洁大方的个人博客管理系统',
  avatar: '/src/assets/images/avatar.jpg',
  role: '超级管理员',
  createTime: '2024-01-01'
})

// 用户统计数据
const userStats = ref({
  articleCount: 25,
  commentCount: 156,
  viewCount: 12580,
  likeCount: 892
})

// 弹窗状态
const editProfileVisible = ref(false)
const changePasswordVisible = ref(false)
const changelogVisible = ref(false)

// 加载状态
const profileLoading = ref(false)
const passwordLoading = ref(false)

// 表单引用
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 编辑资料表单
const editProfileForm = reactive({
  username: '',
  email: '',
  phone: '',
  gender: '',
  birthday: '',
  bio: ''
})

// 修改密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const profileRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 处理头像更换
const handleAvatarChange = (newAvatarUrl: string) => {
  userProfile.value.avatar = newAvatarUrl
  ElMessage.success('头像更新成功')
}

// 显示编辑资料弹窗
const showEditProfile = () => {
  Object.assign(editProfileForm, {
    username: userProfile.value.username,
    email: userProfile.value.email,
    phone: userProfile.value.phone,
    gender: userProfile.value.gender,
    birthday: userProfile.value.birthday,
    bio: userProfile.value.bio
  })
  editProfileVisible.value = true
}

// 关闭编辑资料弹窗
const closeEditProfile = () => {
  editProfileVisible.value = false
  profileFormRef.value?.resetFields()
}

// 保存个人资料
const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    profileLoading.value = true
    
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新用户资料
    Object.assign(userProfile.value, editProfileForm)
    
    ElMessage.success('个人资料更新成功')
    closeEditProfile()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    profileLoading.value = false
  }
}

// 显示修改密码弹窗
const showChangePassword = () => {
  changePasswordVisible.value = true
}

// 关闭修改密码弹窗
const closeChangePassword = () => {
  changePasswordVisible.value = false
  passwordFormRef.value?.resetFields()
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('密码修改成功')
    closeChangePassword()
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败，请重试')
  } finally {
    passwordLoading.value = false
  }
}

// 显示绑定手机号
const showBindPhone = () => {
  ElMessage.info('手机号绑定功能开发中...')
}

// 显示修改邮箱
const showChangeEmail = () => {
  ElMessage.info('邮箱修改功能开发中...')
}

// 显示完整更新日志
const showFullChangelog = () => {
  changelogVisible.value = true
}

// 关闭更新日志弹窗
const closeChangelog = () => {
  changelogVisible.value = false
}

// 快捷操作
const goToUserManagement = () => {
  router.push('/system/user')
}

const goToArticleManagement = () => {
  ElMessage.info('文章管理功能开发中...')
}

const goToSystemSettings = () => {
  ElMessage.info('系统设置功能开发中...')
}

const clearCache = () => {
  ElMessageBox.confirm('确定要清理系统缓存吗？', '清理缓存', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清理缓存逻辑
    localStorage.clear()
    sessionStorage.clear()
    ElMessage.success('缓存清理成功')
  })
}

// 组件挂载时初始化数据
onMounted(() => {
  // 这里可以调用API获取用户数据
})
</script>

<style lang="scss" scoped>
.personal-center {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.profile-section {
  margin-bottom: 20px;
}

.profile-card {
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    
    .avatar-section {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .user-info {
        .username {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
        }
        
        .user-role {
          font-size: 14px;
          color: #409eff;
          margin: 0 0 5px 0;
        }
        
        .join-date {
          font-size: 12px;
          color: #909399;
          margin: 0;
        }
      }
    }
    
    .profile-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .profile-stats {
    display: flex;
    justify-content: space-around;
    padding: 20px 0;
    border-top: 1px solid #ebeef5;
    
    .stat-item {
      text-align: center;
      
      .stat-number {
        font-size: 24px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.left-content,
.right-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
  
  .el-icon {
    margin-right: 8px;
    color: #409eff;
  }
}

.info-card {
  .info-list {
    .info-item {
      display: flex;
      margin-bottom: 15px;
      
      label {
        width: 80px;
        color: #606266;
        font-weight: 500;
      }
      
      span {
        flex: 1;
        color: #303133;
      }
    }
  }
}

.security-card {
  .security-list {
    .security-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .security-info {
        .security-title {
          font-weight: 500;
          color: #303133;
          margin-bottom: 5px;
        }
        
        .security-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.changelog-card {
  .changelog-list {
    max-height: 400px;
    overflow-y: auto;
    
    .changelog-item {
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .changelog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .version-tag {
          background: linear-gradient(135deg, #409eff, #67c23a);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .changelog-date {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .changelog-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }
      
      .changelog-details {
        .detail-item {
          font-size: 12px;
          color: #606266;
          margin-bottom: 3px;
        }
        
        .more-details {
          font-size: 12px;
          color: #909399;
          font-style: italic;
        }
      }
    }
  }
  
  .changelog-footer {
    text-align: center;
    padding-top: 15px;
    border-top: 1px solid #f0f0f0;
  }
}

.quick-actions-card {
  .quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    
    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #e3f2fd;
        transform: translateY(-2px);
      }
      
      .el-icon {
        font-size: 24px;
        color: #409eff;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

.full-changelog {
  max-height: 600px;
  overflow-y: auto;
  
  .changelog-item-full {
    padding: 20px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .changelog-header-full {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .version-tag-full {
        background: linear-gradient(135deg, #409eff, #67c23a);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .changelog-date-full {
        font-size: 14px;
        color: #909399;
      }
    }
    
    .changelog-title-full {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 10px;
    }
    
    .changelog-details-full {
      margin-bottom: 10px;
      
      .detail-item-full {
        font-size: 14px;
        color: #606266;
        margin-bottom: 5px;
        line-height: 1.5;
      }
    }
    
    .changelog-remark {
      font-size: 14px;
      color: #e6a23c;
      margin-bottom: 10px;
    }
    
    .require-relogin {
      margin-top: 10px;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .content-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .personal-center {
    padding: 10px;
  }
  
  .profile-header {
    flex-direction: column;
    gap: 20px;
    
    .avatar-section {
      flex-direction: column;
      text-align: center;
    }
    
    .profile-actions {
      width: 100%;
      justify-content: center;
    }
  }
  
  .profile-stats {
    .stat-item {
      .stat-number {
        font-size: 20px;
      }
      
      .stat-label {
        font-size: 12px;
      }
    }
  }
  
  .quick-actions {
    grid-template-columns: 1fr !important;
  }
}
</style>
