<template>
  <div class="photo-category-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton @click="goBack" :icon="ArrowLeft">返回</ElButton>
        <div class="category-info">
          <h2>{{ categoryInfo?.name || '分类详情' }}</h2>
          <p class="subtitle">{{ categoryInfo?.description || '暂无描述' }}</p>
        </div>
      </div>
      <div class="header-right">
        <ElButton type="primary" @click="showUploadDialog = true">
          <ElIcon><Upload /></ElIcon>
          上传图片
        </ElButton>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <ElRow :gutter="16">
        <ElCol :span="8">
          <ElInput
            v-model="searchForm.keyword"
            placeholder="搜索图片名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <ElIcon><Search /></ElIcon>
            </template>
          </ElInput>
        </ElCol>
        <ElCol :span="6">
          <ElDatePicker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </ElCol>
        <ElCol :span="6">
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElCol>
      </ElRow>
    </div>

    <!-- 批量操作工具条 -->
    <div class="batch-toolbar" v-if="photoList.length > 0">
      <ElCheckbox :model-value="isAllSelected" @change="toggleSelectAll">
        {{ isAllSelected ? '取消全选' : '全选' }}
      </ElCheckbox>
      <ElButton type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        批量删除
      </ElButton>
      <span class="selected-count" v-if="selectedIds.length">已选 {{ selectedIds.length }} 张</span>
    </div>

    <!-- 图片网格展示 -->
    <div class="photo-grid" v-loading="loading">
      <div v-if="photoList.length === 0 && !loading" class="empty-state">
        <ElEmpty description="暂无图片" />
      </div>
      <div v-else class="grid-container">
        <div
          v-for="photo in photoList"
          :key="photo._id"
          class="photo-item"
          @click="handlePreview(photo)"
        >
          <div class="photo-wrapper">
            <!-- 选择复选框 -->
            <div class="select-box" @click.stop="toggleSelect(photo._id || photo.id)">
              <ElCheckbox :model-value="isSelected(photo._id || photo.id)" />
            </div>
            <img :src="photo.url" :alt="photo.name" class="photo-image" />
            <div class="photo-overlay">
              <div class="photo-actions">
                <ElButton
                  type="primary"
                  :icon="View"
                  circle
                  size="small"
                  @click.stop="handlePreview(photo)"
                />
                <ElButton
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click.stop="handleDelete(photo)"
                />
              </div>
            </div>
          </div>
          <div class="photo-info">
            <p class="photo-name" :title="photo.name">{{ photo.name }}</p>
            <p class="photo-date">{{ formatDate((photo.uploadDate || photo.createdAt || photo.updatedAt) as string) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="photoList.length > 0">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 上传图片对话框 -->
    <ElDialog
      v-model="showUploadDialog"
      title="上传图片"
      width="600px"
      @close="handleUploadDialogClose"
    >
      <ElUpload
        ref="uploadRef"
        class="upload-demo"
        drag
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        multiple
        v-model:file-list="fileList"
        list-type="picture-card"
        :on-change="handleFileChange"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-remove="handleRemove"
        :before-upload="beforeUpload"
        accept="image/*"
        name="file"
      >
        <ElIcon class="el-icon--upload"><UploadFilled /></ElIcon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 jpg/png/gif/webp 格式，单个文件不超过 10MB
          </div>
        </template>
      </ElUpload>
      <template #footer>
        <ElButton @click="showUploadDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleUploadConfirm" :loading="uploadLoading">
          确认上传
        </ElButton>
      </template>
    </ElDialog>

    <!-- 图片预览对话框 -->
    <ElDialog
      v-model="showPreviewDialog"
      title="图片预览"
      width="80%"
      @close="handlePreviewDialogClose"
    >
      <div v-if="currentPhoto" class="preview-container">
        <div class="preview-image">
          <img :src="currentPhoto.url" :alt="currentPhoto.name" />
        </div>
        <div class="preview-info">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="图片名称">{{ currentPhoto.name }}</ElDescriptionsItem>
            <ElDescriptionsItem label="文件大小">{{ formatFileSize(currentPhoto.size || 0) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="图片尺寸">{{ currentPhoto.width }} × {{ currentPhoto.height }}</ElDescriptionsItem>
            <ElDescriptionsItem label="上传时间">{{ formatDate((currentPhoto.uploadDate || currentPhoto.createdAt || currentPhoto.updatedAt) as string) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="图片URL" :span="2">
              <ElInput v-model="currentPhoto.url" readonly>
                <template #append>
                  <ElButton @click="copyUrl(currentPhoto.url || '')">复制</ElButton>
                </template>
              </ElInput>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type UploadUserFile, type UploadFile, type UploadFiles } from 'element-plus'
import {
  ArrowLeft,
  Upload,
  Search,
  View,
  Delete,
  UploadFilled
} from '@element-plus/icons-vue'
import { getPhotoCategoryDetail, type PhotoCategoryItem } from '@/api/photoCategories'
import {
  getPhotosByCategory,
  deletePhoto,
  createPhoto
} from '@/api/photos'
// 批量删除 API 引入
// import { batchDeletePhotos } from '@/api/photos'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@shared/utils/user'

defineOptions({ name: 'PhotoCategoryDetail' })

interface PhotoSearchParams {
  keyword?: string
  dateRange?: [string, string] | undefined
  categoryId?: string
  page?: number
  size?: number
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const uploadLoading = ref(false)
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const uploadRef = ref()

// 分类信息
const categoryInfo = ref<PhotoCategoryItem | null>(null)
const categoryId = computed(() => route.params.id as string)

// 图片列表数据
const photoList = ref<PhotoItem[]>([])
const currentPhoto = ref<PhotoItem | null>(null)

// 多选与批量删除：选中状态与工具方法
const selectedIds = ref<string[]>([])
interface PhotoItem {
  _id?: string
  id?: string | number
  url?: string
  imageUrl?: string
  name?: string
  title?: string
  createdAt?: string
  uploadDate?: string
  updatedAt?: string
  createTime?: string
  size?: number
  width?: number
  height?: number
}

const getPhotoId = (p: PhotoItem) => {
  const id = p?._id ?? p?.id
  return typeof id === 'string' ? id : id?.toString?.() ?? ''
}
const isSelected = (id?: string | number) => {
  if (id == null) return false
  const sid = id.toString()
  return selectedIds.value.includes(sid)
}
const toggleSelect = (id?: string | number) => {
  if (id == null) return
  const sid = id.toString()
  const idx = selectedIds.value.indexOf(sid)
  if (idx === -1) selectedIds.value.push(sid)
  else selectedIds.value.splice(idx, 1)
}
const isAllSelected = computed(() => {
  if (!photoList.value.length) return false
  const allIds = photoList.value.map(getPhotoId).filter(Boolean)
  return allIds.length > 0 && allIds.every((id) => selectedIds.value.includes(id))
})
const toggleSelectAll = (val: unknown) => {
  const checked = !!val
  if (checked) {
    const allIds = photoList.value.map(getPhotoId).filter(Boolean)
    selectedIds.value = Array.from(new Set(allIds))
  } else {
    selectedIds.value = []
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 张图片吗？`, '批量删除确认', {
      type: 'warning'
    })

    loading.value = true
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map((id) => deletePhoto(id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.length - successCount

    if (successCount > 0) {
      ElMessage.success(failCount > 0 ? `已删除 ${successCount} 张，失败 ${failCount} 张` : '批量删除成功')
    }
    if (failCount > 0 && successCount === 0) {
      ElMessage.error('批量删除失败')
    }

    selectedIds.value = []
    await loadPhotoList()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      const msg = (error as any)?.msg || (error as any)?.message || '批量删除失败'
      ElMessage.error(msg)
    }
  } finally {
    loading.value = false
  }
}

// 将后端字段标准化为前端使用的字段
const normalizePhoto = (p: Record<string, any>): PhotoItem => ({
  ...(p as any),
  url: (p as any).url || (p as any).imageUrl || '',
  name: (p as any).name || (p as any).title || '未命名',
  // 同步统一时间字段，确保前端展示/排序一致
  createdAt: (p as any).createdAt || (p as any).uploadDate || (p as any).updatedAt || (p as any).createTime || ''
})

// 搜索表单
const searchForm = reactive<PhotoSearchParams>({
  keyword: '',
  dateRange: undefined
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// 上传相关
const fileList = ref<UploadUserFile[]>([])
const uploadAction = computed(() => `/api/uploads`)
const uploadHeaders = computed(() => (userStore.accessToken ? { Authorization: userStore.accessToken } : {}))
const uploadData = computed(() => ({
  categoryId: categoryId.value
}))

onMounted(() => {
  loadCategoryInfo()
  loadPhotoList()
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载分类信息
const loadCategoryInfo = async () => {
  try {
    const detail = await getPhotoCategoryDetail(categoryId.value)
    if (detail) {
      categoryInfo.value = detail as PhotoCategoryItem
    }
  } catch (error) {
    console.error('加载分类信息失败:', error)
    ElMessage.error('加载分类信息失败')
  }
}

// 加载图片列表
const loadPhotoList = async () => {
  loading.value = true
  try {
    const params: PhotoSearchParams = {
      page: pagination.currentPage,
      size: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      ...(searchForm.dateRange && {
        startDate: searchForm.dateRange[0],
        endDate: searchForm.dateRange[1]
      })
    }

    console.log('请求图片列表参数:', params)
    const response = await getPhotosByCategory(categoryId.value, params)
    console.log('图片列表响应:', response)

    // 处理不同的响应格式
    if (response && typeof response === 'object') {
      // 检查是否是分页响应格式
      if (response && typeof response === 'object' && 'photos' in response && Array.isArray((response as any).photos)) {
      photoList.value = ((response as any).photos as Record<string, any>[]).map(normalizePhoto)
      pagination.total = (response as any).total || (response as any).photos.length
      console.log('使用分页响应格式，图片数量:', (response as any).photos.length)
    } else if (Array.isArray(response)) {
      photoList.value = (response as Record<string, any>[]).map(normalizePhoto)
      pagination.total = response.length
      console.log('使用数组响应格式，图片数量:', response.length)
      }
    } else {
      photoList.value = []
      pagination.total = 0
    }

    // 同步勾选状态（新列表中不存在的已选项自动移除）
    const validIds = new Set(photoList.value.map((p: PhotoItem) => p._id || p.id).filter(Boolean))
    selectedIds.value = selectedIds.value.filter((id) => validIds.has(id))
  } catch (error) {
    console.error('加载图片列表失败:', error)
    ElMessage.error('加载图片列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadPhotoList()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.dateRange = undefined
  handleSearch()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadPhotoList()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadPhotoList()
}

// 图片预览
const handlePreview = (photo: PhotoItem) => {
  currentPhoto.value = photo
  showPreviewDialog.value = true
}

const handlePreviewDialogClose = () => {
  currentPhoto.value = null
}

// 删除图片
const handleDelete = async (photo: PhotoItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除图片「${photo.name}」吗？`, '删除确认', {
      type: 'warning'
    })

    const photoId = photo._id || photo.id
    if (!photoId) {
      ElMessage.error('图片ID不存在')
      return
    }

    await deletePhoto(photoId.toString())
    ElMessage.success('删除成功')
    loadPhotoList()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除图片失败:', error)
      const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '删除失败'
        ElMessage.error(errorMsg)
    }
  }
}

// 上传相关方法
const handleUploadDialogClose = () => {
  fileList.value = []
  try { (uploadRef.value as any)?.clearFiles?.() } catch {}
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleFileChange = (_uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  // 与 v-model:file-list 同步（ElUpload 内部使用 UploadUserFile，做一次兼容转换）
  fileList.value = (uploadFiles as unknown) as UploadUserFile[]
}

const handleUploadSuccess = (response: any, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  // 为上传文件设置可预览的 url（不同后端字段做兼容）
  const url = response?.url || response?.data?.url || response?.file?.url
  if (url) {
    uploadFile.url = url
  }
  fileList.value = (uploadFiles as unknown) as UploadUserFile[]
  ElMessage.success(`${uploadFile.name} 上传成功!`)
}

const handleUploadError = (error: Error, uploadFile: UploadFile, _uploadFiles: UploadFiles) => {
  console.error('上传失败:', error)
  ElMessage.error(`${uploadFile.name} 上传失败!`)
}

const handleRemove = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  console.log('移除文件:', uploadFile)
  fileList.value = (uploadFiles as unknown) as UploadUserFile[]
}

const handleUploadConfirm = async () => {
  // 仅统计已成功上传到 /api/uploads 的文件
  const successFiles = fileList.value.filter((f) => f.status === 'success' && (f.url || (f.response as any)?.url || (f.response as any)?.data?.url))
  if (successFiles.length === 0) {
    ElMessage.warning('请先选择并上传图片')
    return
  }

  uploadLoading.value = true
  try {
    const tasks = successFiles.map((f) => {
      const imageUrl = (f.url || (f.response as any)?.url || (f.response as any)?.data?.url) as string
      const title = f.name || (f.raw as any)?.name || '未命名'
      // 以“上传成功回调”的当下时间作为 uploadDate（若后端也返回了时间则优先使用）
      const uploadDate = (f.response as any)?.uploadDate || (f.response as any)?.data?.uploadDate || new Date().toISOString()
      return createPhoto({
        categoryId: categoryId.value,
        title,
        imageUrl,
        uploadDate
      })
    })

    await Promise.all(tasks)

    ElMessage.success('上传并创建记录成功')
    showUploadDialog.value = false
    fileList.value = []
    loadPhotoList()
  } catch (error: any) {
    console.error('创建照片记录失败:', error)
    const errorMsg = error && typeof error === 'object' && 'msg' in error ? (error as any).msg : '创建照片记录失败'
        ElMessage.error(errorMsg)
  } finally {
    uploadLoading.value = false
  }
}
  
  const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('URL已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.photo-category-detail {
  padding: 20px;
  // background: #f5f5f5;
  min-height: calc(100vh - 60px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    // background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .category-info {
        h2 {
          margin: 0;
          // color: #303133;
          font-size: 24px;
        }

        .subtitle {
          margin: 4px 0 0 0;
          // color: #909399;
          font-size: 14px;
        }
      }
    }
  }

  .search-bar {
    margin-bottom: 20px;
    padding: 20px;
    // background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* 合并批量工具条样式 */
  .batch-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0 0 0;
    padding: 0 20px 12px 20px;
  }
  .selected-count {
    color: #909399;
  }

  .photo-grid {
    // background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    min-height: 400px;

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .photo-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);

        .photo-overlay {
          opacity: 1;
        }
      }

      .photo-wrapper {
        position: relative;
        height: 200px;
        overflow: hidden;

        /* 合并选择框样式 */
        .select-box {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 3;
          border-radius: 4px;
          padding: 2px 4px;
        }

        .photo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .photo-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;

          .photo-actions {
            display: flex;
            gap: 10px;
          }
        }
      }

      .photo-info {
        padding: 12px;

        .photo-name {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .photo-date {
          margin: 0;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .upload-demo {
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 200px;
    }
  }

  .preview-container {
    .preview-image {
      text-align: center;
      margin-bottom: 20px;

      img {
        max-width: 100%;
        max-height: 60vh;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .preview-info {
      :deep(.el-descriptions__body) {
        background: #fafafa;
      }
    }
  }
}
</style>