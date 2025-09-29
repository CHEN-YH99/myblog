<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // name: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  // 用户状态选项
  const statusOptions = ref([
    { label: '启用', value: true },
    { label: '禁用', value: false }
  ])

  // 角色选项
  const roleOptions = ref([
    { label: '超级管理员', value: 'SUPER_ADMIN' },
    { label: '管理员', value: 'ADMIN' },
    { label: '编辑', value: 'EDITOR' },
    { label: '普通用户', value: 'USER' }
  ])

  // 表单配置
  const formItems = computed(() => [
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true
    },
    {
      label: '用户昵称',
      key: 'nickname',
      type: 'input',
      placeholder: '请输入用户昵称',
      clearable: true
    },
    {
      label: '用户角色',
      key: 'roleCode',
      type: 'select',
      props: {
        placeholder: '请选择角色',
        options: roleOptions.value,
        clearable: true
      }
    },
    {
      label: '用户状态',
      key: 'enabled',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: statusOptions.value,
        clearable: true
      }
    },
    {
      label: '创建日期',
      key: 'daterange',
      type: 'datetime',
      props: {
        style: { width: '100%' },
        placeholder: '请选择日期范围',
        type: 'daterange',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD',
        shortcuts: [
          { text: '今日', value: [new Date(), new Date()] },
          {
            text: '最近一周',
            value: [new Date(Date.now() - 604800000), new Date()]
          },
          {
            text: '最近一个月',
            value: [new Date(Date.now() - 2592000000), new Date()]
          }
        ]
      }
    }
  ])

  const handleSearch = () => {
    emit('search', formData.value)
  }

  const handleReset = () => {
    emit('reset')
  }
</script>