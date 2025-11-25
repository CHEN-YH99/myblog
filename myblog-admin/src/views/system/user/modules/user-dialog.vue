<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="dialogTitle"
    width="600px"
    :before-close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <ElFormItem label="用户名" prop="username">
        <ElInput
          v-model="formData.username"
          placeholder="请输入用户名"
          :disabled="dialogType === 'edit'"
        />
      </ElFormItem>
      
      <ElFormItem label="邮箱" prop="email">
        <ElInput
          v-model="formData.email"
          placeholder="请输入邮箱"
        />
      </ElFormItem>
      
      <ElFormItem label="昵称" prop="nickname">
        <ElInput
          v-model="formData.nickname"
          placeholder="请输入昵称"
        />
      </ElFormItem>
      
      <ElFormItem v-if="dialogType === 'add'" label="密码" prop="password">
        <ElInput
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password
        />
      </ElFormItem>
      
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio :label="1">启用</ElRadio>
          <ElRadio :label="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      
      <ElFormItem label="角色" prop="roleIds">
        <ElSelect
          v-model="formData.roleIds"
          placeholder="请选择角色"
          multiple
          style="width: 100%"
        >
          <ElOption
            v-for="role in roleList"
            :key="role.roleId"
            :label="role.roleName"
            :value="role.roleId"
          >
            <div class="role-option">
              <span class="role-option__name">{{ role.roleName }}</span>
              <span class="role-option__desc">{{ role.description }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-if="selectedRoles.length" label="角色权限">
        <div class="role-permissions">
          <div
            v-for="role in selectedRoles"
            :key="role.roleId"
            class="role-permissions__item"
          >
            <div class="role-permissions__title">
              {{ role.roleName }}
              <span class="role-permissions__desc">{{ role.description }}</span>
            </div>
            <div class="role-permissions__tags">
              <ElTag
                v-for="permission in (role.permissions?.length ? role.permissions : ['*'])"
                :key="permission"
                size="small"
                effect="light"
              >
                {{ formatPermissionLabel(permission) }}
              </ElTag>
            </div>
          </div>
        </div>
      </ElFormItem>
    </ElForm>
    
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm" :loading="loading">
        确定
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadio, ElSelect, ElOption, ElButton, ElMessage, ElTag } from 'element-plus'

interface UserForm {
  id?: number
  username: string
  email: string
  nickname: string
  password?: string
  status: number
  roleIds: number[]
}

interface Role {
  roleId: number
  roleName: string
  roleCode: string
  description: string
  permissions: string[]
}

const props = defineProps<{
  visible: boolean
  dialogType: 'add' | 'edit'
  userData?: Partial<UserForm>
  roleList: Role[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [data: UserForm]
}>()

const formRef = ref()
const loading = ref(false)

const formData = reactive<UserForm>({
  username: '',
  email: '',
  nickname: '',
  password: '',
  status: 1,
  roleIds: []
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const permissionLabelMap: Record<string, string> = {
  '*': '全部权限',
  'user:read': '查看用户',
  'user:write': '管理用户',
  'article:read': '查看文章',
  'article:write': '管理文章',
  'category:read': '查看分类',
  'category:write': '管理分类'
}

const selectedRoles = computed(() => {
  if (!Array.isArray(formData.roleIds) || formData.roleIds.length === 0) {
    return []
  }
  const idMap = new Set(formData.roleIds)
  return props.roleList.filter((role) => idMap.has(role.roleId))
})

const formatPermissionLabel = (permission: string) => {
  return permissionLabelMap[permission] || permission
}

const dialogTitle = computed(() => {
  return props.dialogType === 'add' ? '新增用户' : '编辑用户'
})

watch(() => props.visible, (val) => {
  if (val && props.userData) {
    Object.assign(formData, props.userData)
  } else if (val) {
    resetForm()
  }
})

const resetForm = () => {
  Object.assign(formData, {
    username: '',
    email: '',
    nickname: '',
    password: '',
    status: 1,
    roleIds: []
  })
  formRef.value?.clearValidate()
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const submitData = { ...formData }
    if (props.dialogType === 'edit') {
      delete submitData.password
    }
    
    emit('confirm', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}

.role-option {
  display: flex;
  flex-direction: column;
}

.role-option__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.role-option__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-permissions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-permissions__item {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.role-permissions__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.role-permissions__desc {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.role-permissions__tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>