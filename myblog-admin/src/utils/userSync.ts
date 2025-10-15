import { ElMessage } from 'element-plus'
import { receiveUserRegistration, syncUserToManagement, type UserSyncData } from '@/api/user-sync'

/**
 * 用户数据同步工具类
 */
export class UserSyncManager {
  private static instance: UserSyncManager
  private syncQueue: UserSyncData[] = []
  private isProcessing = false

  private constructor() {}

  public static getInstance(): UserSyncManager {
    if (!UserSyncManager.instance) {
      UserSyncManager.instance = new UserSyncManager()
    }
    return UserSyncManager.instance
  }

  /**
   * 添加用户到同步队列
   */
  public addToSyncQueue(userData: UserSyncData): void {
    this.syncQueue.push(userData)
    this.processSyncQueue()
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.syncQueue.length > 0) {
        const userData = this.syncQueue.shift()!
        await this.syncSingleUser(userData)
      }
    } catch (error) {
      console.error('同步队列处理失败:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 同步单个用户数据
   */
  private async syncSingleUser(userData: UserSyncData): Promise<void> {
    try {
      // 转换数据格式以适配后台管理系统
      const adminUserData = this.transformToAdminFormat(userData)
      
      // 调用同步API
      await syncUserToManagement(adminUserData)
      
      console.log('用户数据同步成功:', userData.username)
    } catch (error) {
      console.error('用户数据同步失败:', error)
      // 可以考虑重试机制或错误日志记录
      this.handleSyncError(userData, error)
    }
  }

  /**
   * 转换数据格式以适配后台管理系统
   */
  private transformToAdminFormat(userData: UserSyncData): UserSyncData {
    return {
      ...userData,
      // 确保必要字段存在
      role: userData.role || '普通用户',
      status: userData.status || 'active',
      createTime: userData.createTime || new Date().toISOString(),
      updateTime: new Date().toISOString(),
      registerSource: userData.registerSource || 'admin',
      // 生成默认头像（如果没有）
      avatar: userData.avatar || this.generateDefaultAvatar(userData.username),
      // 设置默认昵称
      nickname: userData.nickname || userData.username
    }
  }

  /**
   * 生成默认头像URL
   */
  private generateDefaultAvatar(username: string): string {
    // 使用用户名生成默认头像
    const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
    const colorIndex = username.length % colors.length
    const color = colors[colorIndex].replace('#', '')
    
    // 使用在线头像生成服务
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${color}&color=fff&size=200`
  }

  /**
   * 处理同步错误
   */
  private handleSyncError(userData: UserSyncData, error: any): void {
    // 记录错误日志
    const errorLog = {
      timestamp: new Date().toISOString(),
      userData,
      error: error.message || '未知错误'
    }
    
    // 存储到本地存储以便后续处理
    const errorLogs = JSON.parse(localStorage.getItem('userSyncErrors') || '[]')
    errorLogs.push(errorLog)
    localStorage.setItem('userSyncErrors', JSON.stringify(errorLogs))
    
    // 显示错误提示（可选）
    console.warn(`用户 ${userData.username} 同步失败:`, error.message)
  }

  /**
   * 获取同步错误日志
   */
  public getSyncErrors(): any[] {
    return JSON.parse(localStorage.getItem('userSyncErrors') || '[]')
  }

  /**
   * 清除同步错误日志
   */
  public clearSyncErrors(): void {
    localStorage.removeItem('userSyncErrors')
  }

  /**
   * 手动重试失败的同步
   */
  public async retryFailedSyncs(): Promise<void> {
    const errorLogs = this.getSyncErrors()
    
    if (errorLogs.length === 0) {
      ElMessage.info('没有需要重试的同步任务')
      return
    }

    let successCount = 0
    const newErrorLogs = []

    for (const errorLog of errorLogs) {
      try {
        await this.syncSingleUser(errorLog.userData)
        successCount++
      } catch (error) {
        newErrorLogs.push({
          ...errorLog,
          retryTime: new Date().toISOString(),
          retryError: error.message
        })
      }
    }

    // 更新错误日志
    localStorage.setItem('userSyncErrors', JSON.stringify(newErrorLogs))

    if (successCount > 0) {
      ElMessage.success(`成功重试同步 ${successCount} 个用户`)
    }

    if (newErrorLogs.length > 0) {
      ElMessage.warning(`仍有 ${newErrorLogs.length} 个用户同步失败`)
    }
  }
}

/**
 * 获取用户同步管理器实例
 */
export const getUserSyncManager = (): UserSyncManager => {
  return UserSyncManager.getInstance()
}

/**
 * 快捷方法：同步用户数据
 */
export const syncUserData = (userData: UserSyncData): void => {
  const syncManager = getUserSyncManager()
  syncManager.addToSyncQueue(userData)
}