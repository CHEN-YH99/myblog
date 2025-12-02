<template>
  <ElCard shadow="never" class="art-search-card">
    <ElForm :model="searchForm" label-width="80px" inline>
      <ElFormItem label="角色名称">
        <ElInput
          v-model="searchForm.roleName"
          placeholder="请输入角色名称"
          clearable
          style="width: 200px"
        />
      </ElFormItem>
      <ElFormItem label="角色编码">
        <ElInput
          v-model="searchForm.roleCode"
          placeholder="请输入角色编码"
          clearable
          style="width: 200px"
        />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect
          v-model="searchForm.enabled"
          placeholder="请选择状态"
          clearable
          style="width: 120px"
        >
          <ElOption label="启用" :value="true" />
          <ElOption label="禁用" :value="false" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="创建时间">
        <ElDatePicker
          v-model="searchForm.daterange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
  interface SearchForm {
    roleName?: string
    roleCode?: string
    enabled?: boolean
    daterange?: [string, string]
  }

  interface Props {
    modelValue: SearchForm
  }

  interface Emits {
    (e: 'update:modelValue', value: SearchForm): void
    (e: 'search', value: SearchForm): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchForm = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const handleSearch = () => {
    emit('search', searchForm.value)
  }

  const handleReset = () => {
    const resetForm: SearchForm = {
      roleName: undefined,
      roleCode: undefined,
      enabled: undefined,
      daterange: undefined
    }
    emit('update:modelValue', resetForm)
    emit('reset')
  }
</script>

<style lang="scss" scoped>
  .art-search-card {
    margin-bottom: 12px;
  }
</style>