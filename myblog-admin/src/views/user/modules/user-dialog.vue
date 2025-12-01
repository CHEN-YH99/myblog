<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="formData.username" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname">
        <ElInput v-model="formData.nickname" />
      </ElFormItem>
      <ElFormItem label="密码" prop="password" v-if="dialogType === 'add'">
        <ElInput v-model="formData.password" type="password" show-password />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="formData.email" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" />
      </ElFormItem>
      <ElFormItem label="角色" prop="roleId">
        <ElSelect v-model="formData.roleId">
          <ElOption
            v-for="role in roleList"
            :key="role.roleId"
            :value="role.roleId"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态" prop="enabled">
        <ElSwitch
          v-model="formData.enabled"
          :active-text="formData.enabled ? '启用' : '禁用'"
          active-color="#13ce66"
          inactive-color="#ff4949"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, nextTick, watch } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { fetchCreateUser, fetchUpdateUser } from '@/api/system-manage'

  interface RoleListItem {
    roleId: number
    roleName: string
  }

  interface Props {
    visible: boolean
    type: string
    userData?: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 角色列表数据 - 实际项目中应从API获取
  const ROLE_LIST_DATA = ref<RoleListItem[]>([])
  const roleList = ROLE_LIST_DATA

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    roleId: undefined as number | undefined,
    enabled: true
  })

  // 表单验证规则
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    phone: [
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    roleId: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ]
  }

  // 初始化表单数据
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    Object.assign(formData, {
      username: isEdit ? row.userName || '' : '',
      nickname: isEdit ? row.nickname || '' : '',
      password: '',
      email: isEdit ? row.email || '' : '',
      phone: isEdit ? row.userPhone || '' : '',
      roleId: isEdit ? row.roleId || null : null,
      enabled: isEdit ? row.enabled !== undefined ? row.enabled : true : true
    })
  }

  // 重置表单
  const resetForm = () => {
    formData.username = ''
    formData.nickname = ''
    formData.password = ''
    formData.email = ''
    formData.phone = ''
    formData.roleId = undefined
    formData.enabled = true
    formRef.value?.clearValidate()
  }

  // 统一监听对话框状态变化
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const isEdit = dialogType.value === 'edit'
          
          if (isEdit) {
            // 编辑用户
            const userId = props.userData?.id || props.userData?.userId
            if (!userId) {
              ElMessage.error('用户ID不存在，无法更新')
              return
            }
            
            const updateData = {
              nickname: formData.nickname,
              email: formData.email,
              phone: formData.phone,
              roleId: formData.roleId,
              enabled: formData.enabled
            }
            
            await fetchUpdateUser(userId, updateData as Partial<Api.SystemManage.UserListItem>)
            ElMessage.success('更新成功')
          } else {
            // 新增用户
            const createData = {
              username: formData.username,
              nickname: formData.nickname,
              password: formData.password,
              email: formData.email,
              phone: formData.phone,
              roleId: formData.roleId,
              enabled: formData.enabled
            }
            
            await fetchCreateUser(createData as Partial<Api.SystemManage.UserListItem>)
            ElMessage.success('添加成功')
          }
          
          dialogVisible.value = false
          emit('submit')
        } catch (error) {
          console.error('操作失败:', error)
          ElMessage.error(dialogType.value === 'add' ? '添加失败，请重试' : '更新失败，请重试')
        }
      }
    })
  }
</script>
