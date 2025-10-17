<template>
  <div class="page-content tags-management">
    <!-- 标题 -->
    <h2 class="page-title">标签管理</h2>

    <!-- 搜索和操作区域 -->
    <div class="search-section">
      <ElRow :gutter="10" align="middle">
        <ElCol :span="6">
          <div class="search-group">
            <span class="search-label">标签名称:</span>
            <ElInput
              v-model="searchVal"
              placeholder="请输入标签名称"
              clearable
              @keyup.enter="searchTags"
              @clear="onSearchClear"
              @input="onSearchInput"
              style="width: 200px"
            />
          </div>
        </ElCol>
        <ElCol :span="6">
          <ElButton type="primary" @click="searchTags" :disabled="isLoading">
            <ElIcon><Search /></ElIcon>
            搜索
          </ElButton>
          <ElButton @click="resetFilters" :disabled="isLoading">
            <ElIcon><Refresh /></ElIcon>
            重置
          </ElButton>
        </ElCol>
        <ElCol :span="12" style="display: flex; justify-content: flex-end; gap: 8px">
          <!-- 表格尺寸控制 -->
          <div class="size-controls">
            <ElRadioGroup v-model="tableSize" size="small">
              <ElRadioButton value="large">大</ElRadioButton>
              <ElRadioButton value="default">中</ElRadioButton>
              <ElRadioButton value="small">小</ElRadioButton>
            </ElRadioGroup>
          </div>
        </ElCol>
      </ElRow>

      <!-- 操作按钮行 -->
      <ElRow style="margin-top: 16px">
        <ElCol :span="12">
          <ElButton
            type="danger"
            :disabled="selectedTags.length === 0 || isLoading || isReadOnly"
            @click="handleBatchDelete"
          >
            <ElIcon><Delete /></ElIcon>
            批量删除
          </ElButton>
        </ElCol>
        <ElCol :span="12" style="display: flex; justify-content: flex-end">
          <ElButton type="primary" @click="handleAdd" :disabled="isReadOnly">
            <ElIcon><Plus /></ElIcon>
            新增
          </ElButton>
        </ElCol>
      </ElRow>
    </div>

    <!-- 标签表格 -->
    <div class="table-section">
      <ElTable
        v-loading="isLoading"
        :data="tagsList"
        :size="tableSize"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="name" label="标签" align="center" min-width="200" />
        <ElTableColumn prop="createTime" label="创建日期" align="center" width="200">
          <template #default="{ row }">
            {{ formatDetailDate(row.createTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="updateTime" label="修改日期" align="center" width="200">
          <template #default="{ row }">
            {{ formatDetailDate(row.updateTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" align="center" width="200">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="handleEdit(row)" :disabled="isReadOnly">
              <ElIcon><Edit /></ElIcon>
              修改
            </ElButton>
            <ElButton type="danger" size="small" link @click="handleDelete(row)" :disabled="isReadOnly">
              <ElIcon><Delete /></ElIcon>
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :small="false"
        :disabled="isLoading"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
      <div class="pagination-info">
        共 {{ total }} 条
        <span style="margin-left: 16px">{{ pageSize }}条/页</span>
        <span style="margin-left: 16px">前往</span>
        <span style="margin-left: 16px">页</span>
      </div>
    </div>

    <!-- 新增/编辑标签对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增标签' : '编辑标签'"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <ElFormItem label="标签名称" prop="name">
          <ElInput
            v-model="formData.name"
            placeholder="请输入标签名称"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="formData.description"
            type="textarea"
            placeholder="请输入标签描述（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading" :disabled="isReadOnly">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { Search, Refresh, Delete, Plus, Edit } from '@element-plus/icons-vue'
  import { useDateFormat } from '@vueuse/core'
  import { getTags } from '@/api/articles'
  import { useUserStore } from '@/store/modules/user'
  import { storeToRefs } from 'pinia'
  import { formatDetailDate } from '@shared/utils/user'

  defineOptions({ name: 'TagsManagement' })

  // 接口类型定义
  interface TagItem {
    _id: string
    name: string
    description?: string
    count: number
    createTime: string
    updateTime: string
  }

  interface FormData {
    name: string
    description: string
  }

  // 响应式数据
  const searchVal = ref('')
  const tagsList = ref<TagItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const isLoading = ref(false)
  const tableSize = ref<'large' | 'default' | 'small'>('default')
  const selectedTags = ref<TagItem[]>([])

  // 对话框相关
  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const currentEditId = ref('')

  // 表单数据
  const formData = ref<FormData>({
    name: '',
    description: ''
  })

  // 表单验证规则
  const formRules: FormRules = {
    name: [
      { required: true, message: '请输入标签名称', trigger: 'blur' },
      { min: 1, max: 50, message: '标签名称长度应在 1 到 50 个字符', trigger: 'blur' }
    ]
  }

  // 格式化日期
  // const formatDate = (dateString: string) => {
  //   if (!dateString) return '-'
  //   return useDateFormat(new Date(dateString), 'YYYY-MM-DD HH:mm:ss').value
  // }

  // 获取标签列表
  const getTagsList = async () => {
    isLoading.value = true
    try {
      // 调用真实的API从数据库获取标签
      const response = await getTags()
      console.log('获取标签API响应:', response)

      // 处理API返回的数据
      let allTags: Array<{ name: string; count: number }> = []
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        allTags = (response as any).data
      } else if (Array.isArray(response)) {
        allTags = response
      }

      console.log('处理后的标签数据:', allTags)

      // 过滤和搜索
      let filteredTags = allTags
      if (searchVal.value.trim()) {
        filteredTags = allTags.filter((tag) =>
          tag.name.toLowerCase().includes(searchVal.value.toLowerCase())
        )
      }

      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      const paginatedTags = filteredTags.slice(start, end)

      // 转换数据格式为前端需要的格式
      const tags: TagItem[] = paginatedTags.map((tag, index) => ({
        _id: `tag_${start + index + 1}`,
        name: tag.name,
        description: `${tag.name}相关技术标签`,
        count: tag.count || 0,
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))

      tagsList.value = tags
      total.value = filteredTags.length
    } catch (error) {
      console.error('获取标签列表失败:', error)
      ElMessage.error('获取标签列表失败')

      // 降级到空数据
      tagsList.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // 搜索标签
  const searchTags = () => {
    currentPage.value = 1
    getTagsList()
  }

  // 重置筛选条件
  const resetFilters = () => {
    searchVal.value = ''
    currentPage.value = 1
    getTagsList()
  }

  // 搜索框清空事件
  const onSearchClear = () => {
    currentPage.value = 1
    getTagsList()
  }

  // 搜索框输入事件
  const onSearchInput = (value: string) => {
    if (!value.trim()) {
      currentPage.value = 1
      getTagsList()
    }
  }

  // 表格选择变化
  const handleSelectionChange = (selection: TagItem[]) => {
    selectedTags.value = selection
  }

  // 分页大小变化
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    getTagsList()
  }

  // 当前页变化
  const handleCurrentChange = (page: number) => {
    currentPage.value = page
    getTagsList()
  }

  // 新增标签
  const handleAdd = () => {
    dialogMode.value = 'add'
    formData.value = {
      name: '',
      description: ''
    }
    currentEditId.value = ''
    dialogVisible.value = true
  }

  // 编辑标签
  const handleEdit = (row: TagItem) => {
    dialogMode.value = 'edit'
    formData.value = {
      name: row.name,
      description: row.description || ''
    }
    currentEditId.value = row._id
    dialogVisible.value = true
  }

  // 删除单个标签
  const handleDelete = (row: TagItem) => {
    ElMessageBox.confirm(`确定要删除标签「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 500))
        ElMessage.success('删除成功')
        getTagsList()
      } catch {
        ElMessage.error('删除失败')
      }
    })
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedTags.value.length === 0) {
      ElMessage.warning('请先选择要删除的标签')
      return
    }

    const tagNames = selectedTags.value.map((tag) => tag.name).join('、')
    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？\n${tagNames}`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 800))
        ElMessage.success(`成功删除 ${selectedTags.value.length} 个标签`)
        selectedTags.value = []
        getTagsList()
      } catch {
        ElMessage.error('批量删除失败')
      }
    })
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      submitLoading.value = true

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 800))

      const successMsg = dialogMode.value === 'add' ? '新增成功' : '修改成功'
      ElMessage.success(successMsg)

      dialogVisible.value = false
      getTagsList()
    } catch (error) {
      console.error('表单验证失败:', error)
    } finally {
      submitLoading.value = false
    }
  }

  // 组件挂载时获取数据
  onMounted(() => {
    getTagsList()
  })
</script>

<style lang="scss" scoped>
  .tags-management {
    padding: 20px;
    // background-color: #fff;
    border-radius: 8px;

    .page-title {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 500;
      // color: #303133;
    }

    .search-section {
      margin-bottom: 20px;
      padding: 16px;
      // background-color: #f8f9fa;
      border-radius: 6px;

      .search-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .search-label {
          white-space: nowrap;
          // color: #606266;
          font-size: 14px;
        }
      }

      .size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .table-section {
      margin-bottom: 20px;
      // border: 1px solid #ebeef5;
      border-radius: 6px;
      overflow: hidden;
    }

    .pagination-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;

      .pagination-info {
        // color: #909399;
        font-size: 14px;
      }
    }
  }

  // 深度选择器修改表格样式
  ::v-deep(.el-table) {
    .el-table__header {
      th {
        background-color: #fafafa;
        color: #303133;
        font-weight: 500;
      }
    }
  }

  // 对话框样式优化
  ::v-deep(.el-dialog) {
    .el-dialog__header {
      padding: 20px 20px 10px;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 500;
      }
    }

    .el-dialog__body {
      padding: 10px 20px 20px;
    }

    .el-dialog__footer {
      padding: 10px 20px 20px;
      text-align: right;
    }
  }
</style>
  const { isReadOnly } = storeToRefs(useUserStore())
