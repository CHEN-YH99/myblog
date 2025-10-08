<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :show-file-list="false"
      :on-success="handleAvatarSuccess"
      :on-error="handleAvatarError"
      :before-upload="beforeAvatarUpload"
      :on-progress="handleProgress"
    >
      <div class="avatar-container" @click="handleClick">
        <el-image
          v-if="avatarUrl"
          :src="avatarUrl"
          class="avatar"
          fit="cover"
          :preview-src-list="[avatarUrl]"
          :preview-teleported="true"
        />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        
        <!-- 上传进度遮罩 -->
        <div v-if="uploading" class="upload-overlay">
          <el-progress
            type="circle"
            :percentage="uploadProgress"
            :width="60"
            :stroke-width="4"
            color="#409eff"
          />
        </div>
        
        <!-- 悬停遮罩 -->
        <div class="hover-overlay">
          <el-icon><Camera /></el-icon>
          <span>更换头像</span>
        </div>
      </div>
    </el-upload>
    
    <!-- 裁剪弹窗 -->
    <el-dialog
      v-model="cropDialogVisible"
      title="裁剪头像"
      width="600px"
      :before-close="handleCropClose"
    >
      <div class="crop-container">
        <div class="crop-area">
          <img
            ref="cropImage"
            :src="originalImageUrl"
            alt="待裁剪图片"
            style="max-width: 100%; display: block;"
          />
        </div>
        <div class="crop-preview">
          <div class="preview-title">预览</div>
          <div class="preview-item">
            <div class="preview-box preview-large"></div>
            <span>150x150</span>
          </div>
          <div class="preview-item">
            <div class="preview-box preview-medium"></div>
            <span>80x80</span>
          </div>
          <div class="preview-item">
            <div class="preview-box preview-small"></div>
            <span>40x40</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="handleCropClose">取消</el-button>
        <el-button type="primary" :loading="cropLoading" @click="handleCropConfirm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { ElMessage, type UploadProps } from 'element-plus'
import { Plus, Camera } from '@element-plus/icons-vue'
import Cropper from 'cropperjs'

interface Props {
  modelValue?: string
  size?: number
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 120,
  disabled: false
})

const emit = defineEmits<Emits>()

// 上传相关
const uploadUrl = computed(() => '/api/upload/avatar')
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
}))

// 状态管理
const uploading = ref(false)
const uploadProgress = ref(0)
const cropDialogVisible = ref(false)
const cropLoading = ref(false)
const originalImageUrl = ref('')

// 头像URL
const avatarUrl = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

// 裁剪相关
const cropImage = ref<HTMLImageElement>()
let cropper: Cropper | null = null

// 点击上传
const handleClick = () => {
  if (props.disabled) return
}

// 上传前验证
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 检查文件类型
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(rawFile.type)
  if (!isImage) {
    ElMessage.error('头像只能是 JPG、PNG、GIF、WebP 格式!')
    return false
  }

  // 检查文件大小 (5MB)
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('头像大小不能超过 5MB!')
    return false
  }

  // 显示裁剪弹窗
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImageUrl.value = e.target?.result as string
    cropDialogVisible.value = true
    
    nextTick(() => {
      initCropper()
    })
  }
  reader.readAsDataURL(rawFile)

  return false // 阻止自动上传
}

// 初始化裁剪器
const initCropper = () => {
  if (!cropImage.value) return

  cropper = new Cropper(cropImage.value, {
    aspectRatio: 1, // 1:1 比例
    viewMode: 2,
    dragMode: 'move',
    autoCropArea: 0.8,
    restore: false,
    guides: false,
    center: false,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    preview: '.preview-box',
    ready() {
      // 裁剪器准备就绪
    },
    crop() {
      // 裁剪时更新预览
    }
  })
}

// 销毁裁剪器
const destroyCropper = () => {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
}

// 关闭裁剪弹窗
const handleCropClose = () => {
  cropDialogVisible.value = false
  destroyCropper()
  originalImageUrl.value = ''
}

// 确认裁剪
const handleCropConfirm = async () => {
  if (!cropper) return

  cropLoading.value = true
  
  try {
    // 获取裁剪后的canvas
    const canvas = cropper.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    })

    // 转换为blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/jpeg', 0.9)
    })

    // 创建FormData并上传
    const formData = new FormData()
    formData.append('file', blob, 'avatar.jpg')

    uploading.value = true
    uploadProgress.value = 0

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 100)

    // 实际上传请求
    const response = await fetch(uploadUrl.value, {
      method: 'POST',
      headers: uploadHeaders.value,
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const result = await response.json()
    
    // 更新头像URL
    avatarUrl.value = result.url
    
    ElMessage.success('头像更新成功')
    handleCropClose()

  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('头像上传失败，请重试')
  } finally {
    cropLoading.value = false
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 上传成功回调
const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  avatarUrl.value = response.url
  ElMessage.success('头像更新成功')
}

// 上传失败回调
const handleAvatarError: UploadProps['onError'] = () => {
  ElMessage.error('头像上传失败，请重试')
  uploading.value = false
  uploadProgress.value = 0
}

// 上传进度回调
const handleProgress: UploadProps['onProgress'] = (event) => {
  uploadProgress.value = Math.round(event.percent || 0)
}

// 组件卸载时清理
onUnmounted(() => {
  destroyCropper()
})
</script>

<style lang="scss" scoped>
.avatar-upload {
  display: inline-block;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: none;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.avatar-container {
  position: relative;
  width: v-bind("`${props.size}px`");
  height: v-bind("`${props.size}px`");
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #dcdfe6;
  transition: all 0.3s ease;

  &:hover {
    border-color: #409eff;
    
    .hover-overlay {
      opacity: 1;
    }
  }
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;

  .el-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  span {
    font-size: 12px;
  }
}

.crop-container {
  display: flex;
  gap: 20px;
  height: 400px;
}

.crop-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.crop-preview {
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .preview-title {
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    span {
      font-size: 12px;
      color: #909399;
    }
  }

  .preview-box {
    border: 1px solid #dcdfe6;
    border-radius: 50%;
    overflow: hidden;
    background-color: #fff;

    &.preview-large {
      width: 80px;
      height: 80px;
    }

    &.preview-medium {
      width: 50px;
      height: 50px;
    }

    &.preview-small {
      width: 30px;
      height: 30px;
    }
  }
}

// 禁用状态
.avatar-upload.disabled {
  .avatar-container {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      transform: none;
      border-color: #dcdfe6;

      .hover-overlay {
        opacity: 0;
      }
    }
  }
}

// Cropper.js 样式
:deep(.cropper-container) {
  direction: ltr;
  font-size: 0;
  line-height: 0;
  position: relative;
  -ms-touch-action: none;
  touch-action: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

:deep(.cropper-container img) {
  display: block;
  height: 100%;
  image-orientation: 0deg;
  max-height: none;
  max-width: none;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

:deep(.cropper-wrap-box),
:deep(.cropper-canvas),
:deep(.cropper-drag-box),
:deep(.cropper-crop-box),
:deep(.cropper-modal) {
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

:deep(.cropper-wrap-box),
:deep(.cropper-canvas) {
  overflow: hidden;
}

:deep(.cropper-drag-box) {
  background-color: #fff;
  opacity: 0;
}

:deep(.cropper-modal) {
  background-color: #000;
  opacity: 0.5;
}

:deep(.cropper-view-box) {
  display: block;
  height: 100%;
  outline: 1px solid #39f;
  outline-color: rgba(51, 153, 255, 0.75);
  overflow: hidden;
  width: 100%;
}

:deep(.cropper-dashed) {
  border: 0 dashed #eee;
  display: block;
  opacity: 0.5;
  position: absolute;
}

:deep(.cropper-dashed.dashed-h) {
  border-bottom-width: 1px;
  border-top-width: 1px;
  height: calc(100% / 3);
  left: 0;
  top: calc(100% / 3);
  width: 100%;
}

:deep(.cropper-dashed.dashed-v) {
  border-left-width: 1px;
  border-right-width: 1px;
  height: 100%;
  left: calc(100% / 3);
  top: 0;
  width: calc(100% / 3);
}

:deep(.cropper-center) {
  display: block;
  height: 0;
  left: 50%;
  opacity: 0.75;
  position: absolute;
  top: 50%;
  width: 0;
}

:deep(.cropper-center::before),
:deep(.cropper-center::after) {
  background-color: #eee;
  content: ' ';
  display: block;
  position: absolute;
}

:deep(.cropper-center::before) {
  height: 1px;
  left: -3px;
  top: 0;
  width: 7px;
}

:deep(.cropper-center::after) {
  height: 7px;
  left: 0;
  top: -3px;
  width: 1px;
}

:deep(.cropper-face),
:deep(.cropper-line),
:deep(.cropper-point) {
  display: block;
  height: 100%;
  opacity: 0.1;
  position: absolute;
  width: 100%;
}

:deep(.cropper-face) {
  background-color: #fff;
  left: 0;
  top: 0;
}

:deep(.cropper-line) {
  background-color: #39f;
}

:deep(.cropper-line.line-e) {
  cursor: ew-resize;
  right: -3px;
  top: 0;
  width: 5px;
}

:deep(.cropper-line.line-n) {
  cursor: ns-resize;
  height: 5px;
  left: 0;
  top: -3px;
}

:deep(.cropper-line.line-w) {
  cursor: ew-resize;
  left: -3px;
  top: 0;
  width: 5px;
}

:deep(.cropper-line.line-s) {
  bottom: -3px;
  cursor: ns-resize;
  height: 5px;
  left: 0;
}

:deep(.cropper-point) {
  background-color: #39f;
  height: 5px;
  opacity: 0.75;
  width: 5px;
}

:deep(.cropper-point.point-e) {
  cursor: ew-resize;
  margin-top: -3px;
  right: -3px;
  top: 50%;
}

:deep(.cropper-point.point-n) {
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
  top: -3px;
}

:deep(.cropper-point.point-w) {
  cursor: ew-resize;
  left: -3px;
  margin-top: -3px;
  top: 50%;
}

:deep(.cropper-point.point-s) {
  bottom: -3px;
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
}

:deep(.cropper-point.point-ne) {
  cursor: nesw-resize;
  right: -3px;
  top: -3px;
}

:deep(.cropper-point.point-nw) {
  cursor: nwse-resize;
  left: -3px;
  top: -3px;
}

:deep(.cropper-point.point-sw) {
  bottom: -3px;
  cursor: nesw-resize;
  left: -3px;
}

:deep(.cropper-point.point-se) {
  bottom: -3px;
  cursor: nwse-resize;
  right: -3px;
}

:deep(.cropper-point.point-se::before) {
  background-color: #39f;
  bottom: -50%;
  content: ' ';
  display: block;
  height: 200%;
  opacity: 1;
  position: absolute;
  right: -50%;
  width: 200%;
}

:deep(.cropper-invisible) {
  opacity: 0;
}

:deep(.cropper-bg) {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAABFJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC');
}

:deep(.cropper-hide) {
  display: block;
  height: 0;
  position: absolute;
  width: 0;
}

:deep(.cropper-hidden) {
  display: none !important;
}

:deep(.cropper-move) {
  cursor: move;
}

:deep(.cropper-crop) {
  cursor: crosshair;
}

:deep(.cropper-disabled .cropper-drag-box),
:deep(.cropper-disabled .cropper-face),
:deep(.cropper-disabled .cropper-line),
:deep(.cropper-disabled .cropper-point) {
  cursor: not-allowed;
}
</style>