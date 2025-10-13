<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 更多 useTable 使用示例请移步至 功能示例 下面的 高级表格示例 -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></UserSearch>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增用户</ElButton>
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
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
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
  // 用户头像数据 - 实际项目中应从API获取
  const ACCOUNT_TABLE_DATA = ref([])
  import { ElMessageBox, ElMessage, ElTag, ElImage } from 'element-plus'
  import { useTable } from '@/composables/useTable'
  import { fetchGetUserList, fetchDeleteUser, fetchUpdateUser } from '@/api/system-manage'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'

  defineOptions({ name: 'User' })

  type UserListItem = Api.SystemManage.UserListItem

  // 弹窗相关
  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 头像更换弹窗
  const avatarDialogVisible = ref(false)
  const currentAvatarUser = ref<UserListItem | null>(null)

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  // 搜索表单
  const searchForm = ref({
    name: undefined,
    level: 'vip',
    date: undefined,
    daterange: undefined,
    status: undefined
  })

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    '1': { type: 'success' as const, text: '在线' },
    '2': { type: 'info' as const, text: '离线' },
    '3': { type: 'warning' as const, text: '异常' },
    '4': { type: 'danger' as const, text: '注销' }
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: string) => {
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      // 排除 apiParams 中的属性
      excludeParams: ['daterange'],
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
                  previewSrcList: [row.avatar],
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
              h('div', { style: 'margin-left: 12px; flex: 1;' }, [
                h('div', { style: 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;' }, [
                  h('p', { 
                    class: 'user-name',
                    style: 'margin: 0; font-weight: 500; color: #303133;'
                  }, row.userName),
                  row.nickName && h('span', {
                    style: `
                      background: #f0f9ff;
                      color: #0369a1;
                      padding: 2px 6px;
                      border-radius: 4px;
                      font-size: 12px;
                      font-weight: 400;
                      border: 1px solid #e0f2fe;
                    `
                  }, row.nickName)
                ]),
                h('p', { 
                  class: 'email',
                  style: 'margin: 0; font-size: 12px; color: #909399;'
                }, row.userEmail)
              ])
            ])
          }
        },
        {
          prop: 'userGender',
          label: '性别',
          sortable: true,
          // checked: false, // 隐藏列
          formatter: (row) => {
            const genderMap = {
              'male': '男',
              'female': '女',
              'other': '其他'
            }
            return genderMap[row.userGender as keyof typeof genderMap] || '未知'
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
            if (!row.createTime) return '-'
            const date = new Date(row.createTime)
            return date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
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
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => {
                  console.log('=== 删除按钮被点击 ===')
                  console.log('点击事件触发，row:', row)
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
        console.log('数据转换器被调用，原始数据:', records)
        // 类型守卫检查
        if (!Array.isArray(records)) {
          console.warn('数据转换器: 期望数组类型，实际收到:', typeof records)
          return []
        }

        // 映射后端数据字段到前端需要的格式
        const transformedData = records.map((item: any, index: number) => {
          const transformed = {
            ...item,
            id: item.userId, // 将后端的userId映射为前端需要的id
            userName: item.username, // 将后端的username映射为前端需要的userName
            nickName: item.nickname, // 将后端的nickname映射为前端需要的nickName
            userEmail: item.email, // 将后端的email映射为前端需要的userEmail
            userPhone: item.phone, // 将后端的phone映射为前端需要的userPhone
            userGender: item.gender || 'male', // 设置默认性别
            status: item.enabled ? '1' : '2', // 将enabled状态映射为前端的status格式
            userRoles: [item.roleName], // 将角色名称包装为数组
            createBy: 'system', // 设置默认创建者
            updateBy: 'system', // 设置默认更新者
            // 使用本地头像替换接口返回的头像
            avatar: item.avatar || ACCOUNT_TABLE_DATA[index % ACCOUNT_TABLE_DATA.length].avatar
          }
          console.log('转换后的数据项:', { original: item.userId, transformed: transformed.id })
          return transformed
        })
        console.log('数据转换完成，转换后数据:', transformedData)
        return transformedData
      }
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...filtersParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    // 搜索参数赋值
    Object.assign(searchParams, { ...filtersParams, startTime, endTime })
    getData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: Form.DialogType, row?: UserListItem): void => {
    console.log('打开弹窗:', { type, row })
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
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
      // 刷新表格数据
      refreshData()
    } catch (error) {
      console.error('提交失败:', error)
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
