<template>
  <div class="photo-category-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div class="header-left">
        <h2>图片分类管理</h2>
        <p class="subtitle">管理相册图片的分类信息</p>
      </div>
      <div class="header-right">
        <ElButton type="primary" @click="handleAdd">
          <ElIcon><Plus /></ElIcon>
          新增分类
        </ElButton>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <ElRow :gutter="16">
        <ElCol :span="8">
          <ElInput
            v-model="searchForm.keyword"
            placeholder="搜索分类名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <ElIcon><Search /></ElIcon>
            </template>
          </ElInput>
        </ElCol>
        <ElCol :span="6">
          <ElSelect v-model="searchForm.status" placeholder="状态筛选" clearable>
            <ElOption label="启用" value="active" />
            <ElOption label="禁用" value="inactive" />
          </ElSelect>
        </ElCol>
        <ElCol :span="6">
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElCol>
      </ElRow>
    </div>

    <!-- 分类数据表格 -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="categoryList"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="id" label="ID" width="200" show-overflow-tooltip />
        <ElTableColumn prop="name" label="分类名称" min-width="150">
          <template #default="{ row }">
            <div class="category-name">
              <div class="color-dot" :style="{ backgroundColor: row.color || '#409eff' }"></div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="coverImage" label="相册分类封面" min-width="150">
           <template #default="{ row }">
             <div v-if="row.coverImage" class="cover-image">
               <img :src="row.coverImage" :alt="row.name" class="cover-thumb" />
             </div>
             <span v-else class="no-cover">暂无封面</span>
           </template>
         </ElTableColumn>
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="photoCount" label="图片数量" width="100" align="center">
          <template #default="{ row }">
            <ElTag type="info">{{ row.photoCount || 0 }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElSwitch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @click.stop
              @change="handleStatusChange(row)"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" label="创建时间" width="180">
           <template #default="{ row }">
             {{ formatDate(row.createdAt) }}
           </template>
         </ElTableColumn>
         <ElTableColumn prop="updatedAt" label="修改日期" width="180">
           <template #default="{ row }">
             {{ formatDate(row.updatedAt) }}
           </template>
         </ElTableColumn>
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" @click.stop="handleEdit(row)">编辑</ElButton>
            <ElButton size="small" type="info" @click.stop="handleView(row)">查看</ElButton>
            <ElButton
              size="small"
              type="danger"
              @click.stop="handleDelete(row)"
              :disabled="row.photoCount > 0"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div class="pagination">
        <ElPagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedCategories.length > 0" class="batch-actions">
      <ElAlert :title="`已选择 ${selectedCategories.length} 个分类`" type="info" :closable="false">
        <template #default>
          <ElButton size="small" @click="handleBatchDelete">批量删除</ElButton>
          <ElButton size="small" @click="handleBatchStatus('active')">批量启用</ElButton>
          <ElButton size="small" @click="handleBatchStatus('inactive')">批量禁用</ElButton>
        </template>
      </ElAlert>
    </div>

    <!-- 新增/编辑分类对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增分类' : '编辑分类'"
      width="600px"
      @close="handleDialogClose"
    >
      <ElForm ref="formRef" :model="categoryForm" :rules="formRules" label-width="100px">
        <ElFormItem label="分类名称" prop="name">
           <ElInput v-model="categoryForm.name" placeholder="请输入分类名称" />
         </ElFormItem>
         <ElFormItem label="分类封面" prop="coverImage">
            <ImageUploader v-model="categoryForm.coverImage" />
         </ElFormItem>
        <ElFormItem label="分类颜色" prop="color">
          <ElColorPicker v-model="categoryForm.color" show-alpha :predefine="predefineColors" />
        </ElFormItem>
        <ElFormItem label="分类描述" prop="description">
          <ElInput
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </ElFormItem>
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="categoryForm.sort" :min="0" :max="9999" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="categoryForm.status">
            <ElRadio value="active">启用</ElRadio>
            <ElRadio value="inactive">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ dialogMode === 'add' ? '新增' : '更新' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 查看分类详情对话框 -->
    <ElDialog v-model="viewDialogVisible" title="分类详情" width="500px">
      <div v-if="currentCategory" class="category-detail">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="分类名称">
            <div class="category-name">
              <div
                class="color-dot"
                :style="{ backgroundColor: currentCategory.color || '#409eff' }"
              ></div>
              <span>{{ currentCategory.name }}</span>
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="分类封面">
             <div v-if="currentCategory.coverImage" class="cover-image">
               <img :src="currentCategory.coverImage" :alt="currentCategory.name" class="cover-thumb" />
             </div>
             <span v-else class="no-cover">暂无封面</span>
           </ElDescriptionsItem>
          <ElDescriptionsItem label="描述">{{ currentCategory.description || '暂无描述' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="图片数量">
            <ElTag type="info">{{ currentCategory.photoCount || 0 }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="currentCategory.status === 'active' ? 'success' : 'danger'">
              {{ currentCategory.status === 'active' ? '启用' : '禁用' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="排序">{{ currentCategory.sort || 0 }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{ formatDate(currentCategory.createdAt) }}</ElDescriptionsItem>
           <ElDescriptionsItem label="修改日期">{{ formatDate(currentCategory.updatedAt) }}</ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick, toRaw } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Search } from '@element-plus/icons-vue'
  import ImageUploader from '@/components/ImageUploader.vue'
  import {
    getPhotoCategories,
    createPhotoCategory,
    updatePhotoCategory,
    deletePhotoCategory,
    batchDeletePhotoCategories,
    batchUpdatePhotoCategoryStatus,
    type PhotoCategoryItem,
    type CreatePhotoCategoryParams,
    type UpdatePhotoCategoryParams,
    type PhotoCategorySearchParams
  } from '@/api/photoCategories'

  defineOptions({ name: 'PhotoCategoryManagement' })

  const router = useRouter()

  // 响应式数据
  const loading = ref(false)
  const submitLoading = ref(false)
  const dialogVisible = ref(false)
  const viewDialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const formRef = ref()

  // 分类列表数据
  const categoryList = ref<PhotoCategoryItem[]>([])
  const currentCategory = ref<PhotoCategoryItem | null>(null)

  // 搜索表单
  const searchForm = reactive<PhotoCategorySearchParams>({
    keyword: '',
    status: undefined
  })

  // 分页数据
  const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
  })

  // 选中的分类
  const selectedCategories = ref<PhotoCategoryItem[]>([])

  // 分类表单
   const categoryForm = reactive<CreatePhotoCategoryParams & { _id?: string }>({
     _id: undefined,
     name: '',
     coverImage: '',
     description: '',
     color: '#409eff',
     sort: 0,
     status: 'active'
   })

  // 预定义颜色
  const predefineColors = [
    '#ff4500',
    '#ff8c00',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    '#409eff',
    '#67c23a',
    '#e6a23c',
    '#f56c6c',
    '#909399'
  ]

  // 表单验证规则
   const formRules = {
     name: [
       { required: true, message: '请输入分类名称', trigger: 'blur' },
       { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
     ]
   }

  onMounted(() => {
    loadCategoryList()
  })

  // 加载分类列表
  const loadCategoryList = async () => {
    loading.value = true
    try {
      const params: PhotoCategorySearchParams = {
        page: pagination.currentPage,
        size: pagination.pageSize,
        keyword: searchForm.keyword || undefined,
        status: searchForm.status
      }

      const response = await getPhotoCategories(params)

      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 检查是否是分页响应格式
        if ('categories' in response && Array.isArray(response.categories)) {
          // 创建完全响应式的数据
          categoryList.value = response.categories.map((item: PhotoCategoryItem) => {
            const reactiveItem = reactive({
              _id: item._id,
              id: item._id || item.id,
              name: item.name || '',
              title: item.title || item.name || '',
              coverImage: item.coverImage || '',
              description: item.description || '',
              color: item.color || '#409eff',
              sort: item.sort || 0,
              status: item.status || 'active',
              photoCount: item.photoCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            })
            return reactiveItem
          })
          pagination.total = response.total || response.categories.length
        }
        // 检查是否是直接数组响应
        else if (Array.isArray(response)) {
          // 创建完全响应式的数据
          categoryList.value = response.map((item: PhotoCategoryItem) => {
            const reactiveItem = reactive({
              _id: item._id,
              id: item._id || item.id,
              name: item.name || '',
              title: item.title || item.name || '',
              coverImage: item.coverImage || '',
              description: item.description || '',
              color: item.color || '#409eff',
              sort: item.sort || 0,
              status: item.status || 'active',
              photoCount: item.photoCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            })
            return reactiveItem
          })
          pagination.total = response.length
        }
        // 检查是否是包装在data中的响应
        else if (response.data) {
          if (Array.isArray(response.data)) {
            // 创建完全响应式的数据
            categoryList.value = response.data.map((item: PhotoCategoryItem) => {
              const reactiveItem = reactive({
                _id: item._id,
                id: item._id || item.id,
                name: item.name || '',
                title: item.title || item.name || '',
                coverImage: item.coverImage || '',
                description: item.description || '',
                color: item.color || '#409eff',
                sort: item.sort || 0,
                status: item.status || 'active',
                photoCount: item.photoCount || 0,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              })
              return reactiveItem
            })
            pagination.total = response.data.length
          } else if (response.data.categories) {
            // 创建完全响应式的数据
            categoryList.value = response.data.categories.map((item: PhotoCategoryItem) => {
              const reactiveItem = reactive({
                _id: item._id,
                id: item._id || item.id,
                name: item.name || '',
                title: item.title || item.name || '',
                coverImage: item.coverImage || '',
                description: item.description || '',
                color: item.color || '#409eff',
                sort: item.sort || 0,
                status: item.status || 'active',
                photoCount: item.photoCount || 0,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              })
              return reactiveItem
            })
            pagination.total = response.data.total || response.data.categories.length
          }
        } else {
          console.warn('未知的响应格式:', response)
          categoryList.value = []
          pagination.total = 0
        }
      } else {
        console.warn('响应不是对象:', response)
        categoryList.value = []
        pagination.total = 0
      }

      // 如果有状态筛选，进行客户端筛选
      if (searchForm.status) {
        categoryList.value = categoryList.value.filter(item => item.status === searchForm.status)
        pagination.total = categoryList.value.length
      }

      // 强制刷新组件，确保表格更新
      await nextTick()
    } catch (error) {
      console.error('加载图片分类列表失败:', error)
      ElMessage.error('加载图片分类列表失败: ' + (error as any)?.message || '未知错误')
      categoryList.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    pagination.currentPage = 1
    loadCategoryList()
  }

  // 重置搜索
  const handleReset = () => {
    searchForm.keyword = ''
    searchForm.status = undefined
    handleSearch()
  }

  // 新增分类
  const handleAdd = () => {
    dialogMode.value = 'add'
    resetForm()
    dialogVisible.value = true
  }

  // 编辑分类
  const handleEdit = (row: PhotoCategoryItem) => {
    dialogMode.value = 'edit'
    Object.assign(categoryForm, {
       _id: row._id || row.id,
       name: row.name,
       coverImage: row.coverImage || '',
       description: row.description || '',
       color: row.color || '#409eff',
       sort: row.sort || 0,
       status: row.status
     })
    dialogVisible.value = true
  }

  // 查看分类
  const handleView = (row: PhotoCategoryItem) => {
    currentCategory.value = row
    viewDialogVisible.value = true
  }

  // 删除分类
  const handleDelete = async (row: PhotoCategoryItem) => {
    if (row.photoCount && row.photoCount > 0) {
      ElMessage.warning('该分类下还有图片，无法删除')
      return
    }

    try {
      await ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '删除确认', {
        type: 'warning'
      })

      const categoryId = row._id || row.id
      if (!categoryId) {
        ElMessage.error('分类ID不存在')
        return
      }

      await deletePhotoCategory(categoryId.toString())
      ElMessage.success('删除成功')
      loadCategoryList()
    } catch (error: unknown) {
      if (error !== 'cancel') {
        console.error('删除图片分类失败:', error)
        const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '删除失败'
        ElMessage.error(errorMsg)
      }
    }
  }

  // 状态切换处理
  const handleStatusChange = async (row: PhotoCategoryItem) => {
    const categoryId = row._id || row.id
    if (!categoryId) {
      ElMessage.error('分类ID不存在，无法更新状态')
      return
    }
    
    // 保存当前状态（ElSwitch已经改变了row.status，所以我们需要反推原始状态）
    const currentStatus = row.status
    const originalStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const result = await updatePhotoCategory(categoryId.toString(), { status: currentStatus })
      
      ElMessage.success(`${currentStatus === 'active' ? '启用' : '禁用'}成功`)
      
      // 强制响应式更新和重新渲染
      await nextTick()
      
      // 查找并更新列表中的对应项
      const index = categoryList.value.findIndex(item => (item._id || item.id) === categoryId)
      if (index !== -1) {
        categoryList.value[index].status = currentStatus
      }
      
    } catch (error: unknown) {
      console.error('状态更新失败:', error)
      
      // API调用失败，需要恢复ElSwitch的状态
      row.status = originalStatus
      
      const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : 
                        error && typeof error === 'object' && 'message' in error ? (error as any).message : '状态更新失败'
        ElMessage.error(errorMsg)
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      submitLoading.value = true

      if (dialogMode.value === 'add') {
        // 新增分类
         const createData: CreatePhotoCategoryParams = {
           name: categoryForm.name,
           coverImage: categoryForm.coverImage,
           description: categoryForm.description,
           color: categoryForm.color,
           sort: categoryForm.sort,
           status: categoryForm.status
         }

        await createPhotoCategory(createData)
        ElMessage.success('新增成功')
      } else {
        // 更新分类
        if (!categoryForm._id) {
          ElMessage.error('分类ID不存在')
          return
        }

        const updateData: UpdatePhotoCategoryParams = {
           name: categoryForm.name,
           coverImage: categoryForm.coverImage,
           description: categoryForm.description,
           color: categoryForm.color,
           sort: categoryForm.sort,
           status: categoryForm.status
         }

        await updatePhotoCategory(categoryForm._id.toString(), updateData)
        ElMessage.success('更新成功')
      }

      dialogVisible.value = false
      loadCategoryList()
    } catch (error: unknown) {
      console.error('表单提交失败:', error)
      if (error.fields) {
        // 表单验证失败
        return
      }
      const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '操作失败'
        ElMessage.error(errorMsg)
    } finally {
      submitLoading.value = false
    }
  }

  // 关闭对话框
  const handleDialogClose = () => {
    resetForm()
  }

  // 重置表单
  const resetForm = () => {
    Object.assign(categoryForm, {
       _id: undefined,
       name: '',
       coverImage: '',
       description: '',
       color: '#409eff',
       sort: 0,
       status: 'active'
     })

    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }

  // 选择变更
  const handleSelectionChange = (selection: PhotoCategoryItem[]) => {
    selectedCategories.value = selection
  }

  // 批量删除
  const handleBatchDelete = async () => {
    const hasPhotos = selectedCategories.value.some(
      (item) => item.photoCount && item.photoCount > 0
    )
    if (hasPhotos) {
      ElMessage.warning('选中的分类中有包含图片的分类，无法删除')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedCategories.value.length} 个分类吗？`,
        '批量删除确认',
        { type: 'warning' }
      )

      const ids = selectedCategories.value
        .map((item) => item._id || item.id)
        .filter((id) => id)
        .map((id) => id!.toString())

      if (ids.length === 0) {
        ElMessage.error('没有有效的分类ID')
        return
      }

      await batchDeletePhotoCategories(ids)
      ElMessage.success('批量删除成功')
      selectedCategories.value = []
      loadCategoryList()
    } catch (error: unknown) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
        const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '批量删除失败'
        ElMessage.error(errorMsg)
      }
    }
  }

  // 批量状态变更
  const handleBatchStatus = async (status: 'active' | 'inactive') => {
    try {
      await ElMessageBox.confirm(
        `确定要${status === 'active' ? '启用' : '禁用'}选中的 ${selectedCategories.value.length} 个分类吗？`,
        '批量操作确认',
        { type: 'warning' }
      )

      const ids = selectedCategories.value
        .map((item) => item._id || item.id)
        .filter((id) => id)
        .map((id) => id!.toString())

      if (ids.length === 0) {
        ElMessage.error('没有有效的分类ID')
        return
      }

      await batchUpdatePhotoCategoryStatus(ids, status)
      ElMessage.success(`批量${status === 'active' ? '启用' : '禁用'}成功`)
      selectedCategories.value = []
      loadCategoryList()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('批量状态更新失败:', error)
        const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '批量操作失败'
        ElMessage.error(errorMsg)
      }
    }
  }

  // 分页变更
  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadCategoryList()
  }

  const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadCategoryList()
  }

  // 表格行点击处理
  const handleRowClick = (row: PhotoCategoryItem) => {
    // 跳转到分类图片详情页
    router.push({
      path: '/photoalbum/category/' + (row._id || row.id),
      query: {
        name: row.name
      }
    })
  }

  // 格式化日期
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '暂无日期'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '无效日期'
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
</script>

<style scoped lang="scss">
  .photo-category-management {
    padding: 20px;
    // background: #f5f5f5;
    min-height: calc(100vh - 60px);

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      padding: 24px;
      // background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .header-left {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
        }

        .subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
      }
    }

    .search-bar {
      margin-bottom: 20px;
      padding: 24px;
      // background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .table-container {
      // background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      .pagination {
        display: flex;
        justify-content: center;
        padding: 20px;
        border-top: 1px solid #ebeef5;
      }
    }

    .batch-actions {
      margin-top: 16px;
    }

    .category-name {
      display: flex;
      align-items: center;
      gap: 8px;

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }

    .cover-image {
       .cover-thumb {
         width: 40px;
         height: 40px;
         object-fit: cover;
         border-radius: 4px;
         border: 1px solid #ebeef5;
       }
     }

     .no-cover {
       color: #909399;
       font-size: 12px;
     }

     .category-detail {
       .category-name {
         display: flex;
         align-items: center;
         gap: 8px;

         .color-dot {
           width: 16px;
           height: 16px;
           border-radius: 50%;
           flex-shrink: 0;
         }
       }
     }
  }
</style>
