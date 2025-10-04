<template>
  <div class="user-sync-page art-full-height">
    <!-- 同步状态概览 -->
    <div class="sync-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ syncStatus.totalUsers }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon synced">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ syncStatus.syncedUsers }}</div>
                <div class="stat-label">已同步</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ syncStatus.pendingUsers }}</div>
                <div class="stat-label">待同步</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon failed">
                <el-icon><CircleCloseFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ syncStatus.failedUsers }}</div>
                <div class="stat-label">同步失败</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 操作区域 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-header">
        <div class="operation-info">
          <h3>用户数据同步管理</h3>
          <p>最后同步时间：{{ formatDate(syncStatus.lastSyncTime) }}</p>
        </div>
        <div class="operation-actions">
          <el-button type="primary" :loading="syncLoading" @click="triggerSync">
            <el-icon><Refresh /></el-icon>
            手动同步
          </el-button>
          <el-button @click="retryFailedSyncs" :disabled="syncStatus.failedUsers === 0">
            <el-icon><RefreshRight /></el-icon>
            重试失败
          </el-button>
          <el-button @click="viewSyncLogs">
            <el-icon><Document /></el-icon>
            查看日志
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 待同步用户列表 -->
    <el-card class="pending-users-card art-table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>待同步用户列表</span>
          <el-button type="primary" size="small" @click="refreshPendingUsers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <ArtTable
        :loading="pendingLoading"
        :data="pendingUsers"
        :pagination="false"
      >
        <el-table-column label="用户名" prop="username" width="150" />
        <el-table-column label="邮箱" prop="email" width="200" />
        <el-table-column label="角色" prop="role" width="100" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="createTime" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="syncSingleUser(row)">
              同步
            </el-button>
            <el-button type="danger" size="small" @click="removePendingUser(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </ArtTable>
    </el-card>

    <!-- 同步日志弹窗 -->
    <el-dialog
      v-model="logDialogVisible"
      title="同步日志"
      width="800px"
      :before-close="closeLogDialog"
    >
      <div class="sync-logs">
        <div class="log-header">
          <el-button type="danger" size="small" @click="clearLogs">
            清空日志
          </el-button>
        </div>
        <div class="log-list">
          <div v-if="syncLogs.length === 0" class="empty-logs">
            暂无同步日志
          </div>
          <div v-else>
            <div v-for="(log, index) in syncLogs" :key="index" class="log-item">
              <div class="log-header-item">
                <div class="log-time">{{ formatDate(log.timestamp) }}</div>
                <el-tag :type="log.error ? 'danger' : 'success'">
                  {{ log.error ? '失败' : '成功' }}
                </el-tag>
              </div>
              <div class="log-content">
                <div class="log-user">用户：{{ log.userData.username }} ({{ log.userData.email }})</div>
                <div v-if="log.error" class="log-error">错误：{{ log.error }}</div>
                <div v-if="log.retryTime" class="log-retry">重试时间：{{ formatDate(log.retryTime) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  SuccessFilled,
  Clock,
  CircleCloseFilled,
  Refresh,
  RefreshRight,
  Document
} from '@element-plus/icons-vue'
import ArtTable from '@/components/core/tables/art-table/index.vue'
import {
  getUserSyncStatus,
  getPendingSyncUsers,
  triggerUserSync,
  syncUserToManagement,
  type UserSyncData
} from '@/api/user-sync'
import { getUserSyncManager } from '@/utils/userSync'

defineOptions({ name: 'UserSync' })

// 同步状态
const syncStatus = ref({
  totalUsers: 0,
  syncedUsers: 0,
  pendingUsers: 0,
  failedUsers: 0,
  lastSyncTime: ''
})

// 待同步用户列表
const pendingUsers = ref<UserSyncData[]>([])

// 加载状态
const syncLoading = ref(false)
const pendingLoading = ref(false)

// 同步日志
const syncLogs = ref<any[]>([])
const logDialogVisible = ref(false)

// 获取同步状态
const getSyncStatus = async () => {
  try {
    const status = await getUserSyncStatus()
    syncStatus.value = status
  } catch (error) {
    console.error('获取同步状态失败:', error)
    ElMessage.error('获取同步状态失败')
  }
}

// 获取待同步用户列表
const getPendingUsersList = async () => {
  try {
    pendingLoading.value = true
    const users = await getPendingSyncUsers()
    pendingUsers.value = users
  } catch (error) {
    console.error('获取待同步用户列表失败:', error)
    ElMessage.error('获取待同步用户列表失败')
  } finally {
    pendingLoading.value = false
  }
}

// 手动触发同步
const triggerSync = async () => {
  try {
    syncLoading.value = true
    const result = await triggerUserSync()
    ElMessage.success(`同步完成，共同步 ${result.syncedCount} 个用户`)
    
    // 刷新状态和列表
    await getSyncStatus()
    await getPendingUsersList()
  } catch (error) {
    console.error('手动同步失败:', error)
    ElMessage.error('手动同步失败')
  } finally {
    syncLoading.value = false
  }
}

// 重试失败的同步
const retryFailedSyncs = async () => {
  try {
    const syncManager = getUserSyncManager()
    await syncManager.retryFailedSyncs()
    
    // 刷新状态
    await getSyncStatus()
  } catch (error) {
    console.error('重试同步失败:', error)
    ElMessage.error('重试同步失败')
  }
}

// 同步单个用户
const syncSingleUser = async (user: UserSyncData) => {
  try {
    await syncUserToManagement(user)
    ElMessage.success(`用户 ${user.username} 同步成功`)
    
    // 从待同步列表中移除
    const index = pendingUsers.value.findIndex(u => u.email === user.email)
    if (index !== -1) {
      pendingUsers.value.splice(index, 1)
    }
    
    // 刷新状态
    await getSyncStatus()
  } catch (error) {
    console.error('同步用户失败:', error)
    ElMessage.error(`用户 ${user.username} 同步失败`)
  }
}

// 移除待同步用户
const removePendingUser = (user: UserSyncData) => {
  ElMessageBox.confirm(
    `确定要从待同步列表中移除用户 "${user.username}" 吗？`,
    '移除用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = pendingUsers.value.findIndex(u => u.email === user.email)
    if (index !== -1) {
      pendingUsers.value.splice(index, 1)
      ElMessage.success('用户已从待同步列表中移除')
    }
  })
}

// 刷新待同步用户列表
const refreshPendingUsers = () => {
  getPendingUsersList()
}

// 查看同步日志
const viewSyncLogs = () => {
  const syncManager = getUserSyncManager()
  syncLogs.value = syncManager.getSyncErrors()
  logDialogVisible.value = true
}

// 关闭日志弹窗
const closeLogDialog = () => {
  logDialogVisible.value = false
}

// 清空日志
const clearLogs = () => {
  ElMessageBox.confirm('确定要清空所有同步日志吗？', '清空日志', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const syncManager = getUserSyncManager()
    syncManager.clearSyncErrors()
    syncLogs.value = []
    ElMessage.success('同步日志已清空')
  })
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    banned: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '非活跃',
    banned: '已封禁'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '暂无'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载时初始化数据
onMounted(() => {
  getSyncStatus()
  getPendingUsersList()
})
</script>

<style lang="scss" scoped>
.user-sync-page {
  padding: 20px;
  
  .sync-overview {
    margin-bottom: 20px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 15px;
        
        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          
          &.total {
            background: linear-gradient(135deg, #409eff, #67c23a);
          }
          
          &.synced {
            background: linear-gradient(135deg, #67c23a, #85ce61);
          }
          
          &.pending {
            background: linear-gradient(135deg, #e6a23c, #f7ba2a);
          }
          
          &.failed {
            background: linear-gradient(135deg, #f56c6c, #f78989);
          }
        }
        
        .stat-info {
          .stat-number {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }
  
  .operation-card {
    margin-bottom: 20px;
    
    .operation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .operation-info {
        h3 {
          margin: 0 0 5px 0;
          color: #303133;
        }
        
        p {
          margin: 0;
          font-size: 14px;
          color: #606266;
        }
      }
      
      .operation-actions {
        display: flex;
        gap: 10px;
      }
    }
  }
  
  .pending-users-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: #303133;
    }
  }
}

.sync-logs {
  .log-header {
    margin-bottom: 15px;
    text-align: right;
  }
  
  .log-list {
    max-height: 500px;
    overflow-y: auto;
    
    .empty-logs {
      text-align: center;
      color: #909399;
      padding: 40px 0;
    }
    
    .log-item {
      padding: 15px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      margin-bottom: 10px;
      
      .log-header-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        
        .log-time {
          font-size: 14px;
          color: #606266;
        }
      }
      
      .log-content {
        .log-user {
          font-weight: 500;
          color: #303133;
          margin-bottom: 5px;
        }
        
        .log-error {
          color: #f56c6c;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .log-retry {
          color: #909399;
          font-size: 12px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-sync-page {
    padding: 10px;
  }
  
  .operation-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start !important;
    
    .operation-actions {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>