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
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </ElSelect>
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
import { ElDialog, ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadio, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus'

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
  id: number
  name: string
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
</style>