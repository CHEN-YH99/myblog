<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">{{ $t('dashboard.newUser.title') }}</h4>
        <p class="subtitle">{{ $t('dashboard.newUser.subtitle') }}<span class="text-success">{{ $t('dashboard.newUser.subtitleRealtime') }}</span></p>
      </div>
      <el-radio-group v-model="radio2">
        <el-radio-button :label="'thisMonth'">{{ $t('dashboard.newUser.filters.thisMonth') }}</el-radio-button>
        <el-radio-button :label="'lastMonth'">{{ $t('dashboard.newUser.filters.lastMonth') }}</el-radio-button>
        <el-radio-button :label="'thisYear'">{{ $t('dashboard.newUser.filters.thisYear') }}</el-radio-button>
      </el-radio-group>
    </div>
    <ArtTable
      class="table"
      :data="tableData"
      :style="{ width: '100%' }"
      size="large"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <el-table-column :label="$t('dashboard.newUser.columns.user')" prop="username" width="150px">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <el-avatar :size="36" :src="scope.row.avatar" :icon="UserFilled" />
              <span class="user-name">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dashboard.newUser.columns.role')" prop="roleName" />
        <el-table-column :label="$t('dashboard.newUser.columns.city')" prop="city">
          <template #default="scope">
            <span>{{ scope.row.city || $t('dashboard.newUser.placeholderDash') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dashboard.newUser.columns.gender')" prop="gender">
          <template #default="scope">
            <span>{{ getGenderText(scope.row.gender) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dashboard.newUser.columns.status')" prop="enabled">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'danger'" size="small">
              {{ scope.row.enabled ? $t('dashboard.newUser.status.enabled') : $t('dashboard.newUser.status.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { fetchGetUserList } from '@/api/system-manage'
  import { UserFilled } from '@element-plus/icons-vue'
  import { ElAvatar, ElTag } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const radio2 = ref('thisMonth')
  const allUsers = ref<any[]>([]) // 存储从API获取的所有用户
  const tableData = ref<any[]>([]) // 存储过滤后用于表格显示的用户

  // 根据选择的时间范围过滤用户数据
  const applyFilter = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0-11

    let filteredList: any[] = []

    // 关键改动：根据推测，将日期字段从 'createdAt' 修改为 'createTime'
    switch (radio2.value) {
      case 'thisMonth':
        filteredList = allUsers.value.filter(user => {
          const userDate = new Date(user.createTime)
          return userDate.getFullYear() === year && userDate.getMonth() === month
        })
        break
      case 'lastMonth':
        const prevMonthDate = new Date(year, month - 1, 1)
        const prevMonthYear = prevMonthDate.getFullYear()
        const prevMonth = prevMonthDate.getMonth()
        filteredList = allUsers.value.filter(user => {
          const userDate = new Date(user.createTime)
          return userDate.getFullYear() === prevMonthYear && userDate.getMonth() === prevMonth
        })
        break
      case 'thisYear':
        filteredList = allUsers.value.filter(user => {
          const userDate = new Date(user.createTime)
          return userDate.getFullYear() === year
        })
        break
      default:
        filteredList = allUsers.value
        break
    }
    tableData.value = filteredList.slice(0, 6)
  }

  // 获取用户数据
  const fetchUserData = async () => {
    try {
      const response = await fetchGetUserList({
        current: 1,
        size: 999 
      })
      
      if (response && response.records && response.records.length > 0) {
        allUsers.value = response.records
        applyFilter() // 初始加载后应用默认过滤器
      } else {
        allUsers.value = []
        tableData.value = []
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
      allUsers.value = []
      tableData.value = []
    }
  }

  // 性别文本转换
  const getGenderText = (gender: string) => {
    const genderMap: Record<string, string> = {
      male: t('dashboard.newUser.genderMap.male'),
      female: t('dashboard.newUser.genderMap.female'),
      other: t('dashboard.newUser.genderMap.other')
    }
    return genderMap[gender] || t('dashboard.newUser.placeholderDash')
  }

  // 监听 radio group 的变化，并重新应用过滤
  watch(radio2, applyFilter)

  onMounted(() => {
    fetchUserData()
  })
</script>

<style lang="scss">
  .card {
    // 进度动画
    .el-progress-bar__inner {
      transition: all 1s !important;
    }

    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      color: var(--el-color-primary) !important;
      background: transparent !important;
    }
  }
</style>

<style lang="scss" scoped>
  .card {
    width: 100%;
    height: 510px;
    overflow: hidden;

    .card-header {
      padding-left: 25px !important;
    }

    :deep(.el-table__body tr:last-child td) {
      border-bottom: none !important;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 6px;
    }

    .user-name {
      margin-left: 10px;
    }
  }
</style>
