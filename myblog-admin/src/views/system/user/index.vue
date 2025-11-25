<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 更多 useTable 使用示例请移步至 功能示例 下面的 高级表格示例 -->
<template>
  <div class="user-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
  <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
    <template #left>
      <ElSpace wrap>
        <ElButton @click="showDialog('add')" v-ripple :disabled="isReadOnly">新增用户</ElButton>
      </ElSpace>
    </template>
  </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :dialog-type="dialogType"
        :user-data="(currentUserData as any)"
        :role-list="roleList"
        @confirm="handleDialogSubmit"
      />

      <!-- 头像更换弹窗 -->
      <el-dialog
        v-model="avatarDialogVisible"
        title="更换头像"
        width="500px"
        :before-close="() => { avatarDialogVisible = false; currentAvatarUser = null }"
      >
        <div class="avatar-dialog-content">
          <div class="current-avatar">
            <div class="avatar-label">当前头像</div>
            <el-image
              :src="currentAvatarUser?.avatar"
              class="current-avatar-img"
              fit="cover"
            />
            <div class="user-info">
              <div class="username">{{ currentAvatarUser?.userName }}</div>
              <div class="email">{{ currentAvatarUser?.userEmail }}</div>
            </div>
          </div>
          
          <div class="upload-section">
            <div class="upload-label">上传新头像</div>
            <AvatarUpload
              :model-value="currentAvatarUser?.avatar || ''"
              @change="handleAvatarChange"
              :size="120"
            />
            <div class="upload-tips">
              <p>• 支持 JPG、PNG、GIF、WebP 格式</p>
              <p>• 文件大小不超过 5MB</p>
              <p>• 建议上传正方形图片，获得最佳显示效果</p>
            </div>
          </div>
        </div>
      </el-dialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import AvatarUpload from '@/components/AvatarUpload.vue'
  import { ElMessageBox, ElMessage, ElTag, ElImage } from 'element-plus'
  import { useTable } from '@/composables/useTable'
  import { fetchGetUserList, fetchDeleteUser, fetchUpdateUser, fetchGetRoleList, fetchCreateUser } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useMenuStore } from '@/store/modules/menu'
  import { storeToRefs } from 'pinia'
  import { getDefaultAvatar, getUserStatusConfig, formatDate } from '@shared/utils/user'
  import { router } from '@/router'
  import { resetRouterState } from '@/router/guards/beforeEach'



  defineOptions({ name: 'User' })

  type UserListItem = Api.SystemManage.UserListItem
  interface RoleOption {
    roleId: number
    roleName: string
    roleCode: string
    description: string
    permissions: string[]
  }

  // 只读状态
  const { isReadOnly } = storeToRefs(useUserStore())

  // 弹窗相关
  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 头像更换弹窗
  const avatarDialogVisible = ref(false)
  const currentAvatarUser = ref<UserListItem | null>(null)

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  // 角色列表
  const roleList = ref<RoleOption[]>([])

  const REGISTER_SOURCE_LABELS: Record<string, string> = {
    frontend: '客户端',
    myblog: '客户端',
    client: '客户端',
    admin: '管理端',
    backend: '管理端',
    'myblog-admin': '管理端',
    'admin-register': '管理端',
    other: '其他'
  }

  const loadRoleOptions = async () => {
    try {
      const res = await fetchGetRoleList({
        current: 1,
        size: 1000
      })
      roleList.value = (res?.records || []).map((role) => ({
        roleId: role.roleId,
        roleName: role.roleName,
        roleCode: role.roleCode,
        description: role.description,
        permissions: Array.isArray(role.permissions) ? role.permissions : []
      }))
    } catch (error) {
      console.error('获取角色列表失败:', error)
      ElMessage.error('获取角色列表失败，请稍后重试')
    }
  }

  onMounted(() => {
    loadRoleOptions()
  })

  // 生成默认头像（用户名首字母头像）
  // 使用共享的用户工具函数

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'avatar',
          label: '用户名',
          width: 280,
          formatter: (row) => {
            return h('div', { class: 'user', style: 'display: flex; align-items: center' }, [
              h('div', { 
                class: 'avatar-wrapper',
                onClick: () => showAvatarDialog(row),
                style: 'cursor: pointer; position: relative;'
              }, [
                h(ElImage, {
                  class: 'avatar',
                  src: row.avatar,
                  previewSrcList: row.avatar ? [row.avatar] : [],
                  // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
                  previewTeleported: true
                }),
                h('div', {
                  class: 'avatar-hover',
                  style: `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 40px;
                    height: 40px;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    color: white;
                    font-size: 12px;
                  `
                }, '更换')
              ]),
              h('div', {}, [
                h('p', { class: 'user-name' }, row.userName),
                h('p', { class: 'email' }, row.userEmail)
              ])
            ])
          }
        },
        {
          prop: 'registerSource',
          label: '注册来源',
          width: 100,
          formatter: (row) => {
            // 获取原始值并转换为小写进行匹配
            const sourceKey = row.registerSource ? String(row.registerSource).toLowerCase() : 'other'
            // 优先使用精确匹配，如果没有则返回"其他"
            return REGISTER_SOURCE_LABELS[sourceKey] || REGISTER_SOURCE_LABELS['other']
          }
        },
        {
          prop: 'userGender',
          label: '性别',
          sortable: true,
          // checked: false, // 隐藏列
          formatter: (row) => {
            if (row.userGender === 'male' || row.userGender === '1' || row.userGender === 1) {
              return '男'
            } else if (row.userGender === 'female' || row.userGender === '0' || row.userGender === 0) {
              return '女'
            }
            return row.userGender || '未知'
          }
        },
        { prop: 'userPhone', label: '手机号' },
        {
          prop: 'status',
          label: '状态',
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          sortable: true,
          formatter: (row) => {
              return formatDate(row.createTime)
            }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                disabled: isReadOnly.value,
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                disabled: isReadOnly.value,
                onClick: () => {
                  
                  deleteUser(row)
                }
              })
            ])
        }
      ]
    },
    // 数据处理
    transform: {
      // 数据转换器 - 替换头像并映射字段
      dataTransformer: (records: any) => {
        // 类型守卫检查
        if (!Array.isArray(records)) {
          return []
        }

        // 映射后端数据字段到前端需要的格式
        const transformedData = records.map((item: any) => {
          const status = !item.enabled ? '4' : item.lastLoginTime ? '1' : '2'
          return {
            ...item,
            id: item.userId,
            userName: item.username,
            nickName: item.nickname,
            userEmail: item.email,
            userPhone: item.phone,
            userGender: item.gender || 'male',
            status,
            userRoles: [item.roleName],
            registerSource: item.registerSource || 'frontend',
            lastLoginTime: item.lastLoginTime,
            createBy: 'system',
            updateBy: 'system',
            avatar: item.avatar || getDefaultAvatar(item.username || String(item.userId))
          }
        })
        return transformedData
      }
    }
  })

  /**
   * 显示用户弹窗
   */
  const showDialog = async (type: Form.DialogType, row?: UserListItem): Promise<void> => {

    if (!roleList.value.length) {
      await loadRoleOptions()
    }
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除用户
   */
  const deleteUser = (row: UserListItem): void => {
    console.log('=== 删除用户函数开始执行 ===')
    console.log('函数调用栈:', new Error().stack)
    console.log('删除用户被调用:', row)
    console.log('row.id 的值:', row.id)
    console.log('row.userId 的值:', row.userId)
    console.log('row 对象的所有属性:', Object.keys(row))
    console.log('row 对象完整内容:', JSON.stringify(row, null, 2))
    
    // 检查 id 是否为空或未定义
    if (!row.id) {
      console.error('错误: row.id 为空或未定义!', { id: row.id, userId: row.userId })
      ElMessage.error('删除失败：用户ID无效')
      return
    }
    
    console.log('准备显示确认弹窗...')
    ElMessageBox.confirm(`确定要删除用户 "${row.userName}" 吗？此操作不可恢复！`, '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(async () => {
      console.log('=== 用户点击了确认按钮 ===')
      try {
        console.log('准备调用 fetchDeleteUser，参数:', row.id)
        console.log('fetchDeleteUser 函数类型:', typeof fetchDeleteUser)
        
        const result = await fetchDeleteUser(row.id) // 使用映射后的id字段
        console.log('fetchDeleteUser 调用成功，返回结果:', result)
        
        ElMessage.success('删除成功')
        // 刷新表格数据
        refreshData()
      } catch (error) {
        console.error('=== 删除过程中发生错误 ===')
        console.error('错误详情:', error)
        console.error('错误类型:', typeof error)
        console.error('错误消息:', error?.message || '未知错误')
        console.error('错误堆栈:', error?.stack || '无堆栈信息')
        ElMessage.error('删除失败，请稍后重试')
      }
    }).catch((error) => {
      console.log('=== 用户取消了删除操作或弹窗出错 ===')
      console.log('取消原因:', error)
    })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async (formData: any) => {
    try {
      console.log('处理弹窗提交，数据:', formData)
      
      // 准备提交数据
      // 注意：后端使用 enabled、roleId（单个）字段，前端 status、roleIds 是表单字段
      const roleId = Array.isArray(formData.roleIds) && formData.roleIds.length > 0
        ? Number(formData.roleIds[0])
        : undefined
      const submitData: any = {
        username: formData.username,
        email: formData.email,
        nickname: formData.nickname,
        enabled: formData.status === 1, // 将前端的 status 转换为后端的 enabled
        roleId
      }

      const userStore = useUserStore()
      const currentUserId = (userStore.info as any)?.id || (userStore.info as any)?.userId
      let isCurrentUser = false

      // 如果是编辑模式，需要包含用户ID
      if (dialogType.value === 'edit' && formData.id) {
        console.log('编辑用户，ID:', formData.id)
        
        // 检查是否修改的是当前登录用户
        isCurrentUser = formData.id === currentUserId
        console.log('是否为当前用户:', isCurrentUser, '当前用户ID:', currentUserId, '编辑用户ID:', formData.id)
        
        // 调用更新用户API
        await fetchUpdateUser(formData.id, submitData)
        ElMessage.success('用户信息更新成功')

        // 1) 即时更新表格中的该行数据（无需等待重新拉取）
        const idx = data.value.findIndex((u: any) => u.id === formData.id)
        if (idx !== -1) {
          const row = data.value[idx]
          // 基础信息同步
          row.userEmail = submitData.email
          row.nickName = submitData.nickname
          // enabled -> status: true: 按是否有 lastLoginTime 决定在线/离线；false: 禁用
          row.status = submitData.enabled
            ? (row.lastLoginTime ? '1' : '2')
            : '4'
          // 角色名同步（表格显示用）
          const roleIdsArr: number[] = Array.isArray(formData.roleIds) && formData.roleIds.length
            ? formData.roleIds
            : (submitData.roleId ? [submitData.roleId] : [])
          const idSet = new Set(roleIdsArr)
          const names = roleList.value.filter((r) => idSet.has(r.roleId)).map((r) => r.roleName)
          row.userRoles = names
          // 同步便捷字段
          row.roleId = roleIdsArr[0] ?? row.roleId
          row.roleName = names[0] ?? row.roleName
        }

        // 如果修改的是当前用户且修改了角色，需要重新加载权限
        if (isCurrentUser && formData.roleIds && formData.roleIds.length > 0) {
          console.log('当前用户角色已修改，需要重新加载权限')
          // 刷新用户信息以获取最新的角色和权限
          const refreshSuccess = await userStore.refreshUserInfo()
          if (refreshSuccess) {
            console.log('用户信息已刷新，新的角色信息:', userStore.info.roles)
            
            // 重新加载菜单和路由权限
            try {
              const menuStore = useMenuStore()
              
              // 重置路由状态以清除缓存的路由
              resetRouterState()
              
              // 清空菜单列表，触发路由守卫重新加载
              menuStore.setMenuList([])
              
              // 重新触发路由守卫以加载新的菜单和权限
              // 通过导航到当前路由来触发路由守卫
              await router.push({
                path: router.currentRoute.value.path,
                query: router.currentRoute.value.query,
                hash: router.currentRoute.value.hash,
                replace: true
              })
              
              ElMessage.success('您的角色权限已更新，菜单已刷新')
              console.log('权限和菜单已成功刷新')
            } catch (error) {
              console.error('刷新权限失败:', error)
              ElMessage.warning('您的角色权限已修改，建议刷新页面以获得最新权限')
              // 延迟后刷新页面以重新加载菜单和权限
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            }
          } else {
            ElMessage.warning('您的角色权限已修改，请重新登录以获得最新权限')
          }
        }
      } else {
        console.log('新增用户')
        // 调用创建用户API
        await fetchCreateUser({
          ...submitData,
          password: formData.password
        })
        ElMessage.success('用户创建成功')
      }

      // 关闭弹窗
      dialogVisible.value = false
      currentUserData.value = {}
      
      // 刷新表格数据
      refreshData()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection
    console.log('选中行数据:', selectedRows.value)
  }

  /**
   * 显示头像更换弹窗
   */
  const showAvatarDialog = (row: UserListItem): void => {
    currentAvatarUser.value = row
    avatarDialogVisible.value = true
  }

  /**
   * 处理头像更换
   */
  const handleAvatarChange = async (newAvatarUrl: string): Promise<void> => {
    if (!currentAvatarUser.value) return

    try {
      // 调用更新用户头像的API
      await fetchUpdateUser(currentAvatarUser.value.id, { avatar: newAvatarUrl })
      
      // 更新表格中的头像
      const userIndex = data.value.findIndex(user => user.id === currentAvatarUser.value!.id)
      if (userIndex !== -1) {
        data.value[userIndex].avatar = newAvatarUrl
      }
      
      ElMessage.success('头像更新成功')
      avatarDialogVisible.value = false
      currentAvatarUser.value = null
    } catch (error) {
      console.error('头像更新失败:', error)
      ElMessage.error('头像更新失败，请重试')
    }
  }
</script>

<style lang="scss" scoped>
  .user-page {
    :deep(.user) {
      .avatar-wrapper {
        position: relative;
        
        &:hover .avatar-hover {
          opacity: 1 !important;
        }
      }
      
      .avatar {
        width: 40px;
        height: 40px;
        margin-left: 0;
        border-radius: 6px;
      }

      > div:last-child {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }
      }
    }
  }

  .avatar-dialog-content {
    display: flex;
    gap: 30px;
    padding: 20px 0;

    .current-avatar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .avatar-label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 15px;
      }
      
      .current-avatar-img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid #e4e7ed;
        margin-bottom: 15px;
      }
      
      .user-info {
        text-align: center;
        
        .username {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 5px;
        }
        
        .email {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .upload-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .upload-label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 20px;
      }
      
      .upload-tips {
        margin-top: 20px;
        font-size: 12px;
        color: #909399;
        line-height: 1.6;
        
        p {
          margin: 0 0 5px 0;
        }
      }
    }
  }
</style>
