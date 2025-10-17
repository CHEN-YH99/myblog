<template>
  <div class="page-content talk-list">
    <!-- 顶部操作栏 -->
    <ElRow justify="space-between" :gutter="10" class="header-row">
      <ElCol :lg="8" :md="8" :sm="14" :xs="16">
        <div style="display: flex; gap: 8px">
          <ElInput
            v-model="searchVal"
            :prefix-icon="Search"
            clearable
            placeholder="输入说说内容查询"
            @keyup.enter="searchTalk"
            @clear="onSearchClear"
            @input="onSearchInput"
            style="flex: 1"
          />
          <ElButton @click="searchTalk" :disabled="isLoading">搜索</ElButton>
        </div>
      </ElCol>
      <ElCol :lg="8" :md="8" :sm="0" :xs="0">
        <div class="status-tabs">
          <ElSegmented 
            v-model="currentStatus" 
            :options="statusOptions" 
            @change="handleStatusChange" 
          />
        </div>
      </ElCol>
      <ElCol :lg="8" :md="8" :sm="10" :xs="8" style="display: flex; justify-content: end; gap: 8px">
        <ElButton @click="resetFilters" :disabled="isLoading">重置</ElButton>
        <ElButton type="primary" @click="toPublishTalk">
          <ElIcon><Plus /></ElIcon>
          发表说说
        </ElButton>
      </ElCol>
    </ElRow>

    <!-- 批量操作栏 -->
    <transition name="slide-down">
      <div v-if="selectedTalks.length > 0" class="batch-operation-bar">
        <div class="batch-info">已选择 {{ selectedTalks.length }} 条说说</div>
        <div class="batch-actions">
          <ElButton 
            v-if="currentStatus !== 'deleted'" 
            type="danger" 
            @click="batchDelete" 
            :loading="batchLoading"
          >
            批量删除
          </ElButton>
          <ElButton 
            v-if="currentStatus === 'deleted'" 
            type="success" 
            @click="batchRestore" 
            :loading="batchLoading"
          >
            批量恢复
          </ElButton>
          <ElButton 
            v-if="currentStatus === 'deleted'" 
            type="danger" 
            @click="batchPermanentDelete" 
            :loading="batchLoading"
          >
            永久删除
          </ElButton>
          <ElButton 
            v-if="currentStatus !== 'deleted'" 
            @click="batchToggleTop" 
            :loading="batchLoading"
          >
            批量置顶/取消置顶
          </ElButton>
          <ElButton 
            v-if="currentStatus === 'public'" 
            @click="batchToggleHide" 
            :loading="batchLoading"
          >
            批量隐藏/显示
          </ElButton>
        </div>
      </div>
    </transition>

    <!-- 说说列表 -->
    <div class="talk-list-container">
      <ElTable
        v-loading="isLoading"
        :data="talkList"
        @selection-change="handleSelectionChange"
        row-key="_id"
        class="talk-table"
      >
        <ElTableColumn type="selection" width="55" />
        
        <ElTableColumn label="内容" min-width="300">
          <template #default="{ row }">
            <div class="talk-content">
              <div class="content-text" v-html="formatContent(row.content)"></div>
              <div v-if="row.images && row.images.length > 0" class="content-images">
                <ElImage
                  v-for="(image, index) in row.images.slice(0, 3)"
                  :key="index"
                  :src="image"
                  :preview-src-list="row.images"
                  :initial-index="index"
                  class="content-image"
                  fit="cover"
                />
                <div v-if="row.images.length > 3" class="more-images">
                  +{{ row.images.length - 3 }}
                </div>
              </div>
              <div v-if="row.tags && row.tags.length > 0" class="content-tags">
                <ElTag
                  v-for="tag in row.tags"
                  :key="tag"
                  size="small"
                  type="info"
                  class="tag-item"
                >
                  {{ tag }}
                </ElTag>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <div class="status-badges">
              <ElTag v-if="row.isTop" type="warning" size="small">置顶</ElTag>
              <ElTag 
                :type="getStatusType(row.status)" 
                size="small"
              >
                {{ getStatusText(row.status) }}
              </ElTag>
              <ElTag v-if="row.isHidden && row.status === 'public'" type="info" size="small">
                隐藏
              </ElTag>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="互动数据" width="120">
          <template #default="{ row }">
            <div class="interaction-data">
              <div class="data-item">
                <ElIcon><View /></ElIcon>
                <span>{{ row.views || 0 }}</span>
              </div>
              <div class="data-item">
                <ElIcon><Star /></ElIcon>
                <span>{{ row.likes || 0 }}</span>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="发布时间" width="180">
          <template #default="{ row }">
            <div class="time-info">
              <div>{{ formatDate(row.publishDate) }}</div>
              <div v-if="row.updateDate !== row.publishDate" class="update-time">
                更新: {{ formatDate(row.updateDate) }}
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <ElButton 
                type="primary" 
                size="small" 
                @click="editTalk(row)"
                :disabled="row.status === 'deleted'"
              >
                编辑
              </ElButton>
              
              <ElDropdown @command="(command) => handleAction(command, row)">
                <ElButton size="small">
                  更多<ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem 
                      v-if="row.status !== 'deleted'" 
                      :command="`top-${row._id}`"
                    >
                      {{ row.isTop ? '取消置顶' : '置顶' }}
                    </ElDropdownItem>
                    <ElDropdownItem 
                      v-if="row.status === 'public'" 
                      :command="`hide-${row._id}`"
                    >
                      {{ row.isHidden ? '显示' : '隐藏' }}
                    </ElDropdownItem>
                    <ElDropdownItem 
                      v-if="row.status !== 'deleted'" 
                      :command="`delete-${row._id}`"
                      divided
                    >
                      删除
                    </ElDropdownItem>
                    <ElDropdownItem 
                      v-if="row.status === 'deleted'" 
                      :command="`restore-${row._id}`"
                    >
                      恢复
                    </ElDropdownItem>
                    <ElDropdownItem 
                      v-if="row.status === 'deleted'" 
                      :command="`permanent-delete-${row._id}`"
                      divided
                    >
                      永久删除
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div class="pagination-container">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Plus, 
  View, 
  Star, 
  ArrowDown 
} from '@element-plus/icons-vue'
import { useTable } from '@/composables/useTable'
import { getTalkList, deleteTalk, updateTalk, batchOperateTalks, restoreTalk as restoreTalkAPI } from '@/api/talks'
import { formatDate } from '@shared/utils/user'

// 路由
const router = useRouter()

// 搜索和筛选
const searchVal = ref('')
const currentStatus = ref('all')

// 状态选项
const statusOptions = [
  { label: '全部说说', value: 'all' },
  { label: '公开说说', value: 'public' },
  { label: '私密说说', value: 'private' },
  { label: '回收站', value: 'deleted' }
]

// 批量操作
const selectedTalks = ref<any[]>([])
const batchLoading = ref(false)

// 计算API参数的函数
const getApiParams = () => {
  const params: any = {}
  
  // 只有当状态不是'all'时才添加status参数
  if (currentStatus.value && currentStatus.value !== 'all') {
    params.status = currentStatus.value
  }
  
  // 只有当搜索关键词不为空时才添加keyword参数
  if (searchVal.value && searchVal.value.trim()) {
    params.keyword = searchVal.value.trim()
  }
  
  console.log('🔍 后台管理系统API参数:', params)
  console.log('🔍 当前状态值:', currentStatus.value)
  return params
}

// 表格配置
const tableConfig = {
  core: {
    apiFn: getTalkList,
    immediate: true,
    paginationKey: {
      current: 'page',
      size: 'limit'
    }
  },
  performance: {
    enableCache: false,
    cacheTime: 2 * 60 * 1000 // 2分钟缓存
  },
  transform: {
    responseAdapter: (response: any) => {
      // 适配后端返回的数据结构
      console.log('📥 后台管理系统表格配置响应数据:', response)
      
      // 处理getTalkList API返回的数据结构
      // getTalkList返回的是 {talks: [...], total, page, limit}
      if (response && response.talks) {
        console.log('📊 后台管理系统收到talks格式数据:', response.talks.length, '条记录')
        console.log('📊 talks数据详情:', response.talks.slice(0, 2)) // 只显示前2条数据
        return {
          records: response.talks,
          current: response.page || 1,
          size: response.limit || 10,
          total: response.total || 0
        }
      }
      
      // 如果是原始后端响应格式 {records: [...], total, current, size}
      if (response && response.records) {
        console.log('📊 后台管理系统收到records格式数据:', response.records.length, '条记录')
        return {
          records: response.records,
          current: response.current || 1,
          size: response.size || 10,
          total: response.total || 0
        }
      }
      
      console.warn('⚠️ 后台管理系统未知响应格式:', response)
      return {
        records: [],
        current: 1,
        size: 10,
        total: 0
      }
    }
  }
}

// 使用表格Hook
const {
  data: talkList,
  loading: isLoading,
  pagination,
  searchParams,
  getData: getTalkListData,
  refreshData: refreshTalkList,  // 使用正确的刷新方法名
  refreshUpdate,  // 添加更新后刷新方法
  refreshRemove,   // 添加删除后刷新方法
  handleSizeChange: useTableHandleSizeChange,  // 获取 useTable 的分页处理方法
  handleCurrentChange: useTableHandleCurrentChange  // 获取 useTable 的分页处理方法
} = useTable(tableConfig)

// 分页相关
const currentPage = computed({
  get: () => pagination.current,
  set: (val) => {
    pagination.current = val
    getTalkListData()
  }
})

const pageSize = computed({
  get: () => pagination.size,
  set: (val) => {
    pagination.size = val
    getTalkListData()
  }
})

const total = computed(() => pagination.total)

// 格式化内容
const formatContent = (content: string) => {
  if (!content) return ''
  // 简单的文本格式化，保留换行
  return content.replace(/\n/g, '<br>')
}
  
  // 获取状态类型
const getStatusType = (status: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const typeMap: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    public: 'success',
    private: 'warning',
    deleted: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    public: '公开',
    private: '私密',
    deleted: '已删除'
  }
  return textMap[status] || status
}

// 更新搜索参数的辅助函数
const updateSearchParams = () => {
  const params = getApiParams()
  console.log('🔄 更新搜索参数:', params)
  
  // 清空现有的搜索参数（保留分页参数）
  Object.keys(searchParams).forEach(key => {
    if (key !== 'page' && key !== 'limit') {
      delete searchParams[key]
    }
  })
  
  // 添加新的搜索参数
  Object.assign(searchParams, params)
  console.log('🔄 更新后的searchParams:', { ...searchParams })
}

// 搜索功能
const searchTalk = () => {
  updateSearchParams()
  refreshTalkList()
}

const onSearchClear = () => {
  updateSearchParams()
  refreshTalkList()
}

const onSearchInput = (value: string) => {
  if (!value.trim()) {
    updateSearchParams()
    refreshTalkList()
  }
}

// 状态切换
const handleStatusChange = (status: string) => {
  console.log('🔄 状态切换:', status)
  currentStatus.value = status
  selectedTalks.value = []
  // 更新搜索参数并刷新数据
  updateSearchParams()
  refreshTalkList() // 使用正确的刷新方法
}

// 重置筛选
const resetFilters = () => {
  searchVal.value = ''
  currentStatus.value = 'all'
  selectedTalks.value = []
  updateSearchParams()
  refreshCreate() // 使用refreshCreate回到第一页
}

// 分页处理
const handleSizeChange = async (size: number) => {
  console.log('🔄 分页大小变化:', size)
  // 更新搜索参数
  updateSearchParams()
  // 调用 useTable 提供的分页处理方法
  await useTableHandleSizeChange(size)
}

const handleCurrentChange = async (page: number) => {
  console.log('🔄 当前页变化:', page)
  // 更新搜索参数
  updateSearchParams()
  // 调用 useTable 提供的分页处理方法
  await useTableHandleCurrentChange(page)
}

// 选择处理
const handleSelectionChange = (selection: any[]) => {
  selectedTalks.value = selection
}

// 跳转到发表说说页面
const toPublishTalk = () => {
  router.push('/talk/publishtalk')
}

// 编辑说说
const editTalk = (talk: any) => {
  router.push({
    path: '/talk/publishtalk',
    query: { id: talk._id }
  })
}

// 操作处理
const handleAction = async (command: string, row: any) => {
  const [action, id] = command.split('-')
  
  try {
    switch (action) {
      case 'top':
        await toggleTop(row)
        break
      case 'hide':
        await toggleHide(row)
        break
      case 'delete':
        await deleteTalkItem(row)
        break
      case 'restore':
        await restoreTalk(row)
        break
      case 'permanent':
        await permanentDeleteTalk(row)
        break
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 置顶/取消置顶
const toggleTop = async (talk: any) => {
  const newTopStatus = !talk.isTop
  await updateTalk(talk._id, { isTop: newTopStatus })
  ElMessage.success(newTopStatus ? '置顶成功' : '取消置顶成功')
  updateSearchParams()
  refreshUpdate()
}

// 隐藏/显示
const toggleHide = async (talk: any) => {
  const newHideStatus = !talk.isHidden
  await updateTalk(talk._id, { isHidden: newHideStatus })
  ElMessage.success(newHideStatus ? '隐藏成功' : '显示成功')
  updateSearchParams()
  refreshUpdate()
}

// 删除说说（软删除，移动到回收站）
const deleteTalkItem = async (talk: any) => {
  await ElMessageBox.confirm(
    '确定要删除这条说说吗？删除后将移动到回收站，可以恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  try {
    // 软删除：更新状态为deleted，设置删除时间
    await updateTalk(talk._id, { 
      status: 'deleted', 
      deleteDate: new Date(),
      updateDate: new Date()
    })
    ElMessage.success('删除成功，已移动到回收站')
    updateSearchParams()
    refreshRemove()
  } catch (error) {
    console.error('软删除失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

// 恢复说说（从回收站恢复）
const restoreTalk = async (talk: any) => {
  try {
    await restoreTalkAPI(talk._id)
    ElMessage.success('恢复成功')
    updateSearchParams()
    refreshRemove()
  } catch (error) {
    console.error('恢复失败:', error)
    ElMessage.error('恢复失败，请重试')
  }
}

// 永久删除（从回收站彻底删除）
const permanentDeleteTalk = async (talk: any) => {
  await ElMessageBox.confirm(
    '确定要永久删除这条说说吗？此操作不可恢复！',
    '确认永久删除',
    {
      confirmButtonText: '永久删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  )
  
  try {
    // 物理删除：使用permanent=true参数
    await deleteTalk(talk._id, true)
    ElMessage.success('永久删除成功')
    updateSearchParams()
    refreshRemove()
  } catch (error) {
    console.error('永久删除失败:', error)
    ElMessage.error('永久删除失败，请重试')
  }
}

// 批量软删除（移动到回收站）
const batchDelete = async () => {
  if (selectedTalks.value.length === 0) {
    ElMessage.warning('请选择要删除的说说')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTalks.value.length} 条说说吗？删除后将移动到回收站，可以恢复。`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    batchLoading.value = true
    // 批量软删除：使用批量操作API
    const ids = selectedTalks.value.map(talk => talk._id)
    await batchOperateTalks({ 
      ids, 
      operation: 'delete'
    })
    ElMessage.success(`成功删除 ${selectedTalks.value.length} 条说说，已移动到回收站`)
    selectedTalks.value = []
    updateSearchParams()
    refreshRemove()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败，请重试')
    }
  } finally {
    batchLoading.value = false
  }
}

// 批量恢复（从回收站恢复）
const batchRestore = async () => {
  if (selectedTalks.value.length === 0) {
    ElMessage.warning('请选择要恢复的说说')
    return
  }

  try {
    batchLoading.value = true
    const ids = selectedTalks.value.map(talk => talk._id)
    await batchOperateTalks({ 
      ids, 
      operation: 'restore'
    })
    ElMessage.success(`成功恢复 ${selectedTalks.value.length} 条说说`)
    selectedTalks.value = []
    updateSearchParams()
    refreshRemove()
  } catch (error) {
    console.error('批量恢复失败:', error)
    ElMessage.error('批量恢复失败，请重试')
  } finally {
    batchLoading.value = false
  }
}

// 批量永久删除（从回收站彻底删除）
const batchPermanentDelete = async () => {
  if (selectedTalks.value.length === 0) {
    ElMessage.warning('请选择要永久删除的说说')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要永久删除选中的 ${selectedTalks.value.length} 条说说吗？此操作不可恢复！`,
      '批量永久删除',
      {
        confirmButtonText: '永久删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    batchLoading.value = true
    const ids = selectedTalks.value.map(talk => talk._id)
    await batchOperateTalks({ 
      ids, 
      operation: 'permanentDelete'
    })
    ElMessage.success(`成功永久删除 ${selectedTalks.value.length} 条说说`)
    selectedTalks.value = []
    updateSearchParams()
    refreshRemove()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量永久删除失败:', error)
      ElMessage.error('批量永久删除失败，请重试')
    }
  } finally {
    batchLoading.value = false
  }
}

const batchToggleTop = async () => {
  if (selectedTalks.value.length === 0) {
    ElMessage.warning('请选择要操作的说说')
    return
  }

  try {
    batchLoading.value = true
    const ids = selectedTalks.value.map(talk => talk._id)
    await batchOperateTalks({ 
      ids, 
      operation: 'toggleTop'
    })
    ElMessage.success('批量置顶操作成功')
    selectedTalks.value = []
    updateSearchParams()
    refreshUpdate()
  } catch (error) {
    console.error('批量置顶操作失败:', error)
    ElMessage.error('批量置顶操作失败')
  } finally {
    batchLoading.value = false
  }
}

const batchToggleHide = async () => {
  if (selectedTalks.value.length === 0) {
    ElMessage.warning('请选择要操作的说说')
    return
  }

  try {
    batchLoading.value = true
    const ids = selectedTalks.value.map(talk => talk._id)
    await batchOperateTalks({ 
      ids, 
      operation: 'toggleHide'
    })
    ElMessage.success('批量隐藏操作成功')
    selectedTalks.value = []
    updateSearchParams()
    refreshUpdate()
  } catch (error) {
    console.error('批量隐藏操作失败:', error)
    ElMessage.error('批量隐藏操作失败')
  } finally {
    batchLoading.value = false
  }
}

// 监听发表成功事件，刷新列表
const onTalkPublished = (event: Event) => {
  const detail = (event as CustomEvent).detail || {}
  currentPage.value = 1
  getTalkListData()
}

// 组件挂载
onMounted(() => {
  window.addEventListener('talkPublished', onTalkPublished as EventListener)
  updateSearchParams()
  getTalkListData()
})

onUnmounted(() => {
  window.removeEventListener('talkPublished', onTalkPublished as EventListener)
})
</script>

<style scoped lang="scss">
.page-content {
  padding: 20px;
}

.header-row {
  margin-bottom: 20px;
}

.status-tabs {
  display: flex;
  justify-content: center;
}

.batch-operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
  margin-bottom: 16px;

  .batch-info {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  .batch-actions {
    display: flex;
    gap: 8px;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.talk-list-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.talk-table {
  .talk-content {
    .content-text {
      margin-bottom: 8px;
      line-height: 1.5;
      max-height: 60px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .content-images {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
      position: relative;

      .content-image {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        cursor: pointer;
      }

      .more-images {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--el-color-info-light-8);
        border-radius: 4px;
        font-size: 12px;
        color: var(--el-color-info);
      }
    }

    .content-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      .tag-item {
        font-size: 12px;
      }
    }
  }

  .status-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .interaction-data {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .data-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }

  .time-info {
    font-size: 12px;

    .update-time {
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
}

// 响应式设计
@media (max-width: 768px) {
  .page-content {
    padding: 10px;
  }

  .header-row {
    .status-tabs {
      display: none;
    }
  }

  .batch-operation-bar {
    flex-direction: column;
    gap: 12px;
    text-align: center;

    .batch-actions {
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  .talk-table {
    .content-images {
      .content-image {
        width: 30px;
        height: 30px;
      }

      .more-images {
        width: 30px;
        height: 30px;
        font-size: 10px;
      }
    }

    .action-buttons {
      flex-direction: column;
      gap: 4px;
    }
  }
}
</style>
