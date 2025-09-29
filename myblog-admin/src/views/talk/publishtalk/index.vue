<template>
  <div class="publish-talk-page">
    <div class="page-header">
      <div class="header-left">
        <ElButton @click="goBack" :icon="ArrowLeft">返回</ElButton>
        <h1 class="page-title">{{ isEdit ? '编辑说说' : '发表说说' }}</h1>
      </div>
      <div class="header-right">
        <ElButton v-if="!isEdit" @click="loadDraft" :loading="draftLoading">加载草稿</ElButton>
        <ElButton @click="saveDraft" :loading="draftLoading">保存草稿</ElButton>
        <ElButton type="primary" @click="publishTalk" :loading="publishLoading">
          {{ isEdit ? '更新说说' : '发表说说' }}
        </ElButton>
      </div>
    </div>

    <div class="page-content">
      <ElRow :gutter="24">
        <!-- 主编辑区域 -->
        <ElCol :lg="16" :md="24" :sm="24" :xs="24">
          <div class="main-editor">
            <!-- 内容编辑器 -->
            <div class="content-section">
              <div class="section-title">
                <ElIcon><EditPen /></ElIcon>
                <span>说说内容</span>
                <span class="char-count">{{ contentLength }}/{{ maxContentLength }}</span>
              </div>
              <div class="content-editor">
                <ElInput
                  v-model="talkForm.content"
                  type="textarea"
                  :rows="8"
                  :maxlength="maxContentLength"
                  show-word-limit
                  placeholder="分享你的想法..."
                  class="content-textarea"
                  @input="onContentChange"
                />
                <div class="editor-toolbar">
                   <div class="emoji-picker-container">
                     <ElButton 
                       size="small" 
                       @click="() => insertEmoji()" 
                       :icon="Sunny"
                       text
                     >
                       表情
                     </ElButton>
                     <!-- 表情选择器面板 -->
                     <div v-if="showEmojiPicker" class="emoji-picker">
                       <div class="emoji-grid">
                         <span
                           v-for="emoji in emojiList"
                           :key="emoji"
                           class="emoji-item"
                           @click="insertEmoji(emoji)"
                         >
                           {{ emoji }}
                         </span>
                       </div>
                     </div>
                   </div>
                   <ElButton 
                     size="small" 
                     @click="insertMention" 
                     :icon="User"
                     text
                   >
                     @提及
                   </ElButton>
                   <ElButton 
                     size="small" 
                     @click="insertTopic" 
                     :icon="ChatDotRound"
                     text
                   >
                     #话题
                   </ElButton>
                 </div>
              </div>
            </div>

            <!-- 图片上传区域 -->
            <div class="images-section">
              <div class="section-title">
                <ElIcon><Picture /></ElIcon>
                <span>图片 ({{ talkForm.images.length }}/9)</span>
              </div>
              <div class="images-upload">
                <div class="image-grid">
                  <div 
                    v-for="(image, index) in talkForm.images" 
                    :key="index" 
                    class="image-item"
                  >
                    <ElImage
                      :src="image"
                      fit="cover"
                      class="image-preview"
                      :preview-src-list="talkForm.images"
                      :initial-index="index"
                    />
                    <div class="image-actions">
                      <ElButton 
                        size="small" 
                        type="danger" 
                        :icon="Delete" 
                        circle
                        @click="removeImage(index)"
                      />
                    </div>
                  </div>
                  <div 
                    v-if="talkForm.images.length < 9" 
                    class="upload-trigger"
                    @click="triggerImageUpload"
                  >
                    <ElIcon class="upload-icon"><Plus /></ElIcon>
                    <span>添加图片</span>
                  </div>
                </div>
                <input
                  ref="imageUploadRef"
                  type="file"
                  accept="image/*"
                  multiple
                  style="display: none"
                  @change="handleImageUpload"
                />
              </div>
            </div>

            <!-- 标签编辑 -->
            <div class="tags-section">
              <div class="section-title">
                <ElIcon><PriceTag /></ElIcon>
                <span>标签</span>
              </div>
              <div class="tags-editor">
                <div class="tag-list">
                  <ElTag
                    v-for="tag in talkForm.tags"
                    :key="tag"
                    closable
                    @close="removeTag(tag)"
                    class="tag-item"
                  >
                    {{ tag }}
                  </ElTag>
                  <ElInput
                    v-if="tagInputVisible"
                    ref="tagInputRef"
                    v-model="tagInputValue"
                    size="small"
                    class="tag-input"
                    @keyup.enter="addTag"
                    @blur="addTag"
                  />
                  <ElButton
                    v-else
                    size="small"
                    @click="showTagInput"
                    :icon="Plus"
                    text
                  >
                    添加标签
                  </ElButton>
                </div>
              </div>
            </div>
          </div>
        </ElCol>

        <!-- 侧边栏设置 -->
        <ElCol :lg="8" :md="24" :sm="24" :xs="24">
          <div class="sidebar-settings">
            <!-- 发布设置 -->
            <ElCard class="setting-card">
              <template #header>
                <div class="card-header">
                  <ElIcon><Setting /></ElIcon>
                  <span>发布设置</span>
                </div>
              </template>
              
              <div class="setting-item">
                <label class="setting-label">可见性</label>
                <ElRadioGroup v-model="talkForm.status" class="status-radio">
                  <ElRadio value="public">
                    <ElIcon><View /></ElIcon>
                    公开
                  </ElRadio>
                  <ElRadio value="private">
                    <ElIcon><Hide /></ElIcon>
                    私密
                  </ElRadio>
                </ElRadioGroup>
              </div>

              <div class="setting-item">
                <div class="setting-row">
                  <label class="setting-label">置顶</label>
                  <ElSwitch v-model="talkForm.isTop" />
                </div>
              </div>

              <div class="setting-item" v-if="talkForm.status === 'public'">
                <div class="setting-row">
                  <label class="setting-label">隐藏</label>
                  <ElSwitch v-model="talkForm.isHidden" />
                </div>
              </div>

              <div class="setting-item">
                <label class="setting-label">排序权重</label>
                <ElInputNumber
                  v-model="talkForm.sort"
                  :min="0"
                  :max="999"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </ElCard>

            <!-- 位置和心情 -->
            <ElCard class="setting-card">
              <template #header>
                <div class="card-header">
                  <ElIcon><Location /></ElIcon>
                  <span>位置与心情</span>
                </div>
              </template>

              <div class="setting-item">
                <label class="setting-label">位置</label>
                <ElInput
                  v-model="talkForm.location"
                  placeholder="你在哪里？"
                  :prefix-icon="LocationInformation"
                  clearable
                />
              </div>

              <div class="setting-item">
                <label class="setting-label">心情</label>
                <ElSelect
                  v-model="talkForm.mood"
                  placeholder="选择心情"
                  clearable
                  style="width: 100%"
                >
                  <ElOption
                    v-for="mood in moodOptions"
                    :key="mood.value"
                    :label="mood.label"
                    :value="mood.value"
                  >
                    <span>{{ mood.emoji }} {{ mood.label }}</span>
                  </ElOption>
                </ElSelect>
              </div>

              <div class="setting-item">
                <label class="setting-label">天气</label>
                <ElSelect
                  v-model="talkForm.weather"
                  placeholder="选择天气"
                  clearable
                  style="width: 100%"
                >
                  <ElOption
                    v-for="weather in weatherOptions"
                    :key="weather.value"
                    :label="weather.label"
                    :value="weather.value"
                  >
                    <span>{{ weather.emoji }} {{ weather.label }}</span>
                  </ElOption>
                </ElSelect>
              </div>
            </ElCard>

            <!-- 预览 -->
            <ElCard class="setting-card preview-card">
              <template #header>
                <div class="card-header">
                  <ElIcon><View /></ElIcon>
                  <span>预览</span>
                </div>
              </template>
              
              <div class="talk-preview">
                <div class="preview-content">
                  <div v-if="talkForm.content" class="preview-text">
                    {{ talkForm.content }}
                  </div>
                  <div v-else class="preview-placeholder">
                    暂无内容...
                  </div>
                  
                  <div v-if="talkForm.images.length > 0" class="preview-images">
                    <ElImage
                      v-for="(image, index) in talkForm.images.slice(0, 3)"
                      :key="index"
                      :src="image"
                      class="preview-image"
                      fit="cover"
                    />
                    <div v-if="talkForm.images.length > 3" class="more-images">
                      +{{ talkForm.images.length - 3 }}
                    </div>
                  </div>

                  <div class="preview-meta">
                    <div v-if="talkForm.location" class="meta-item">
                      <ElIcon><LocationInformation /></ElIcon>
                      <span>{{ talkForm.location }}</span>
                    </div>
                    <div v-if="talkForm.mood" class="meta-item">
                      <span>{{ getMoodEmoji(talkForm.mood) }} {{ talkForm.mood }}</span>
                    </div>
                    <div v-if="talkForm.weather" class="meta-item">
                      <span>{{ getWeatherEmoji(talkForm.weather) }} {{ talkForm.weather }}</span>
                    </div>
                  </div>

                  <div v-if="talkForm.tags.length > 0" class="preview-tags">
                    <ElTag
                      v-for="tag in talkForm.tags"
                      :key="tag"
                      size="small"
                      type="info"
                    >
                      {{ tag }}
                    </ElTag>
                  </div>
                </div>
              </div>
            </ElCard>
          </div>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  EditPen,
  Picture,
  PriceTag,
  Setting,
  View,
  Hide,
  Location,
  LocationInformation,
  Plus,
  Delete,
  Sunny,
  User,
  ChatDotRound
} from '@element-plus/icons-vue'
import { createTalk, updateTalk, getTalkById, uploadTalkImage } from '@/api/talks'
import type { Talk } from '@/api/talks'

// 路由
const router = useRouter()
const route = useRoute()

// 是否为编辑模式
const isEdit = computed(() => !!route.query.id)

// 表单数据
const talkForm = reactive<Partial<Talk>>({
  content: '',
  images: [],
  status: 'public',
  isTop: false,
  isHidden: false,
  location: '',
  mood: '',
  weather: '',
  tags: [],
  sort: 0
})

// 加载状态
const publishLoading = ref(false)
const draftLoading = ref(false)
const imageUploadLoading = ref(false)

// 内容限制
const maxContentLength = 500
const contentLength = computed(() => talkForm.content?.length || 0)

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 图片上传
const imageUploadRef = ref()

// 心情选项
const moodOptions = [
  { value: '开心', label: '开心', emoji: '😊' },
  { value: '难过', label: '难过', emoji: '😢' },
  { value: '愤怒', label: '愤怒', emoji: '😠' },
  { value: '惊讶', label: '惊讶', emoji: '😲' },
  { value: '平静', label: '平静', emoji: '😌' },
  { value: '兴奋', label: '兴奋', emoji: '🤩' },
  { value: '疲惫', label: '疲惫', emoji: '😴' },
  { value: '思考', label: '思考', emoji: '🤔' }
]

// 天气选项
const weatherOptions = [
  { value: '晴天', label: '晴天', emoji: '☀️' },
  { value: '多云', label: '多云', emoji: '⛅' },
  { value: '阴天', label: '阴天', emoji: '☁️' },
  { value: '雨天', label: '雨天', emoji: '🌧️' },
  { value: '雪天', label: '雪天', emoji: '❄️' },
  { value: '雾天', label: '雾天', emoji: '🌫️' },
  { value: '风天', label: '风天', emoji: '💨' }
]

// 获取心情表情
const getMoodEmoji = (mood: string) => {
  const option = moodOptions.find(item => item.value === mood)
  return option?.emoji || ''
}

// 获取天气表情
const getWeatherEmoji = (weather: string) => {
  const option = weatherOptions.find(item => item.value === weather)
  return option?.emoji || ''
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 内容变化处理
const onContentChange = (value: string) => {
  // 可以在这里添加实时保存草稿的逻辑
}

// 表情选择器相关
const showEmojiPicker = ref(false)
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
]

// 插入表情
const insertEmoji = (emoji?: string) => {
  if (emoji) {
    // 插入指定表情
    const textarea = document.querySelector('.content-textarea textarea') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = talkForm.content || ''
      talkForm.content = text.slice(0, start) + emoji + text.slice(end)
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      })
    }
    showEmojiPicker.value = false
  } else {
    // 显示表情选择器
    showEmojiPicker.value = !showEmojiPicker.value
  }
}

// 插入提及
const insertMention = () => {
  const textarea = document.querySelector('.content-textarea textarea') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = talkForm.content || ''
    talkForm.content = text.slice(0, start) + '@' + text.slice(end)
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 1)
    })
  }
}

// 插入话题
const insertTopic = () => {
  const textarea = document.querySelector('.content-textarea textarea') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = talkForm.content || ''
    talkForm.content = text.slice(0, start) + '#' + text.slice(end)
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 1)
    })
  }
}

// 触发图片上传
const triggerImageUpload = () => {
  imageUploadRef.value?.click()
}

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const remainingSlots = 9 - talkForm.images!.length
  const filesToUpload = Array.from(files).slice(0, remainingSlots)

  imageUploadLoading.value = true
  try {
    for (const file of filesToUpload) {
      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning(`图片 ${file.name} 超过5MB，已跳过`)
        continue
      }

      // 上传图片
      const result = await uploadTalkImage(file)
      talkForm.images!.push(result.url)
    }
    
    ElMessage.success(`成功上传 ${filesToUpload.length} 张图片`)
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  } finally {
    imageUploadLoading.value = false
    // 清空input值，允许重复选择相同文件
    target.value = ''
  }
}

// 移除图片
const removeImage = (index: number) => {
  talkForm.images!.splice(index, 1)
}

// 显示标签输入
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

// 添加标签
const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !talkForm.tags!.includes(tag)) {
    talkForm.tags!.push(tag)
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

// 移除标签
const removeTag = (tag: string) => {
  const index = talkForm.tags!.indexOf(tag)
  if (index > -1) {
    talkForm.tags!.splice(index, 1)
  }
}

// 保存草稿
const saveDraft = async () => {
  if (!talkForm.content?.trim()) {
    ElMessage.warning('请输入说说内容')
    return
  }

  draftLoading.value = true
  try {
    // 只保存有内容的字段，避免保存空值
    const draftData = {
      content: talkForm.content,
      images: talkForm.images?.length ? talkForm.images : [],
      status: talkForm.status,
      isTop: talkForm.isTop,
      isHidden: talkForm.isHidden,
      location: talkForm.location || '',
      mood: talkForm.mood || '',
      weather: talkForm.weather || '',
      tags: talkForm.tags?.length ? talkForm.tags : [],
      sort: talkForm.sort || 0
    }
    
    localStorage.setItem('talk_draft', JSON.stringify(draftData))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败')
  } finally {
    draftLoading.value = false
  }
}

// 发表说说
const publishTalk = async () => {
  if (!talkForm.content?.trim()) {
    ElMessage.warning('请输入说说内容')
    return
  }

  publishLoading.value = true
  try {
    const talkData = {
      ...talkForm,
      author: 'admin', // 这里应该从用户信息中获取
      publishDate: new Date(),
      updateDate: new Date(),
      likes: 0,
      views: 0
    }

    if (isEdit.value) {
      await updateTalk(route.query.id as string, talkData)
      ElMessage.success('说说更新成功')
    } else {
      await createTalk(talkData)
      ElMessage.success('说说发表成功')
      // 清除草稿
      localStorage.removeItem('talk_draft')
    }

    // 返回列表页并附带刷新参数
    await router.push({ path: '/talk/talklist', query: { refresh: Date.now().toString() } })

    // 导航完成后再通知列表刷新，确保监听已注册
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('talkPublished', {
          detail: {
            action: isEdit.value ? 'update' : 'create',
            id: isEdit.value ? (route.query.id as string) : null
          }
        })
      )
    }, 0)
  } catch (error) {
    console.error('发表说说失败:', error)
    ElMessage.error(isEdit.value ? '更新说说失败' : '发表说说失败')
  } finally {
    publishLoading.value = false
  }
}

// 加载说说数据（编辑模式）
const loadTalkData = async () => {
  if (!isEdit.value) return

  try {
    const talk = await getTalkById(route.query.id as string)
    Object.assign(talkForm, talk)
  } catch (error) {
    console.error('加载说说数据失败:', error)
    ElMessage.error('加载说说数据失败')
    router.back()
  }
}

// 加载草稿（手动触发）
const loadDraft = () => {
  if (isEdit.value) return

  try {
    const draft = localStorage.getItem('talk_draft')
    if (draft) {
      const draftData = JSON.parse(draft)
      Object.assign(talkForm, draftData)
      ElMessage.info('已加载草稿内容')
    } else {
      ElMessage.info('暂无草稿内容')
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    ElMessage.error('加载草稿失败')
  }
}

// 重置表单到初始状态
const resetForm = () => {
  Object.assign(talkForm, {
    _id: undefined, // 确保清除ID字段
    content: '',
    images: [],
    status: 'public',
    isTop: false,
    isHidden: false,
    location: '',
    mood: '',
    weather: '',
    tags: [],
    sort: 0,
    // 清除其他可能存在的编辑模式字段
    author: undefined,
    publishDate: undefined,
    updateDate: undefined,
    likes: undefined,
    views: undefined,
    deleteDate: undefined
  })
}

// 组件挂载
onMounted(() => {
  if (isEdit.value) {
    // 编辑模式：加载说说数据
    loadTalkData()
  } else {
    // 新建模式：确保表单为空状态，不自动加载草稿
    resetForm()
  }
})

// 监听路由变化，确保页面切换时数据正确重置
watch(
  () => route.query.id,
  (newId, oldId) => {
    // 当路由参数发生变化时，重新初始化页面数据
    if (newId !== oldId) {
      if (newId) {
        // 有ID，进入编辑模式
        loadTalkData()
      } else {
        // 无ID，进入新建模式
        resetForm()
      }
    }
  },
  { immediate: false } // 不立即执行，避免与onMounted重复
)

// 监听路由完整路径变化，确保从不同入口进入时状态正确
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    // 当完整路径发生变化时（包括query参数的变化）
    if (newPath !== oldPath) {
      // 重新判断是否为编辑模式
      if (route.query.id) {
        // 有ID，进入编辑模式
        loadTalkData()
      } else {
        // 无ID，进入新建模式，强制重置表单
        resetForm()
      }
    }
  },
  { immediate: false }
)
</script>

<style scoped lang="scss">
.publish-talk-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.page-content {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-section,
.images-section,
.tags-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;

  .char-count {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
    font-weight: normal;
  }
}

.content-editor {
  .content-textarea {
    :deep(.el-textarea__inner) {
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
    }
  }

  .editor-toolbar {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;
  }

  .emoji-picker-container {
    position: relative;
  }

  .emoji-picker {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 12px;
    min-width: 280px;
    max-height: 200px;
    overflow-y: auto;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }

  .emoji-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 18px;
    transition: background-color 0.2s;
  }

  .emoji-item:hover {
    background-color: var(--el-fill-color-light);
  }
}

.images-upload {
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;

    .image-preview {
      width: 100%;
      height: 100%;
    }

    .image-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .image-actions {
      opacity: 1;
    }
  }

  .upload-trigger {
    aspect-ratio: 1;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #8c939d;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }

    .upload-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    span {
      font-size: 12px;
    }
  }
}

.tags-editor {
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .tag-item {
      margin: 0;
    }

    .tag-input {
      width: 100px;
    }
  }
}

.sidebar-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .setting-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #606266;
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .setting-label {
        margin-bottom: 0;
      }
    }

    .status-radio {
      display: flex;
      flex-direction: column;
      gap: 12px;

      :deep(.el-radio) {
        margin-right: 0;

        .el-radio__label {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }
    }
  }
}

.preview-card {
  .talk-preview {
    .preview-content {
      .preview-text {
        line-height: 1.6;
        margin-bottom: 12px;
        color: #303133;
      }

      .preview-placeholder {
        color: #c0c4cc;
        font-style: italic;
      }

      .preview-images {
        display: flex;
        gap: 4px;
        margin-bottom: 12px;

        .preview-image {
          width: 40px;
          height: 40px;
          border-radius: 4px;
        }

        .more-images {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 12px;
          color: #909399;
        }
      }

      .preview-meta {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #909399;
        }
      }

      .preview-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    padding: 16px;
    flex-direction: column;
    gap: 16px;

    .header-left,
    .header-right {
      width: 100%;
      justify-content: center;
    }

    .header-left {
      .page-title {
        font-size: 18px;
      }
    }
  }

  .page-content {
    padding: 16px;
  }

  .content-section,
  .images-section,
  .tags-section,
  .setting-card {
    padding: 16px;
  }

  .images-upload {
    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
    }
  }

  .sidebar-settings {
    margin-top: 20px;
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .publish-talk-page {
    background: #1a1a1a;
  }

  .page-header {
    background: #2d2d2d;
    border-bottom-color: #404040;
  }

  .content-section,
  .images-section,
  .tags-section,
  .setting-card {
    background: #2d2d2d;
  }
}
</style>

