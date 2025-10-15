<template>
  <div class="role-page art-full-height">
    <RoleSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></RoleSearch>

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
            <ElButton @click="showDialog('add')" v-ripple :disabled="isReadOnly">新增角色</ElButton>
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

    <!-- 角色编辑弹窗 -->
    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentUserData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, ElTag, ElSwitch } from 'element-plus'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { Edit, Delete } from '@element-plus/icons-vue'
  import { useTable } from '@/composables/useTable'
  import { fetchGetRoleList, fetchCreateRole, fetchUpdateRole, fetchDeleteRole } from '@/api/system-manage'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import RoleSearch from './modules/role-search.vue'
  import RoleEditDialog from './modules/role-edit-dialog.vue'
  import { useUserStore } from '@/store/modules/user'
  import { storeToRefs } from 'pinia'

  defineOptions({ name: 'RoleManage' })

  type RoleListItem = Api.SystemManage.RoleListItem
  const { isReadOnly } = storeToRefs(useUserStore())

  // 搜索表单
  const searchForm = ref({
    roleName: undefined,
    roleCode: undefined,
    enabled: undefined,
    daterange: undefined
  })

  const showSearchBar = ref(false)

  const dialogVisible = ref(false)
  const currentUserData = ref<RoleListItem | undefined>(undefined)

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
      apiFn: fetchGetRoleList,
      apiParams: {
        current: 1,
        size: 20
      },
      // 排除 apiParams 中的属性
      excludeParams: ['daterange'],
      columnsFactory: () => [
        {
          prop: 'roleId',
          label: '序号',
          width: 80,
          formatter: (row, column, cellValue, index) => {
            return (pagination.current - 1) * pagination.size + index + 1
          }
        },
        {
          prop: 'roleName',
          label: '角色名称',
          minWidth: 120
        },
        {
          prop: 'roleCode',
          label: '角色编码',
          minWidth: 120
        },
        {
          prop: 'description',
          label: '角色描述',
          minWidth: 200,
          formatter: (row) => {
            return row.description || '-'
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
          prop: 'enabled',
          label: '状态',
          width: 100,
          formatter: (row) => {
            return h(ElSwitch, {
              modelValue: row.enabled,
              activeText: '启用',
              inactiveText: '禁用',
              disabled: isReadOnly.value,
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
                    icon: Edit,
                    disabled: isReadOnly.value
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: Delete,
                    disabled: isReadOnly.value,
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

  const showDialog = (type: 'add' | 'edit', row?: RoleListItem) => {
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

  const buttonMoreClick = (item: ButtonMoreItem, row: RoleListItem) => {
    switch (item.key) {
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteRole(row)
        break
    }
  }

  const handleStatusChange = async (row: RoleListItem, value: boolean) => {
    try {
      const roleId = row.roleId
      await fetchUpdateRole(roleId, { enabled: value })
      row.enabled = value
      ElMessage.success(`角色状态${value ? '启用' : '禁用'}成功`)
    } catch (error) {
      ElMessage.error('状态更新失败')
      // 恢复原状态
      row.enabled = !value
    }
  }

  const deleteRole = (row: RoleListItem) => {
    console.log('=== 删除角色函数开始执行 ===')
    console.log('传入的角色数据:', row)
    console.log('角色ID:', row.roleId)
    
    ElMessageBox.confirm(`确定删除角色"${row.roleName}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        console.log('用户确认删除，开始调用API')
        try {
          const roleId = row.roleId
          console.log('调用fetchDeleteRole，参数:', roleId)
          console.log('fetchDeleteRole函数类型:', typeof fetchDeleteRole)
          
          await fetchDeleteRole(roleId)
          console.log('删除API调用成功')
          ElMessage.success('删除成功')
          refreshData()
        } catch (error) {
          console.error('删除失败，错误信息:', error)
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {
        console.log('用户取消删除')
        ElMessage.info('已取消删除')
      })
  }
</script>

<style lang="scss" scoped>
  .user-page {
    padding-bottom: 15px;
  }
</style>
