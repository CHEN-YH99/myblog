<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">用户管理</h4>
        <p class="subtitle">用户数据<span class="text-success">实时更新</span></p>
      </div>
      <el-radio-group v-model="radio2">
        <el-radio-button value="本月"></el-radio-button>
        <el-radio-button value="上月"></el-radio-button>
        <el-radio-button value="今年"></el-radio-button>
      </el-radio-group>
    </div>
    <ArtTable
      class="table"
      :data="tableData"
      style="width: 100%"
      size="large"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <el-table-column label="用户" prop="username" width="150px">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <el-avatar :size="36" :src="scope.row.avatar" :icon="UserFilled" />
              <span class="user-name">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" prop="roleName" />
        <el-table-column label="城市" prop="city">
          <template #default="scope">
            <span>{{ scope.row.city || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="性别" prop="gender">
          <template #default="scope">
            <span>{{ getGenderText(scope.row.gender) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="enabled">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'danger'" size="small">
              {{ scope.row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { fetchGetUserList } from '@/api/system-manage'
  import { UserFilled } from '@element-plus/icons-vue'
  import { ElAvatar, ElTag } from 'element-plus'

  const radio2 = ref('本月')
  const tableData = ref([])

  // 获取用户数据
  const fetchUserData = async () => {
    try {
      const response = await fetchGetUserList({
        current: 1,
        size: 6 // 只显示前6个用户
      })
      
      if (response && response.records) {
        tableData.value = response.records
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
      // 使用默认数据
      tableData.value = [
        {
          username: '管理员',
          roleName: '超级管理员',
          city: '北京',
          gender: 'male',
          enabled: true,
          avatar: ''
        },
        {
          username: '编辑',
          roleName: '编辑',
          city: '上海',
          gender: 'female',
          enabled: true,
          avatar: ''
        }
      ]
    }
  }

  // 性别文本转换
  const getGenderText = (gender: string) => {
    const genderMap = {
      'male': '男',
      'female': '女',
      'other': '其他'
    }
    return genderMap[gender] || '-'
  }

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
