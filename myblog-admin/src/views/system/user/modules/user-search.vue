<template>
  <div class="user-search">
    <ElCard shadow="never">
      <ElForm
        ref="formRef"
        :model="searchForm"
        :inline="true"
        label-width="80px"
        class="search-form"
      >
        <ElFormItem label="用户名" prop="username">
          <ElInput
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>
        
        <ElFormItem label="邮箱" prop="email">
          <ElInput
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>
        
        <ElFormItem label="状态" prop="status">
          <ElSelect
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <ElOption label="启用" value="1" />
            <ElOption label="禁用" value="0" />
          </ElSelect>
        </ElFormItem>
        
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">
            <template #icon>
              <ElIcon><Search /></ElIcon>
            </template>
            搜索
          </ElButton>
          <ElButton @click="handleReset">
            <template #icon>
              <ElIcon><Refresh /></ElIcon>
            </template>
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElIcon } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

interface SearchForm {
  username?: string
  email?: string
  status?: string
}

const formRef = ref()
const searchForm = reactive<SearchForm>({
  username: '',
  email: '',
  status: ''
})

const emit = defineEmits<{
  search: [form: SearchForm]
  reset: []
}>()

const handleSearch = () => {
  emit('search', { ...searchForm })
}

const handleReset = () => {
  formRef.value?.resetFields()
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof SearchForm] = ''
  })
  emit('reset')
}
</script>

<style scoped>
.user-search {
  margin-bottom: 16px;
}

.search-form {
  padding: 16px 0;
}

.search-form .el-form-item {
  margin-bottom: 16px;
}
</style>