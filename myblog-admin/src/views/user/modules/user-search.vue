<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

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

  // 表单配置
  const formItems = computed(() => [
    { label: '用户名', key: 'name', type: 'input', placeholder: '请输入用户名', clearable: true },
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      props: { placeholder: '请输入邮箱地址', clearable: true }
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input',
      props: { placeholder: '请输入手机号', maxlength: '11', clearable: true }
    },
    {
      label: '性别',
      key: 'gender',
      type: 'select',
      props: { 
        placeholder: '请选择性别', 
        clearable: true,
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
          { label: '其他', value: 'other' }
        ]
      }
    },
    {
      label: '状态',
      key: 'enabled',
      type: 'select',
      props: { 
        placeholder: '请选择状态', 
        clearable: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false }
        ]
      }
    },
    {
      label: '创建日期',
      key: 'daterange',
      type: 'datetime',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true
      }
    }
  ])

  // 事件
  function handleReset() {
    console.log('重置表单')
    emit('reset')
  }

  async function handleSearch() {
    await searchBarRef.value.validate()
    emit('search', formData.value)
    console.log('表单数据', formData.value)
  }
</script>
