<template>
  <div class="image-uploader">
    <!-- 输入方式选择 -->
    <div class="input-mode-selector">
      <ElRadioGroup v-model="inputMode" size="small">
        <ElRadioButton value="upload">上传图片</ElRadioButton>
        <ElRadioButton value="url">URL链接</ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- URL输入模式 -->
    <div v-if="inputMode === 'url'" class="url-input-section">
      <ElInput
        v-model="urlValue"
        placeholder="请输入图片URL链接"
        clearable
        @input="handleUrlInput"
      >
        <template #prefix>
          <ElIcon><Link /></ElIcon>
        </template>
      </ElInput>
    </div>

    <!-- 图片上传模式 -->
    <div v-else class="upload-section">
      <ElUpload
        ref="uploadRef"
        class="image-upload"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
        accept="image/*"
        name="file"
        drag
      >
        <div v-if="!imageUrl && !uploading" class="upload-placeholder">
          <ElIcon class="upload-icon"><Plus /></ElIcon>
          <div class="upload-text">点击或拖拽上传图片</div>
          <div class="upload-hint">支持 JPG、PNG、GIF 格式，大小不超过 2MB</div>
        </div>
        
        <div v-else-if="uploading" class="upload-progress">
          <ElProgress
            type="circle"
            :percentage="uploadProgress"
            :width="80"
          />
          <div class="progress-text">上传中...</div>
        </div>
        
        <div v-else class="image-preview">
          <img :src="imageUrl" alt="预览图片" />
          <div class="image-overlay">
            <ElIcon class="overlay-icon" @click.stop="handleReUpload"><RefreshRight /></ElIcon>
            <ElIcon class="overlay-icon" @click.stop="handleRemove"><Delete /></ElIcon>
          </div>
        </div>
      </ElUpload>
    </div>

    <!-- 图片预览（URL模式） -->
    <div v-if="inputMode === 'url' && urlValue" class="url-preview">
      <div class="preview-container">
        <img 
          :src="urlValue" 
          alt="URL预览图片" 
          @load="handleUrlImageLoad"
          @error="handleUrlImageError"
        />
        <div v-if="urlError" class="url-error">
          <ElIcon><Warning /></ElIcon>
          <span>图片加载失败，请检查URL是否正确</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Link, RefreshRight, Delete, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'

interface Props {
  modelValue?: string
  categoryId?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  categoryId: '',
  disabled: false
})

const emit = defineEmits<Emits>()

// 获取用户store
const userStore = useUserStore()

// 响应式数据
const inputMode = ref<'upload' | 'url'>('upload')
const urlValue = ref('')
const imageUrl = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const urlError = ref(false)
const uploadRef = ref()

// 计算属性
const uploadAction = computed(() => {
  // 使用相对路径，与文章发布页面保持一致
  return '/api/uploads'
})

const uploadHeaders = computed(() => {
  const token = userStore.accessToken
  return token ? { Authorization: token } : {}
})

const uploadData = computed(() => {
  return {
    categoryId: props.categoryId || 'default'
  }
})

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 判断是URL还是上传的图片
    if (newValue.startsWith('http')) {
      inputMode.value = 'url'
      urlValue.value = newValue
    } else {
      inputMode.value = 'upload'
      imageUrl.value = newValue
    }
  } else {
    urlValue.value = ''
    imageUrl.value = ''
  }
}, { immediate: true })

// URL输入处理
const handleUrlInput = (value: string) => {
  urlError.value = false
  emit('update:modelValue', value)
}

// URL图片加载成功
const handleUrlImageLoad = () => {
  urlError.value = false
}

// URL图片加载失败
const handleUrlImageError = () => {
  urlError.value = true
}

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }

  uploading.value = true
  uploadProgress.value = 0
  return true
}

// 上传进度
const handleUploadProgress = (event: any) => {
  uploadProgress.value = Math.round(event.percent)
}

// 上传成功
const handleUploadSuccess = (response: any) => {
  uploading.value = false
  uploadProgress.value = 0
  
  // 兼容后端统一响应格式 { code, data: { url: string }, message }
  const url = response?.url || response?.data?.url || response?.file?.url
  if (url) {
    imageUrl.value = url
    emit('update:modelValue', url)
    ElMessage.success('图片上传成功!')
  } else {
    console.error('上传响应解析失败:', response)
    ElMessage.error('上传失败，服务器响应异常')
  }
}

// 上传失败
const handleUploadError = (error: any) => {
  uploading.value = false
  uploadProgress.value = 0
  console.error('图片上传失败:', error)
  const msg = error?.message || error?.msg || error?.response?.data?.message || '图片上传失败!'
  ElMessage.error(msg)
}

// 重新上传
const handleReUpload = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
  uploadRef.value?.clearFiles()
}

// 移除图片
const handleRemove = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
  uploadRef.value?.clearFiles()
}
</script>

<style scoped lang="scss">
.image-uploader {
  width: 100%;

  .input-mode-selector {
    margin-bottom: 12px;
  }

  .url-input-section {
    margin-bottom: 12px;
  }

  .upload-section {
    .image-upload {
      width: 100%;

      :deep(.el-upload) {
        width: 100%;
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--el-transition-duration-fast);

        &:hover {
          border-color: var(--el-color-primary);
        }
      }

      :deep(.el-upload-dragger) {
        width: 100%;
        height: 120px;
        background-color: var(--el-fill-color-lighter);
        border: none;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 120px;

      .upload-icon {
        font-size: 28px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      .upload-text {
        color: var(--el-text-color-regular);
        font-size: 14px;
        margin-bottom: 4px;
      }

      .upload-hint {
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }

    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 120px;

      .progress-text {
        margin-top: 8px;
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }

    .image-preview {
      position: relative;
      width: 100%;
      height: 120px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        opacity: 0;
        transition: opacity 0.3s;
        border-radius: 6px;

        .overlay-icon {
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.3s;

          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }
        }
      }

      &:hover .image-overlay {
        opacity: 1;
      }
    }
  }

  .url-preview {
    margin-top: 12px;

    .preview-container {
      position: relative;
      width: 100%;
      max-width: 200px;
      height: 120px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .url-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--el-fill-color-lighter);
        color: var(--el-color-danger);
        font-size: 12px;
        text-align: center;
        padding: 8px;

        .el-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
      }
    }
  }
}
</style>