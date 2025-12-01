<template>
  <div class="page-content article-list">
    <ElRow justify="space-between" :gutter="10">
      <ElCol :lg="6" :md="6" :sm="14" :xs="16">
        <div style="display: flex; gap: 8px">
          <ElInput
            v-model="searchVal"
            :prefix-icon="Search"
            clearable
            placeholder="输入文章标题查询"
            @keyup.enter="searchArticle"
            @clear="onSearchClear"
            @input="onSearchInput"
            style="flex: 1"
          />
          <ElButton @click="searchArticle" :disabled="isLoading">搜索</ElButton>
        </div>
      </ElCol>
      <ElCol :lg="12" :md="12" :sm="0" :xs="0">
        <div class="custom-segmented">
          <ElSegmented v-model="yearVal" :options="options" @change="handleYearChange" />
        </div>
      </ElCol>
      <ElCol :lg="6" :md="6" :sm="10" :xs="6" style="display: flex; justify-content: end; gap: 8px">
        <ElButton @click="resetFilters" :disabled="isLoading">重置</ElButton>
        <ElButton type="primary" @click="toAddArticle" v-auth="'add'">新增文章</ElButton>
      </ElCol>
    </ElRow>

    <!-- 批量操作栏 -->
    <transition name="slide-down">
      <div v-if="selectedArticles.length > 0" class="batch-operation-bar">
        <div class="batch-info">已选择 {{ selectedArticles.length }} 篇文章</div>
        <div class="batch-actions">
          <ElButton type="danger" @click="batchDelete" :loading="batchLoading">
            <ElIcon><Delete /></ElIcon>
            批量删除
          </ElButton>
          <ElButton @click="clearSelection">取消选择</ElButton>
        </div>
      </div>
    </transition>

    <div class="list">
      <div class="offset">
        <div class="item" v-for="item in articleList" :key="item.id" @click="toEdit(item)">
          <!-- 骨架屏 -->
          <ElSkeleton animated :loading="isLoading" style="width: 100%; height: 100%">
            <template #template>
              <div class="top">
                <ElSkeletonItem
                  variant="image"
                  style="width: 100%; height: 100%; border-radius: 10px"
                />
                <div style="padding: 16px 0">
                  <ElSkeletonItem variant="p" style="width: 80%" />
                  <ElSkeletonItem variant="p" style="width: 40%; margin-top: 10px" />
                </div>
              </div>
            </template>

            <template #default>
              <div class="top">
                <div class="image-container" @click.stop>
                  <ElImage
                    class="cover"
                    :src="getImageUrl(item.home_img, true)"
                    :key="`${item.id}-${forceRefreshKey}`"
                    lazy
                    fit="cover"
                    :preview-src-list="[getImageUrl(item.home_img, true)]"
                    :initial-index="0"
                    :z-index="9999"
                    preview-teleported
                    hide-on-click-modal
                  >
                    <template #error>
                      <div class="image-slot">
                        <ElIcon><icon-picture /></ElIcon>
                      </div>
                    </template>
                  </ElImage>
                  <!-- 多选复选框 -->
                  <div class="selection-checkbox" @click.stop>
                    <ElCheckbox
                      :model-value="selectedArticles.includes(item.id)"
                      @change="(val) => toggleSelection(item.id, val)"
                      @click.stop
                    />
                  </div>
                </div>

                <span class="type">{{ item.type_name }}</span>
                <span class="visibility-status" :class="{ hidden: item.visible === false }">
                  {{ item.visible === false ? '隐藏' : '公开' }}
                </span>
                <span v-if="item.isTop" class="top-badge">📌 置顶</span>

                <!-- 删除按钮 -->
                <div class="delete-btn" @click.stop="deleteArticle(item)">
                  <ElIcon><Delete /></ElIcon>
                </div>
              </div>
              <div class="bottom">
                <h2>{{ item.title }}</h2>
                <div class="info">
                  <div class="text">
                    <i class="iconfont-sys">&#xe6f7;</i>
                    <span>{{ useDateFormat(item.create_time, 'YYYY-MM-DD') }}</span>
                    <div class="line"></div>
                    <i class="iconfont-sys">&#xe689;</i>
                    <span>{{ formatNumber(item.count || 0) }}</span>
                  </div>
                  <ElButton v-auth="'edit'" size="small" @click.stop="toEdit(item)">编辑</ElButton>
                </div>
              </div>
            </template>
          </ElSkeleton>
        </div>
      </div>
    </div>

    <!-- 筛选状态显示 -->
    <div v-if="hasActiveFilters" class="filter-status" style="margin-top: 20px">
      <ElTag type="info" size="small" style="margin-right: 8px"> 当前筛选条件: </ElTag>
      <ElTag v-if="searchVal.trim()" closable @close="clearSearchFilter" style="margin-right: 8px">
        搜索: {{ searchVal }}
      </ElTag>
      <ElTag
        v-if="yearVal !== '全部'"
        closable
        @close="clearYearFilter"
        style="margin-right: 8px"
        type="success"
      >
        年份: {{ yearVal }} ({{ articleList.length }}篇)
      </ElTag>
    </div>

    <div style="margin-top: 16vh" v-if="showEmpty">
      <ElEmpty
        :description="
          filterDescription
            ? `未找到符合${filterDescription}的文章 ${EmojiText[0]}`
            : `暂无文章数据 ${EmojiText[0]}`
        "
      />
    </div>

    <div style="display: flex; justify-content: center; margin-top: 20px">
      <ElPagination
        size="default"
        background
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :pager-count="9"
        layout="prev, pager, next, total,jumper"
        :total="total"
        :hide-on-single-page="true"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Picture as IconPicture, Delete } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  import { ref, onMounted, onActivated, computed, watch, onUnmounted } from 'vue'
  import { router } from '@/router'
  import { useDateFormat } from '@vueuse/core'
  import { Search } from '@element-plus/icons-vue'
  import EmojiText from '@/utils/ui/emojo'
  import { getArticleList, deleteArticle as deleteArticleApi } from '@/api/articles'
  import { useCommon } from '@/composables/useCommon'
  import { RoutesAlias } from '@/router/routesAlias'
  import { formatNumber } from '@/utils/dataprocess/format'
  import { useRoute } from 'vue-router'
  import { articleEventBus } from '@/composables/useArticleStats'

  interface Article {
    id: string
    title: string
    home_img?: string
    type_name: string
    create_time: string
    count: number
    brief: string
    html_content: string
    p_date?: number
    visible: boolean
    isTop?: boolean
  }

  defineOptions({ name: 'ArticleList' })

  const route = useRoute()
  const yearVal = ref('全部')

  // 动态生成年份选项
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = ['全部']
    // 生成从当前年份往前8年的选项
    for (let i = 0; i < 8; i++) {
      years.push((currentYear - i).toString())
    }
    return years
  }

  const options = generateYearOptions()

  const searchVal = ref('')
  const articleList = ref<Article[]>([])
  const currentPage = ref(1)
  const pageSize = ref(40)
  // const lastPage = ref(0)
  const total = ref(0)
  const isLoading = ref(true)
  const batchLoading = ref(false)
  const forceRefreshKey = ref(0)

  // 多选相关
  const selectedArticles = ref<string[]>([])

  const showEmpty = computed(() => {
    return articleList.value.length === 0 && !isLoading.value
  })

  const hasActiveFilters = computed(() => {
    return searchVal.value.trim() !== '' || yearVal.value !== '全部'
  })

  // 计算当前筛选状态的描述
  const filterDescription = computed(() => {
    if (yearVal.value !== '全部' && searchVal.value.trim()) {
      return `年份"${yearVal.value}"和关键词"${searchVal.value}"`
    } else if (yearVal.value !== '全部') {
      return `年份"${yearVal.value}"`
    } else if (searchVal.value.trim()) {
      return `关键词"${searchVal.value}"`
    }
    return ''
  })

  onMounted(() => {
    getArticleListData({ backTop: false })
  })

  const handleArticleUpdated = () => {
    getArticleListData({ backTop: false })
  }

  articleEventBus.on('article:updated', handleArticleUpdated)

  onUnmounted(() => {
    articleEventBus.off('article:updated', handleArticleUpdated)
  })

  // 组件激活时检查是否需要刷新图片缓存
  onActivated(() => {
    // 检查是否从编辑页面返回
    const fromEdit = sessionStorage.getItem('fromArticleEdit')
    if (fromEdit) {
      console.log('组件激活：检测到从编辑页面返回，刷新图片缓存')
      // 强制刷新图片缓存
      forceRefreshKey.value = Date.now()
      // 刷新数据
      setTimeout(() => {
        getArticleListData({ backTop: false })
      }, 100)
      // 清除标记
      sessionStorage.removeItem('fromArticleEdit')
    }
  })

  // 监听路由参数变化，处理从发布页面跳转回来的刷新
  watch(
    () => route.query.refresh,
    (newRefresh) => {
      if (newRefresh) {
        console.log('检测到发布成功刷新参数，重新加载数据')
        // 重置到第一页并刷新数据
        currentPage.value = 1
        // 强制刷新图片显示
        forceRefreshKey.value = Date.now()
        // 延迟刷新以确保路由参数清除完成
        setTimeout(() => {
          getArticleListData({ backTop: true })
        }, 100)
        // 清除查询参数，避免重复触发
        router.replace({ path: route.path, query: {} })
      }
    }
    // 注意：不要使用 immediate: true，避免在组件挂载时清除参数
  )

  // 监听路由变化，检测从编辑页面返回
  watch(
    () => route.fullPath,
    (newPath, oldPath) => {
      // 如果从文章编辑页面返回到列表页面
      if (oldPath && oldPath.includes('/article/publish') && newPath.includes('/article/list')) {
        console.log('从编辑页面返回，刷新图片缓存')
        // 强制刷新图片缓存
        forceRefreshKey.value = Date.now()
        // 延迟刷新数据，确保能获取到最新的文章信息
        setTimeout(() => {
          getArticleListData({ backTop: false })
        }, 200)
      }
    }
  )

  // 监听组件激活状态，当从其他页面返回时刷新
  watch(
    () => route.name,
    (newName, oldName) => {
      // 当路由名称变化到文章列表页面时
      if (newName === 'ArticleList' && oldName && oldName.toString().includes('Publish')) {
        console.log('路由激活检测：从编辑页面返回到列表页面')
        // 强制刷新图片缓存
        forceRefreshKey.value = Date.now()
        // 延迟刷新数据
        setTimeout(() => {
          getArticleListData({ backTop: false })
        }, 300)
      }
    }
  )

  // 监听query参数变化，检测refresh参数
  watch(
    () => route.query.refresh,
    (newRefresh) => {
      if (newRefresh) {
        console.log('检测到refresh参数，刷新图片缓存和数据')
        // 强制刷新图片缓存
        forceRefreshKey.value = Date.now()
        // 刷新数据
        setTimeout(() => {
          getArticleListData({ backTop: false })
        }, 100)
        // 清除refresh参数，避免重复触发
        router.replace({ 
          path: route.path,
          query: { ...route.query, refresh: undefined }
        })
      }
    },
    { immediate: true }
  )

  // 监听年份变化，实现动态渲染
  watch(yearVal, (newYear, oldYear) => {
    if (newYear !== oldYear) {
      console.log(`年份从 ${oldYear} 变更为 ${newYear}`)
      currentPage.value = 1 // 重置分页
      getArticleListData({ backTop: false })
    }
  })

  // 搜索文章
  const searchArticle = () => {
    currentPage.value = 1 // 重置到第一页
    getArticleListData({ backTop: true })
  }

  // 处理年份变化 - 动态渲染文章
  const handleYearChange = (selectedYear: string) => {
    console.log('年份变化:', selectedYear)
    yearVal.value = selectedYear
    currentPage.value = 1 // 重置到第一页
    // 立即触发文章列表更新
    getArticleListData({ backTop: true })
  }

  // 搜索框清空事件
  const onSearchClear = () => {
    currentPage.value = 1
    getArticleListData({ backTop: true })
  }

  // 搜索框输入事件
  const onSearchInput = (value: string) => {
    // 如果搜索框被清空，自动刷新列表显示所有文章
    if (!value.trim()) {
      currentPage.value = 1
      getArticleListData({ backTop: false })
    }
  }

  // 重置所有筛选条件
  const resetFilters = () => {
    searchVal.value = ''
    yearVal.value = '全部'
    currentPage.value = 1
    getArticleListData({ backTop: true })
  }

  // 清除搜索筛选
  const clearSearchFilter = () => {
    searchVal.value = ''
    currentPage.value = 1
    getArticleListData({ backTop: true })
  }

  // 清除年份筛选
  const clearYearFilter = () => {
    yearVal.value = '全部'
    currentPage.value = 1
    getArticleListData({ backTop: true })
  }

  const getArticleListData = async ({ backTop = false }) => {
    isLoading.value = true

    try {
      // 构建查询参数
      const params: Record<string, any> = {
        page: currentPage.value,
        size: pageSize.value,
        admin: 'true' // 后台管理系统标识，可以看到所有文章
      }

      // 只有当搜索值不为空时才添加搜索参数
      if (searchVal.value.trim()) {
        params.searchVal = searchVal.value.trim()
      }

      // 年份筛选参数 - 确保正确传递给后端
      if (yearVal.value && yearVal.value !== '全部') {
        params.year = yearVal.value
      }

      const res = await getArticleList(params)

      if (res) {
        // 处理统一API响应格式
        let articlesData: Record<string, any>[] | undefined
        let totalCount: number | undefined
        let currentPageNum: number | undefined
        let pageSizeNum: number | undefined

        // 检查是否是新的统一API格式
        if (res.data && res.data.articles) {
          articlesData = res.data.articles
          totalCount = res.data.total
          currentPageNum = res.data.currentPage
          pageSizeNum = res.data.pageSize
        } else if (res.articles) {
          // 兼容旧格式
          articlesData = res.articles
          totalCount = res.total
          currentPageNum = res.currentPage
          pageSizeNum = res.pageSize
        } else if (Array.isArray(res)) {
          // 直接是数组格式
          articlesData = res
          totalCount = res.length
          currentPageNum = currentPage.value
          pageSizeNum = pageSize.value
        } else {
          articlesData = []
          totalCount = 0
        }

        const articles = Array.isArray(articlesData) ? articlesData : []

        // 调试：显示原始数据结构
        if (articles.length > 0) {
          console.log('原始文章数据示例:', articles[0])
        }

        // 转换数据格式以适配现有UI
        const transformedArticles = articles.map((item: Record<string, any>): Article => ({
          id: item._id || item.id,
          title: item.title,
          home_img: item.image || item.home_img,
          type_name: item.category || item.type_name || '默认分类',
          create_time: item.publishDate || item.create_time || item.updateDate, // 显示时间保持原字段
          count: item.views || item.count || 0,
          brief: item.excerpt || item.brief || '',
          html_content: item.contentHtml || item.html_content || '',
          p_date: item.p_date, // 保留 p_date 字段用于年份筛选
          visible: item.visible !== false, // 处理可见性字段，默认为true
          isTop: item.isTop === true
        }))

        // 置顶优先排序；置顶内按发布时间倒序
        const parseDate = (a: Article) => (a.create_time ? Date.parse(a.create_time) : 0)
        const sortedList = transformedArticles.slice().sort((a, b) => {
          const ap = a.isTop ? 1 : 0
          const bp = b.isTop ? 1 : 0
          if (ap !== bp) return bp - ap
          return parseDate(b) - parseDate(a)
        })

        // 后端已经处理了年份筛选，前端直接使用返回的数据
        articleList.value = sortedList
        // 强制刷新图片显示
        forceRefreshKey.value = Date.now()
        
        // 调试信息：显示筛选结果
        if (yearVal.value && yearVal.value !== '全部') {
          console.log(`年份 ${yearVal.value} 筛选结果: ${transformedArticles.length} 篇文章`)
          
          // 调试信息：显示文章的年份信息
          if (transformedArticles.length > 0) {
            console.log('筛选后的文章年份信息:')
            transformedArticles.slice(0, 5).forEach((item: Article) => {
              console.log(`- ${item.title}: p_date=${item.p_date}, publishDate=${item.create_time}`)
            })
          }
        }

        total.value = totalCount || articleList.value.length
        currentPage.value = currentPageNum || currentPage.value
        pageSize.value = pageSizeNum || pageSize.value
      } else {
        articleList.value = []
        total.value = 0
      }

      if (backTop) {
        useCommon().scrollToTop()
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
      articleList.value = []
      total.value = 0

      // 显示错误提示
      ElMessage.error('获取文章列表失败，请检查网络连接或稍后重试')
    } finally {
      isLoading.value = false
    }
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    getArticleListData({ backTop: true })
  }

  const toEdit = (item: Article) => {
    router.push({
      path: RoutesAlias.ArticlePublish,
      query: {
        id: item.id
      }
    })
  }

  const toAddArticle = () => {
    router.push({
      path: RoutesAlias.ArticlePublish
    })
  }

  // 处理图片URL，确保本地图片使用正确的端口
  const getImageUrl = (imageUrl?: string, forceRefresh = false) => {
    if (!imageUrl) return ''

    let finalUrl = imageUrl

    // 如果是本地上传的图片，修正端口号
    if (imageUrl.includes('localhost:3006')) {
      finalUrl = imageUrl.replace('localhost:3006', 'localhost:3001')
    }

    // 如果是相对路径，添加正确的基础URL
    if (imageUrl.startsWith('/uploads/')) {
      finalUrl = `http://localhost:3001${imageUrl}`
    }

    // 移除时间戳参数，避免图片加载错误
    // 如果需要强制刷新，使用版本号而不是时间戳
    if (forceRefresh) {
      const separator = finalUrl.includes('?') ? '&' : '?'
      finalUrl += `${separator}v=${forceRefreshKey.value}`
    }

    return finalUrl
  }

  // 多选功能
  const toggleSelection = (id: string, selected: boolean | string | number, event?: Event) => {
    // 阻止事件冒泡，防止触发父元素的点击事件
    if (event) {
      event.stopPropagation()
    }
    
    if (selected) {
      if (!selectedArticles.value.includes(id)) {
        selectedArticles.value.push(id)
      }
    } else {
      selectedArticles.value = selectedArticles.value.filter((item) => item !== id)
    }
  }

  const clearSelection = () => {
    selectedArticles.value = []
  }

  // 删除单篇文章
  const deleteArticle = (article: Article) => {
    ElMessageBox.confirm(`确定要删除文章《${article.title}》吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteArticleApi(article.id)
          ElMessage.success('删除成功')
          
          // 触发文章统计更新事件
          const { articleEventBus } = await import('@/composables/useArticleStats')
          articleEventBus.emit('article:deleted', article)
          articleEventBus.emit('article:stats:refresh')
          
          // 重新加载数据
          getArticleListData({ backTop: false })
          // 如果当前文章被选中，从选中列表中移除
          if (selectedArticles.value.includes(article.id)) {
            selectedArticles.value = selectedArticles.value.filter((id) => id !== article.id)
          }
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {
        // 用户取消删除
      })
  }

  // 批量删除
  const batchDelete = () => {
    if (selectedArticles.value.length === 0) {
      ElMessage.warning('请先选择要删除的文章')
      return
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedArticles.value.length} 篇文章吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        batchLoading.value = true
        try {
          // 批量删除文章
          const deletePromises = selectedArticles.value.map((id) => deleteArticleApi(id))
          await Promise.all(deletePromises)

          ElMessage.success('批量删除成功')
          
          // 触发文章统计更新事件
          const { articleEventBus } = await import('@/composables/useArticleStats')
          articleEventBus.emit('article:batch:deleted', selectedArticles.value)
          articleEventBus.emit('article:stats:refresh')
          
          // 清空选中列表
          selectedArticles.value = []
          // 重新加载数据
          getArticleListData({ backTop: true })
        } catch (error) {
          console.error('批量删除失败:', error)
          ElMessage.error('批量删除失败')
        } finally {
          batchLoading.value = false
        }
      })
      .catch(() => {
        // 用户取消删除
      })
  }
</script>

<style lang="scss" scoped>
  .article-list {
    .custom-segmented .el-segmented {
      height: 40px;
      padding: 6px;

      --el-border-radius-base: 8px;
    }

    // 批量操作栏
    .batch-operation-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      margin: 16px 0;
      // background-color: #f5f7fa;
      border-radius: 4px;
      border: 1px solid #ebeef5;

      .batch-info {
        font-size: 14px;
        color: #606266;
      }

      .batch-actions {
        display: flex;
        gap: 12px;
      }
    }

    // 批量操作栏下滑动画
    .slide-down-enter-active {
      animation: slide-down 0.3s ease-out;
    }

    .slide-down-leave-active {
      animation: slide-down 0.3s ease-out reverse;
    }

    @keyframes slide-down {
      0% {
        opacity: 0;
        transform: translateY(-20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .list {
      margin-top: 20px;

      .offset {
        display: flex;
        flex-wrap: wrap;
        width: calc(100% + 20px);

        .item {
          box-sizing: border-box;
          width: calc(20% - 20px);
          margin: 0 20px 20px 0;
          cursor: pointer;
          border: 1px solid var(--art-border-color);
          border-radius: calc(var(--custom-radius) / 2 + 2px) !important;
          position: relative;
          transition: all 0.3s;

          &:hover {
            .el-button {
              opacity: 1 !important;
            }

            .delete-btn {
              opacity: 1;
            }
          }

          .top {
            position: relative;
            aspect-ratio: 16/9.5;

            .image-container {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
              border-radius: calc(var(--custom-radius) / 2 + 2px)
                calc(var(--custom-radius) / 2 + 2px) 0 0;

              &:hover {
                .image-overlay {
                  opacity: 1;
                }
              }

              .cover {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                object-fit: cover;
                background: var(--art-gray-200);
                border-radius: calc(var(--custom-radius) / 2 + 2px)
                  calc(var(--custom-radius) / 2 + 2px) 0 0;
                transition: transform 0.3s ease;

                .image-slot {
                  font-size: 26px;
                  color: var(--art-gray-400);
                }
              }

              // 多选复选框
              .selection-checkbox {
                position: absolute;
                bottom: 8px;
                right: 8px;
                z-index: 10;
                border-radius: 4px;
                padding: 4px;
                transition: all 0.3s;
              }

              .image-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                opacity: 0;
                transition: opacity 0.3s ease;
                cursor: pointer;

                .preview-icon {
                  font-size: 24px;
                  margin-bottom: 8px;
                }

                .preview-text {
                  font-size: 12px;
                  font-weight: 500;
                }
              }
            }

            .type {
              position: absolute;
              top: 5px;
              right: 5px;
              padding: 5px 4px;
              font-size: 12px;
              color: rgba(#fff, 0.8);
              background: rgba($color: #000, $alpha: 60%);
              border-radius: 4px;
              z-index: 5;
            }

            .visibility-status {
              position: absolute;
              top: 5px;
              left: 5px;
              padding: 3px 6px;
              font-size: 11px;
              color: #fff;
              background: rgba(#52c41a, 0.8);
              border-radius: 3px;
              font-weight: 500;
              z-index: 5;

              &.hidden {
                background: rgba(#ff4d4f, 0.8);
              }
            }

            .top-badge {
              position: absolute;
              top: 30px;
              left: 5px;
              padding: 3px 6px;
              font-size: 11px;
              color: #fff;
              background: rgba(#f59e0b, 0.85);
              border-radius: 3px;
              font-weight: 500;
              z-index: 5;
            }

            .delete-btn {
              position: absolute;
              top: 5px;
              right: 30px;
              width: 24px;
              height: 24px;
              background: rgba(#ff4d4f, 0.8);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
              cursor: pointer;
              opacity: 0;
              transition: opacity 0.3s;
              z-index: 5;

              &:hover {
                background: rgba(#ff4d4f, 1);
              }
            }
          }

          .bottom {
            padding: 5px 10px;

            h2 {
              font-size: 16px;
              font-weight: 500;
              color: #333;

              @include ellipsis();
            }

            .info {
              display: flex;
              justify-content: space-between;
              width: 100%;
              height: 25px;
              margin-top: 6px;
              line-height: 25px;

              .text {
                display: flex;
                align-items: center;
                color: var(--art-text-gray-600);

                i {
                  margin-right: 5px;
                  font-size: 14px;
                }

                span {
                  font-size: 13px;
                  color: var(--art-gray-600);
                }

                .line {
                  width: 1px;
                  height: 12px;
                  margin: 0 15px;
                  background-color: var(--art-border-dashed-color);
                }
              }

              .el-button {
                opacity: 0;
                transition: all 0.3s;
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-notebook) {
    .article-list {
      .list {
        .offset {
          .item {
            width: calc(25% - 20px);
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-ipad-pro) {
    .article-list {
      .list {
        .offset {
          .item {
            width: calc(33.333% - 20px);

            .bottom {
              h2 {
                font-size: 16px;
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-ipad) {
    .article-list {
      .list {
        .offset {
          .item {
            width: calc(50% - 20px);
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-phone) {
    .article-list {
      .list {
        .offset {
          .item {
            width: calc(100% - 20px);
          }
        }
      }
    }
  }
</style>
