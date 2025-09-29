<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
    width="40%"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="form.username" :disabled="dialogType === 'edit'" />
      </ElFormItem>
      <ElFormItem label="用户昵称" prop="nickname">
        <ElInput v-model="form.nickname" />
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="密码" prop="password">
        <ElInput v-model="form.password" type="password" show-password />
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="确认密码" prop="confirmPassword">
        <ElInput v-model="form.confirmPassword" type="password" show-password />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="form.phone" />
      </ElFormItem>
      <ElFormItem label="用户角色" prop="roleId">
        <ElSelect v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
          <ElOption
            v-for="role in roleOptions"
            :key="role.roleId"
            :label="role.roleName"
            :value="role.roleId"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="form.enabled" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCreateUser, fetchUpdateUser, fetchGetRoleList } from '@/api/system-manage'

  type UserListItem = Api.SystemManage.UserListItem
  type RoleListItem = Api.SystemManage.RoleListItem

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    userData?: UserListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    userData: undefined
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()

  // 角色选项
  const roleOptions = ref<RoleListItem[]>([])

  // 获取角色列表
  const getRoleList = async () => {
    try {
      const response = await fetchGetRoleList({ current: 1, size: 100 })
      roleOptions.value = response.records || []
    } catch (error) {
      console.error('获取角色列表失败:', error)
      // 使用默认角色选项
      roleOptions.value = [
        { roleId: 1, roleName: '超级管理员', roleCode: 'super_admin', description: '', enabled: true, createTime: '' },
        { roleId: 2, roleName: '管理员', roleCode: 'admin', description: '', enabled: true, createTime: '' },
        { roleId: 3, roleName: '编辑', roleCode: 'editor', description: '', enabled: true, createTime: '' },
        { roleId: 4, roleName: '普通用户', roleCode: 'user', description: '', enabled: true, createTime: '' }
      ]
    }
  }

  // 组件挂载时获取角色列表
  onMounted(() => {
    getRoleList()
  })

  // 自定义验证规则
  const validatePassword = (rule: any, value: any, callback: any) => {
    if (props.dialogType === 'add' && !value) {
      callback(new Error('请输入密码'))
    } else if (value && value.length < 6) {
      callback(new Error('密码长度不能少于6位'))
    } else {
      callback()
    }
  }

  const validateConfirmPassword = (rule: any, value: any, callback: any) => {
    if (props.dialogType === 'add' && !value) {
      callback(new Error('请确认密码'))
    } else if (value && value !== form.password) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }

  const validateEmail = (rule: any, value: any, callback: any) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      callback(new Error('请输入正确的邮箱格式'))
    } else {
      callback()
    }
  }

  const validatePhone = (rule: any, value: any, callback: any) => {
    if (value && !/^1[3-9]\d{9}$/.test(value)) {
      callback(new Error('请输入正确的手机号格式'))
    } else {
      callback()
    }
  }

  const rules = reactive<FormRules>({
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
    ],
    nickname: [
      { required: true, message: '请输入用户昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    password: [{ validator: validatePassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
    email: [{ validator: validateEmail, trigger: 'blur' }],
    phone: [{ validator: validatePhone, trigger: 'blur' }],
    roleId: [{ required: true, message: '请选择用户角色', trigger: 'change' }]
  })

  const form = reactive<UserListItem & { password?: string; confirmPassword?: string }>({
    userId: 0,
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    roleId: 4,
    roleName: '',
    enabled: true,
    avatar: '',
    lastLoginTime: '',
    lastLoginIp: '',
    registerIp: '',
    createTime: '',
    updateTime: ''
  })

  // 监听弹窗打开，初始化表单数据
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        initForm()
      }
    },
    { immediate: true }
  )

  // 监听用户数据变化
  watch(
    () => props.userData,
    (newData) => {
      if (newData && props.modelValue) {
        initForm()
      }
    },
    { deep: true }
  )

  const initForm = () => {
    if (props.dialogType === 'edit' && props.userData) {
      Object.assign(form, {
        userId: props.userData.userId,
        username: props.userData.username,
        nickname: props.userData.nickname,
        email: props.userData.email || '',
        phone: props.userData.phone || '',
        roleId: props.userData.roleId,
        roleName: props.userData.roleName,
        enabled: props.userData.enabled,
        avatar: props.userData.avatar || '',
        lastLoginTime: props.userData.lastLoginTime,
        lastLoginIp: props.userData.lastLoginIp,
        registerIp: props.userData.registerIp,
        createTime: props.userData.createTime,
        updateTime: props.userData.updateTime
      })
      // 清空密码字段
      form.password = ''
      form.confirmPassword = ''
    } else {
      Object.assign(form, {
        userId: 0,
        username: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        roleId: 4,
        roleName: '',
        enabled: true,
        avatar: '',
        lastLoginTime: '',
        lastLoginIp: '',
        registerIp: '',
        createTime: '',
        updateTime: ''
      })
    }
  }

  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      
      const submitData = {
        username: form.username,
        nickname: form.nickname,
        email: form.email,
        phone: form.phone,
        roleId: form.roleId,
        enabled: form.enabled,
        ...(props.dialogType === 'add' && { password: form.password })
      }

      if (props.dialogType === 'add') {
        await fetchCreateUser(submitData)
      } else {
        await fetchUpdateUser(form.userId, submitData)
      }

      const message = props.dialogType === 'add' ? '新增成功' : '修改成功'
      ElMessage.success(message)
      emit('success')
      handleClose()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(props.dialogType === 'add' ? '新增失败' : '修改失败')
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-footer {
    text-align: right;
  }
</style>