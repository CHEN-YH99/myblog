<template>
  <div class="user-page art-full-height">
    <UserSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></UserSearch>

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
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
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 用户编辑弹窗 -->
    <UserEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :user-data="currentUserData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, ElTag, ElAvatar, ElSwitch } from 'element-plus'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { Edit, Delete, User } from '@element-plus/icons-vue'
  import { useTable } from '@/composables/useTable'
  import { fetchGetUserList, fetchCreateUser, fetchUpdateUser, fetchDeleteUser } from '@/api/system-manage'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import UserSearch from './modules/user-search.vue'
  import UserEditDialog from './modules/user-edit-dialog.vue'

  defineOptions({ name: 'UserManage' })

  type UserListItem = Api.SystemManage.UserListItem

  // 搜索表单
  const searchForm = ref({
    username: undefined,
    nickname: undefined,
    roleCode: undefined,
    enabled: undefined,
    daterange: undefined
  })

  const showSearchBar = ref(false)

  const dialogVisible = ref(false)
  const currentUserData = ref<UserListItem | undefined>(undefined)

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
        size: 20
      },
      // 排除 apiParams 中的属性
      excludeParams: ['daterange'],
      columnsFactory: () => [
        {
          prop: 'userId',
          label: '序号',
          width: 80,
          formatter: (row, column, cellValue, index) => {
            return (pagination.current - 1) * pagination.size + index + 1
          }
        },
        {
          prop: 'username',
          label: '用户名',
          minWidth: 120
        },
        {
          prop: 'nickname',
          label: '用户昵称',
          minWidth: 120
        },
        {
          prop: 'avatar',
          label: '头像',
          width: 80,
          formatter: (row) => {
            return h(ElAvatar, {
              size: 40,
              src: row.avatar || '',
              icon: User
            })
          }
        },
        {
          prop: 'roleName',
          label: '角色',
          width: 120,
          formatter: (row) => {
            const roleColors = {
              '超级管理员': 'danger',
              '管理员': 'warning',
              '编辑': 'primary',
              '普通用户': 'info'
            }
            return h(
              ElTag,
              { 
                type: roleColors[row.roleName] || 'info',
                size: 'small'
              },
              () => row.roleName
            )
          }
        },
        {
          prop: 'lastLoginIp',
          label: 'IP地址',
          width: 140,
          formatter: (row) => {
            const ip = row.lastLoginIp || row.registerIp || '-'
            // 处理IPv6映射的IPv4地址，去掉::ffff:前缀
            if (ip.startsWith('::ffff:')) {
              return ip.replace('::ffff:', '')
            }
            return ip
          }
        },
        {
          prop: 'city',
          label: '登录城市',
          width: 120,
          formatter: (row) => {
            return row.city || '-'
          }
        },
        {
          prop: 'gender',
          label: '性别',
          width: 80,
          formatter: (row) => {
            const genderMap = {
              'male': '男',
              'female': '女',
              'other': '其他'
            }
            return genderMap[row.gender] || '-'
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          width: 180,
          sortable: true,
          formatter: (row) => {
            return row.createTime ? new Date(row.createTime).toLocaleString() : '-'
          }
        },
        {
          prop: 'updateTime',
          label: '修改日期',
          width: 180,
          sortable: true,
          formatter: (row) => {
            return row.updateTime ? new Date(row.updateTime).toLocaleString() : '-'
          }
        },
        {
          prop: 'enabled',
          label: '状态',
          width: 100,
          formatter: (row) => {
            return h(ElSwitch, {
              modelValue: row.enabled,
              activeText: '启用',
              inactiveText: '禁用',
              onChange: (value) => handleStatusChange(row, value)
            })
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'edit',
                    label: '修改',
                    icon: Edit
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: Delete,
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row)
              })
            ])
        }
      ]
    }
  })

  const dialogType = ref<'add' | 'edit'>('add')

  const showDialog = (type: 'add' | 'edit', row?: UserListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentUserData.value = row
  }

  /**
   * 搜索处理
   * @param params 搜索参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...filtersParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    // 搜索参数赋值
    Object.assign(searchParams, { ...filtersParams, startTime, endTime })
    getData()
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: UserListItem) => {
    switch (item.key) {
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteUser(row)
        break
    }
  }

  const handleStatusChange = async (row: UserListItem, value: boolean) => {
    try {
      await fetchUpdateUser(row.userId, { enabled: value })
      row.enabled = value
      ElMessage.success(`用户状态${value ? '启用' : '禁用'}成功`)
    } catch (error) {
      ElMessage.error('状态更新失败')
      // 恢复原状态
      row.enabled = !value
    }
  }

  const deleteUser = (row: UserListItem) => {
    ElMessageBox.confirm(`确定删除用户"${row.username}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await fetchDeleteUser(row.userId)
          ElMessage.success('删除成功')
          refreshData()
        } catch (error) {
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {
        ElMessage.info('已取消删除')
      })
  }
</script>

<style lang="scss" scoped>
  .user-page {
    padding-bottom: 15px;
  }
</style>
