<template>
  <div class="article-edit">
    <div>
      <div class="editor-wrap">
        <!-- 文章标题、类型 -->
        <ElRow :gutter="10">
          <ElCol :span="18">
            <ElInput
              v-model.trim="articleName"
              placeholder="请输入文章标题（最多100个字符）"
              maxlength="100"
            />
          </ElCol>
          <ElCol :span="6">
            <ElSelect v-model="articleType" placeholder="请选择文章类型" filterable>
              <ElOption
                v-for="item in articleTypes"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </ElSelect>
          </ElCol>
        </ElRow>

        <!-- 视图模式切换 -->
        <div class="mode-switch el-top">
          <div class="mode-controls">
            <ElRadioGroup v-model="viewMode" size="small">
              <ElRadioButton value="edit">编辑模式</ElRadioButton>
              <ElRadioButton value="preview">预览模式</ElRadioButton>
              <ElRadioButton value="split">分屏模式</ElRadioButton>
            </ElRadioGroup>
            <ElButton size="small" type="warning" plain @click="clearLocalDraft">
              清除草稿
            </ElButton>
          </div>
        </div>

        <!-- 编辑器容器 -->
        <div class="editor-container el-top" :class="viewMode">
          <!-- 编辑器面板 -->
          <div class="editor-panel" v-show="viewMode !== 'preview'">
            <MdEditor
              v-model="markdownContent"
              :height="viewMode === 'split' ? 500 : 600"
              :preview="false"
              :toolbars="toolbars"
              @onSave="handleSave"
              @onUploadImg="handleEditorImageUpload"
            />
          </div>

          <!-- 预览面板 -->
          <div class="preview-panel" v-show="viewMode !== 'edit'">
            <div class="preview-header">
              <h1 class="preview-title">{{ articleName || '请输入文章标题' }}</h1>
              <div class="preview-meta">
                <span class="preview-category">{{ getArticleTypeName(articleType) }}</span>
                <span class="preview-date">{{ formDate(new Date()) }}</span>
              </div>
            </div>
            <div class="preview-content markdown-body" v-html="previewHtml"></div>
          </div>
        </div>

        <div class="form-wrap">
          <h2>发布设置</h2>
          <!-- 图片上传 -->
          <ElForm>
            <ElFormItem label="标签" required>
              <div class="tags-selector">
                <!-- 已选标签展示 -->
                <div class="selected-tags" v-if="selectedTags.length > 0">
                  <ElTag
                    v-for="tag in selectedTags"
                    :key="tag.name"
                    closable
                    @close="removeTag(tag)"
                    type="primary"
                    class="selected-tag"
                  >
                    {{ tag.name }}
                  </ElTag>
                </div>

                <!-- 标签搜索选择器 -->
                <div class="tag-search-container">
                  <ElInput
                    v-model="tagSearchInput"
                    placeholder="搜索标签或输入新标签名称"
                    clearable
                    @input="onTagSearchInput"
                    @focus="showTagOptions = true"
                    class="tag-search-input"
                    :disabled="selectedTags.length >= 4"
                  >
                    <template #suffix>
                      <ElIcon><Search /></ElIcon>
                    </template>
                  </ElInput>

                  <!-- 标签选项下拉框 -->
                  <div
                    v-show="showTagOptions && (filteredTags.length > 0 || tagSearchInput.trim())"
                    class="tag-options"
                  >
                    <!-- 搜索结果标签 -->
                    <div v-if="filteredTags.length > 0" class="tag-section">
                      <div class="section-title">匹配的标签</div>
                      <div class="tag-list">
                        <div
                          v-for="tag in filteredTags.slice(0, 10)"
                          :key="tag.name"
                          class="tag-option"
                          @click="selectTag(tag)"
                          :class="{ disabled: isTagSelected(tag.name) }"
                        >
                          <span class="tag-name">{{ tag.name }}</span>
                          <span class="tag-count">({{ tag.count }})</span>
                        </div>
                      </div>
                    </div>

                    <!-- 创建新标签选项 -->
                    <div
                      v-if="tagSearchInput.trim() && !isExistingTag(tagSearchInput.trim())"
                      class="tag-section"
                    >
                      <div class="section-title">创建新标签</div>
                      <div class="tag-option new-tag" @click="createNewTag(tagSearchInput.trim())">
                        <ElIcon><Plus /></ElIcon>
                        <span>创建 "{{ tagSearchInput.trim() }}"</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 热门标签快速选择 -->
                <div class="popular-tags" v-if="popularTags.length > 0 && selectedTags.length < 4">
                  <div class="popular-tags-title">热门标签：</div>
                  <div class="popular-tags-list">
                    <ElTag
                      v-for="tag in popularTags.slice(0, 8)"
                      :key="tag.name"
                      class="popular-tag"
                      :class="{ disabled: isTagSelected(tag.name) }"
                      @click="selectTag(tag)"
                      :type="isTagSelected(tag.name) ? 'info' : 'default'"
                    >
                      {{ tag.name }}
                    </ElTag>
                  </div>
                </div>

                <div class="tags-help-text">
                  <span class="tags-count">已选择 {{ selectedTags.length }}/4 个标签</span>
                  <span class="tags-tip">最少选择1个，最多选择4个标签</span>
                </div>
              </div>
            </ElFormItem>
            <ElFormItem label="封面">
              <div class="el-top upload-container">
                <ElUpload
                  class="cover-uploader"
                  :action="uploadImageUrl"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="onSuccess"
                  :on-error="onError"
                  :on-progress="onProgress"
                  :before-upload="beforeUpload"
                  accept="image/*"
                  name="file"
                >
                  <div v-if="!cover" class="upload-placeholder" :class="{ uploading }">
                    <ElIcon class="upload-icon"><Plus /></ElIcon>
                    <div class="upload-text">
                      {{ uploading ? '上传中...' : '点击上传封面' }}
                    </div>
                    <div v-if="uploading" class="upload-progress">{{ uploadProgress }}%</div>
                  </div>
                  <img v-else :src="cover" class="cover-image" />
                </ElUpload>
                <div class="el-upload__tip">建议尺寸 16:9，jpg/png 格式</div>
              </div>
            </ElFormItem>
            <ElFormItem label="可见">
              <ElSwitch v-model="visible" />
            </ElFormItem>
            <ElFormItem label="置顶">
              <ElSwitch v-model="isTop" @change="onTopChange" />
            </ElFormItem>
          </ElForm>

          <div style="display: flex; justify-content: flex-end">
            <ElButton type="primary" @click="submit" style="width: 100px">
              {{ pageMode === PageModeEnum.Edit ? '保存' : '发布' }}
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="outline-wrap">
        <div class="item" v-for="(item, index) in outlineList" :key="index">
          <p :class="`level${item.level}`">{{ item.text }}</p>
        </div>
      </div> -->
  </div>
</template>

<script setup lang="ts">
  import { Plus, Search } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import EmojiText from '@/utils/ui/emojo'
  import { PageModeEnum } from '@/enums/formEnum'
  import { useCommon } from '@/composables/useCommon'
  import { MdEditor } from 'md-editor-v3'
  import { marked } from 'marked'
  import 'md-editor-v3/lib/style.css'
  import '@/assets/styles/markdown.scss'
  import {
    createArticle,
    updateArticle,
    getArticleDetail as fetchArticleDetail,
    getCategories,
    getTags
  } from '@/api/articles'
  import { router } from '@/router'

  interface ArticleType {
    id: string
    name: string
    slug?: string
    description?: string
    color?: string
  }

  interface Tag {
    _id?: string
    id?: string
    name: string
    count: number
    slug?: string
    color?: string
  }

  interface UploadProgressEvent {
    percent?: number
    loaded?: number
    total?: number
  }

  interface UploadResponse {
    url?: string
    data?: { url: string }
    file?: { url: string }
  }

  defineOptions({ name: 'ArticlePublish' })

  const route = useRoute()

  const userStore = useUserStore()
  let { accessToken } = userStore

  // 上传配置 - 使用 Vite 代理
  const uploadImageUrl = ref('/api/uploads')

  // 传递 token
  const uploadHeaders = computed(() => ({
    Authorization: accessToken // 统一使用原始 token
  }))

  let pageMode: PageModeEnum = PageModeEnum.Add // 页面类型 新增 ｜ 编辑
  const articleName = ref('') // 文章标题
  const articleType = ref() // 文章类型
  const articleTypes = ref() // 类型列表
  const markdownContent = ref('') // Markdown内容
  const editorHtml = ref('') // 编辑器内容（兼容旧版本）
  const createDate = ref('') // 创建时间
  const cover = ref('') // 图片
  const uploadProgress = ref(0) // 上传进度
  const uploading = ref(false) // 上传状态
  const visible = ref(true) // 可见
  const isTop = ref(false) // 置顶
  const viewMode = ref('edit') // 视图模式: edit, preview, split
  // const outlineList = ref()

  // 标签相关数据
  const selectedTags = ref<Array<{ name: string; count: number }>>([]) // 已选择的标签
  const popularTags = ref<Array<{ name: string; count: number }>>([]) // 热门标签
  const tagSearchInput = ref('') // 标签搜索输入
  const showTagOptions = ref(false) // 是否显示标签选项
  const filteredTags = ref<Array<{ name: string; count: number }>>([]) // 过滤后的标签
  const allTags = ref<Array<{ name: string; count: number }>>([]) // 所有标签

  onMounted(async () => {
    useCommon().scrollToTop()
    await getArticleTypes()
    await loadTags()
    await initPageMode()
    // 只有在新建模式下才恢复本地草稿
    if (!route.query.id) {
      restoreLocalContent()
    }
  })

  // 监听路由参数变化，处理keepAlive缓存组件的数据更新
  watch(
    () => route.query.id,
    async (newId, oldId) => {
      if (newId !== oldId) {
        // 重置组件状态
        isInitializing.value = true

        // 清空当前数据
        articleName.value = ''
        articleType.value = ''
        markdownContent.value = ''
        editorHtml.value = ''
        cover.value = ''

        // 重新初始化
        await initPageMode()

        // 只有在新建模式下才恢复本地草稿
        if (!newId) {
          restoreLocalContent()
        }
      }
    },
    { immediate: false }
  )

  // 监听内容变化，自动保存到本地存储
  let isInitializing = ref(false)

  watch(
    [markdownContent, articleName, articleType, viewMode, selectedTags],
    () => {
      // 避免在初始化阶段保存数据
      if (!isInitializing.value) {
        saveToLocal()
      }
    },
    { deep: true }
  )

  // 监听标签搜索输入，实时过滤
  watch(tagSearchInput, (newValue) => {
    filterTags(newValue)
  })

  // 点击外部关闭标签选项
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement
    const tagContainer = document.querySelector('.tag-search-container')
    if (tagContainer && !tagContainer.contains(target)) {
      showTagOptions.value = false
    }
  }

  // 保存内容到本地存储
  const saveToLocal = () => {
    const { id } = route.query
    const storageKey = id ? `article-draft-${id}` : 'article-draft-new'

    const content = {
      markdownContent: markdownContent.value,
      articleName: articleName.value,
      articleType: articleType.value,
      selectedTags: selectedTags.value,
      viewMode: viewMode.value,
      timestamp: Date.now(),
      articleId: id || null
    }
    localStorage.setItem(storageKey, JSON.stringify(content))
  }

  // 从本地存储恢复内容
  const restoreLocalContent = () => {
    const { id } = route.query

    // 编辑模式下不恢复草稿，避免覆盖正式数据
    if (id) {
      return
    }

    const storageKey = 'article-draft-new'
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      try {
        const content = JSON.parse(saved)

        console.log('恢复新建文章草稿:', content)
        markdownContent.value = content.markdownContent || ''
        articleName.value = content.articleName || ''
        articleType.value = content.articleType || ''
        selectedTags.value = content.selectedTags || []
        viewMode.value = content.viewMode || 'edit'
      } catch (error) {
        console.error('恢复本地内容失败:', error)
      }
    }
  }

  // 清除本地存储的草稿
  const clearLocalDraft = () => {
    const { id } = route.query
    const storageKey = id ? `article-draft-${id}` : 'article-draft-new'

    localStorage.removeItem(storageKey)

    // 清空表单内容
    if (!id) {
      markdownContent.value = ''
      articleName.value = ''
      articleType.value = ''
      selectedTags.value = []
      viewMode.value = 'edit'
      ElMessage.success('草稿已清除')
    } else {
      ElMessage.success('编辑草稿已清除')
    }
  }

  // Markdown 编辑器配置
  const toolbars: string[] = [
    'bold',
    'underline',
    'italic',
    '-',
    'title',
    'strikeThrough',
    'sub',
    'sup',
    'quote',
    'unorderedList',
    'orderedList',
    'task',
    '-',
    'codeRow',
    'code',
    'link',
    'image',
    'table',
    'mermaid',
    'katex',
    '-',
    'revoke',
    'next',
    'save',
    '=',
    'pageFullscreen',
    'fullscreen',
    'preview',
    'htmlPreview',
    'catalog'
  ]

  // 计算预览内容
  const previewHtml = computed(() => {
    if (!markdownContent.value) {
      return '<p class="empty-content">开始编写你的 Markdown 内容...</p>'
    }
    try {
      return marked(markdownContent.value)
    } catch (error) {
      console.error('Markdown 解析失败:', error)
      return '<p class="error-content">内容解析失败</p>'
    }
  })

  // 保存处理
  const handleSave = () => {
    submit()
  }

  // 编辑器图片上传处理
  const handleEditorImageUpload = async (files: File[], callback: (urls: string[]) => void) => {
    try {
      const uploadPromises = files.map(async (file) => {
        // 验证文件类型和大小
        if (!file.type.startsWith('image/')) {
          ElMessage.error('只能上传图片文件!')
          return ''
        }
        if (file.size / 1024 / 1024 > 2) {
          ElMessage.error('图片大小不能超过 2MB!')
          return ''
        }

        // 创建FormData
        const formData = new FormData()
        formData.append('file', file)

        // 使用fetch直接上传，避免axios的响应拦截器影响
        const response = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Authorization': accessToken
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`上传失败: ${response.status}`)
        }

        const result = await response.json()
        console.log('编辑器图片上传响应:', result)

        // 处理不同的响应格式
        let imageUrl = ''
        if (result.data && result.data.url) {
          imageUrl = result.data.url
        } else if (result.url) {
          imageUrl = result.url
        } else {
          throw new Error('上传响应格式异常')
        }

        // 确保返回完整的URL
        if (!imageUrl.startsWith('http')) {
          imageUrl = `http://localhost:3001${imageUrl}`
        }

        return imageUrl
      })

      const urls = await Promise.all(uploadPromises)
      const validUrls = urls.filter(url => url !== '')
      
      if (validUrls.length > 0) {
        callback(validUrls)
        ElMessage.success(`成功上传 ${validUrls.length} 张图片`)
      }
    } catch (error) {
      console.error('编辑器图片上传失败:', error)
      ElMessage.error('图片上传失败，请重试')
    }
  }

  // 获取文章类型名称
  const getArticleTypeName = (typeId: string) => {
    if (!typeId || !articleTypes.value) return '未分类'
    const type = articleTypes.value.find((item: ArticleType) => {
      // 兼容多种匹配方式
      return item.id === typeId || item.name === typeId || item.slug === typeId
    })
    return type ? type.name : '未分类'
  }

  // 初始化页面类型 新增 ｜ 编辑
  const initPageMode = async () => {
    const { id } = route.query
    pageMode = id ? PageModeEnum.Edit : PageModeEnum.Add
    if (pageMode === PageModeEnum.Edit && id) {
      await initEditArticle()
    } else {
      initAddArticle()
    }
  }

  // 初始化编辑文章的逻辑
  const initEditArticle = async () => {
    isInitializing.value = true
    await getArticleDetail()
    // 延迟一点时间确保数据完全加载
    setTimeout(() => {
      isInitializing.value = false
    }, 100)
  }

  // 初始化新增文章逻辑
  const initAddArticle = () => {
    createDate.value = formDate(new Date())
  }

  // 获取文章类型
  const getArticleTypes = async () => {
    try {
      const params = {
        status: 'active' as const
      }

      const response = await getCategories(params)
      let categories = []

      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        if ('categories' in response && Array.isArray(response.categories)) {
          categories = response.categories
        } else if (Array.isArray(response)) {
          categories = response
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            categories = response.data
          } else if (response.data.categories) {
            categories = response.data.categories
          }
        }
      } else if (Array.isArray(response)) {
        categories = response
      }

      if (categories && categories.length > 0) {
        const activeCategories = categories.filter((cat: Record<string, any>) => cat.status === 'active')

        articleTypes.value = activeCategories.map((cat: Record<string, any>): ArticleType => ({
          id: cat._id || cat.id || cat.name,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          color: cat.color
        }))

        if (articleTypes.value.length === 0) {
          articleTypes.value = categories.map((cat: Record<string, any>): ArticleType => ({
            id: cat._id || cat.id || cat.name,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            color: cat.color
          }))
        }
      } else {
        // 默认分类
        articleTypes.value = [
          { id: 'Vue', name: 'Vue', slug: 'vue' },
          { id: 'JavaScript', name: 'JavaScript', slug: 'javascript' },
          { id: 'CSS', name: 'CSS', slug: 'css' },
          { id: 'Node.js', name: 'Node.js', slug: 'nodejs' },
          { id: '其他', name: '其他', slug: 'other' }
        ]
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      ElMessage.warning('获取分类失败，使用默认分类')
      // 默认分类
      articleTypes.value = [
        { id: 'Vue', name: 'Vue', slug: 'vue' },
        { id: 'JavaScript', name: 'JavaScript', slug: 'javascript' },
        { id: 'CSS', name: 'CSS', slug: 'css' },
        { id: 'Node.js', name: 'Node.js', slug: 'nodejs' },
        { id: '其他', name: '其他', slug: 'other' }
      ]
    }
  }

  const getArticleDetail = async () => {
    try {
      const { id } = route.query
      if (!id) return

      console.log('开始加载文章详情, ID:', id)

      const article = await fetchArticleDetail(id as string)
      if (article) {
        console.log('文章详情加载成功:', {
          title: article.title,
          category: article.category,
          contentLength: article.content?.length || 0
        })

        // 清除当前文章的本地草稿（避免草稿覆盖正式数据）
        const storageKey = `article-draft-${id}`
        localStorage.removeItem(storageKey)

        articleName.value = article.title || ''
        articleType.value = article.category || ''
        // 优先使用 Markdown 内容，如果没有则使用 HTML 内容
        markdownContent.value = article.content || ''
        editorHtml.value = article.contentHtml || article.content || ''
        cover.value = article.image || ''
        visible.value = article.visible !== false // 加载可见性状态，默认为true
        isTop.value = !!article.isTop // 加载置顶状态，默认为false

        // 加载文章标签
        if (article.tags && Array.isArray(article.tags)) {
          selectedTags.value = article.tags.map((tagName) => ({
            name: tagName,
            count: 0 // 编辑模式下不需要显示计数
          }))
        }

        console.log('文章数据已设置到表单')
      }
    } catch (error) {
      console.error('获取文章详情失败:', error)
      ElMessage.error('获取文章详情失败')
    }
  }

  // 加载标签数据
  const loadTags = async () => {
    try {
      const response = await getTags()
      console.log('获取标签API响应:', response)

      let tags: Tag[] = []
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        tags = (response as any).data
      } else if (Array.isArray(response)) {
        tags = response
      }

      allTags.value = tags
      // 设置热门标签（按使用次数排序，取前8个）
      popularTags.value = [...tags].sort((a, b) => b.count - a.count).slice(0, 8)

      console.log('标签数据加载完成:', {
        total: allTags.value.length,
        popular: popularTags.value.length
      })
    } catch (error) {
      console.error('加载标签失败:', error)
      ElMessage.warning('标签加载失败，请检查网络连接')
    }
  }

  // 过滤标签
  const filterTags = (searchText: string) => {
    if (!searchText.trim()) {
      filteredTags.value = []
      return
    }

    const searchLower = searchText.toLowerCase()
    filteredTags.value = allTags.value
      .filter((tag) => tag.name.toLowerCase().includes(searchLower) && !isTagSelected(tag.name))
      .slice(0, 10) // 最多显示10个匹配结果
  }

  // 标签搜索输入处理
  const onTagSearchInput = (value: string) => {
    filterTags(value)
    if (value.trim()) {
      showTagOptions.value = true
    }
  }

  // 选择标签
  const selectTag = (tag: Tag) => {
    if (selectedTags.value.length >= 4) {
      ElMessage.warning('最多只能选择4个标签')
      return
    }

    if (!isTagSelected(tag.name)) {
      selectedTags.value.push(tag)
      tagSearchInput.value = ''
      showTagOptions.value = false
      ElMessage.success(`已添加标签：${tag.name}`)
    }
  }

  // 移除标签
  const removeTag = (tag: Tag) => {
    selectedTags.value = selectedTags.value.filter((t) => t.name !== tag.name)
    ElMessage.success(`已移除标签：${tag.name}`)
  }

  // 创建新标签
  const createNewTag = (tagName: string) => {
    if (!tagName.trim()) return

    if (selectedTags.value.length >= 4) {
      ElMessage.warning('最多只能选择4个标签')
      return
    }

    if (isTagSelected(tagName)) {
      ElMessage.warning('该标签已存在')
      return
    }

    const newTag: Tag = { name: tagName.trim(), count: 0 }
    selectedTags.value.push(newTag)
    // 同时添加到所有标签列表中
    allTags.value.unshift(newTag)

    tagSearchInput.value = ''
    showTagOptions.value = false
    ElMessage.success(`已创建并添加新标签：${tagName}`)
  }

  // 检查标签是否已选择
  const isTagSelected = (tagName: string) => {
    return selectedTags.value.some((tag) => tag.name === tagName)
  }

  // 检查是否为已存在的标签
  const isExistingTag = (tagName: string) => {
    return allTags.value.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase())
  }

  // 提交
  const submit = () => {
    if (pageMode === PageModeEnum.Edit) {
      editArticle()
    } else {
      // 新文章发布前先确认
      ElMessageBox.confirm(
        '确认发布这篇文章吗？发布后将对用户可见。', '确认发布',
        {
          confirmButtonText: '确认发布',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        addArticle()
      }).catch(() => {
        // 用户取消发布
      })
    }
  }

  // 格式化日期
  const formDate = (date: string | Date): string => {
    return useDateFormat(date, 'YYYY-MM-DD').value
  }

  // 验证输入
  const validateArticle = () => {
    const errors = []
    
    if (!articleName.value?.trim()) {
      errors.push('文章标题')
    }

    if (!articleType.value) {
      errors.push('文章类型')
    }

    // 检查内容是否为空
    const hasMarkdownContent = markdownContent.value?.trim()
    const hasHtmlContent = editorHtml.value && editorHtml.value !== '<p><br></p>' && editorHtml.value.replace(/<[^>]*>/g, '').trim()
    if (!hasMarkdownContent && !hasHtmlContent) {
      errors.push('文章内容')
    }

    if (!selectedTags.value || selectedTags.value.length === 0) {
      errors.push('文章标签（至少选择一个）')
    }

    if (selectedTags.value && selectedTags.value.length > 4) {
      ElMessage.error('最多只能选择4个标签')
      return false
    }

    if (!cover.value) {
      errors.push('封面图片')
    }

    if (errors.length > 0) {
      ElMessage.error(`请填写以下必填项：${errors.join('、')}`)
      return false
    }

    return true
  }

  // 添加文章
  const addArticle = async () => {
    try {
      if (!validateArticle()) return

      const cleanContent = markdownContent.value || delCodeTrim(editorHtml.value)
      const htmlContent = markdownContent.value
        ? marked(markdownContent.value)
        : delCodeTrim(editorHtml.value)

      const articleData = {
        title: articleName.value,
        content: cleanContent,
        contentHtml: htmlContent,
        contentFormat: markdownContent.value ? 'markdown' : 'html',
        author: '管理员', // 可以从用户store中获取
        category: articleType.value,
        tags: selectedTags.value.map((tag) => tag.name), // 提取标签名称数组
        excerpt: extractExcerpt(htmlContent) as string,
        image: cover.value,
        isTop: isTop.value,
        visible: visible.value
      }

      const result = await createArticle(articleData)
      if (result) {
        ElMessage.success(`文章发布成功 ${EmojiText[200]}`)
        
        // 触发文章统计更新事件
        const { articleEventBus } = await import('@/composables/useArticleStats')
        articleEventBus.emit('article:published', result)
        articleEventBus.emit('article:stats:refresh')
        
        // 清除本地草稿
        localStorage.removeItem('article-draft-new')
        // 跳转到文章列表页面并刷新数据
        setTimeout(() => {
          // 设置标记，表示从编辑页面返回
          sessionStorage.setItem('fromArticleEdit', 'true')
          router.replace({
            path: '/article/article-list',
            query: { refresh: Date.now().toString() } // 添加时间戳触发刷新
          })
        }, 1500)
      }
    } catch (err) {
      console.error('发布文章失败:', err)
      ElMessage.error(`文章发布失败 ${EmojiText[500]}`)
    }
  }

  // 编辑文章
  const editArticle = async () => {
    try {
      if (!validateArticle()) return

      const { id } = route.query
      if (!id) return

      const cleanContent = markdownContent.value || delCodeTrim(editorHtml.value)
      const htmlContent = markdownContent.value
        ? marked(markdownContent.value)
        : delCodeTrim(editorHtml.value)

      const articleData = {
        title: articleName.value,
        content: cleanContent,
        contentHtml: htmlContent,
        contentFormat: markdownContent.value ? 'markdown' : 'html',
        category: articleType.value,
        tags: selectedTags.value.map((tag) => tag.name), // 提取标签名称数组
        excerpt: extractExcerpt(htmlContent) as string,
        image: cover.value,
        isTop: isTop.value,
        visible: visible.value
      }

      const result = await updateArticle(id as string, articleData)
      if (result) {
        ElMessage.success(`保存成功 ${EmojiText[200]}`)
        
        // 触发文章统计更新事件
        const { articleEventBus } = await import('@/composables/useArticleStats')
        articleEventBus.emit('article:updated', result)
        articleEventBus.emit('article:stats:refresh')
        
        // 清除当前文章的本地草稿
        localStorage.removeItem(`article-draft-${id}`)
        // 跳转到文章列表页面并刷新数据
        setTimeout(() => {
          // 设置标记，表示从编辑页面返回
          sessionStorage.setItem('fromArticleEdit', 'true')
          router.replace({
            path: '/article/article-list',
            query: { refresh: Date.now().toString() } // 添加时间戳触发刷新
          })
        }, 1500)
      }
    } catch (err) {
      console.error('更新文章失败:', err)
      ElMessage.error(`文章更新失败 ${EmojiText[500]}`)
    }
  }

  // 提取文章摘要
  const extractExcerpt = (content: string | Promise<string>): string => {
    // 如果是Promise，返回默认摘要
    if (typeof content !== 'string') {
      return '正在生成摘要...'
    }
    // 移除HTML标签，提取纯文本作为摘要
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent
  }

  const delCodeTrim = (content: string): string => {
    return content.replace(/(\s*)<\/code>/g, '</code>')
  }

  const onProgress = (event: UploadProgressEvent) => {
    if (event.percent) {
      uploadProgress.value = event.percent
    }
  }

  // 新增：置顶状态变更时立即更新到数据库（编辑模式）
  const onTopChange = async (value: boolean) => {
    console.log('🔄 onTopChange被调用:', {
      value,
      pageMode,
      routeId: route.query.id,
      isEditMode: pageMode === PageModeEnum.Edit,
      hasId: !!route.query.id
    })
    
    try {
      const { id } = route.query
      if (pageMode === PageModeEnum.Edit && id) {
        console.log('📤 准备调用updateArticle:', { id, isTop: value })
        const result = await updateArticle(id as string, { isTop: value })
        console.log('📥 updateArticle结果:', result)
        
        if (result) {
          ElMessage.success(value ? `已置顶 ${EmojiText[200]}` : `已取消置顶 ${EmojiText[200]}`)
          // 触发文章更新事件，刷新列表与统计
          const { articleEventBus } = await import('@/composables/useArticleStats')
          articleEventBus.emit('article:updated', { id: id as string, changes: { isTop: value } })
          articleEventBus.emit('article:stats:refresh')
        }
      } else {
        console.log('📝 新建模式，保存到本地草稿')
        // 新建模式下，仅更新本地草稿
        saveToLocal()
        ElMessage.success(value ? '已设置置顶（草稿已保存）' : '已取消置顶（草稿已保存）')
      }
    } catch (err) {
      console.error('❌ 更新置顶状态失败:', err)
      ElMessage.error(`更新置顶状态失败 ${EmojiText[500]}`)
      // 回滚开关状态
      isTop.value = !value
    }
  }

  // 上传成功回调
  const onSuccess = (response: UploadResponse) => {
    uploading.value = false
    uploadProgress.value = 0
    console.log('上传响应:', response)

    if (response && response.data && response.data.url) {
      // 如果是相对路径，转换为完整URL
      const imageUrl = response.data.url.startsWith('http')
        ? response.data.url
        : `http://localhost:3001${response.data.url}`
      cover.value = imageUrl
      ElMessage.success(`图片上传成功 ${EmojiText[200]}`)
    } else if (response && response.url) {
      // 如果是相对路径，转换为完整URL
      const imageUrl = response.url.startsWith('http')
        ? response.url
        : `http://localhost:3001${response.url}`
      cover.value = imageUrl
      ElMessage.success(`图片上传成功 ${EmojiText[200]}`)
    } else {
      console.error('上传响应格式异常:', response)
      ElMessage.error('图片上传成功但获取URL失败')
    }
  }

  // 上传失败回调
  const onError = (error: unknown) => {
    uploading.value = false
    uploadProgress.value = 0
    console.error('图片上传失败:', error)
    ElMessage.error(`图片上传失败，请检查网络连接或联系管理员 ${EmojiText[500]}`)
  }

  // 添加上传前的校验
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
</script>

<style lang="scss" scoped>
  .article-edit {
    .editor-wrap {
      max-width: 1400px;
      margin: 20px auto;

      .el-top {
        margin-top: 10px;
      }

      .mode-switch {
        display: flex;
        justify-content: center;
        padding: 10px 0;

        .mode-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
      }

      .editor-container {
        display: flex;
        gap: 16px;
        min-height: 500px;

        &.edit {
          .editor-panel {
            width: 100%;
          }
        }

        &.preview {
          .preview-panel {
            width: 100%;
          }
        }

        &.split {
          .editor-panel {
            width: 50%;
            flex-shrink: 0;
          }

          .preview-panel {
            width: 50%;
            flex-shrink: 0;
          }
        }

        .editor-panel {
          background: #fff;
          border-radius: 8px;
        }

        .preview-panel {
          background: #fff;
          border: 1px solid var(--art-border-color);
          border-radius: 8px;
          overflow: hidden;

          // 全局代码块样式修复
          ::v-deep(.markdown-body) {
            pre {
              background-color: #282c34 !important;
              color: #abb2bf !important;

              * {
                color: #abb2bf !important;
              }
            }

            code {
              &:not(pre *) {
                color: #d73a49 !important;
                background-color: rgba(27, 31, 35, 0.05) !important;
              }
            }
          }

          .preview-header {
            padding: 20px 24px 16px;
            border-bottom: 1px solid #f0f0f0;
            background: #fafafa;

            .preview-title {
              margin: 0 0 12px;
              font-size: 24px;
              font-weight: 600;
              color: #262626;
              line-height: 1.3;
            }

            .preview-meta {
              display: flex;
              gap: 16px;
              font-size: 14px;
              color: #8c8c8c;

              .preview-category {
                padding: 2px 8px;
                background: #f0f0f0;
                border-radius: 4px;
                color: #595959;
              }
            }
          }
        }
      }
    }
  }
</style>
