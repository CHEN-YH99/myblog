<template>
  <div class="photo-category-detail">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img :src="currentCategory?.coverImage || defaultCover" :alt="currentCategory?.title ? `${currentCategory.title} 头图` : '相册分类头图'" />
        <div class="inner-header flex">
          <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">
            {{ currentCategory?.title || '相册分类' }}
          </h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>

    <!-- 分类信息（仅在分类可展示时显示） -->
    <div v-if="isCategoryActive && currentCategory" class="category-info">
      <div class="category-header">
        <h2>{{ currentCategory.title }}</h2>
        <p class="description">{{ currentCategory.description }}</p>
        <div class="meta">
          <span>照片数量: {{ displayedPhotoCount }}</span>
          <span>创建时间: {{ createdAtStr }}</span>
          <span>更新时间: {{ updatedAtStr }}</span>
        </div>
      </div>
    </div>

    <!-- 照片列表（仅在分类可展示时显示） -->
    <div class="photo-list" v-if="isCategoryActive">
      <div v-if="photos.length" class="photos-grid">
        <div
          v-for="photo in photos"
          :key="photo._id"
          class="photo-item"
          @click="showPhotoDetail(photo)"
        >
          <div class="photo-container">
            <img :src="photo.thumbnailUrl || photo.imageUrl" :alt="photo.title" />
            <div class="photo-overlay">
              <div class="photo-info">
                <h3>{{ photo.title }}</h3>
                <p>{{ photo.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <el-empty description="该分类暂无照片" :image-size="200" />
      </div>
    </div>
    <div v-else class="empty">
      <el-empty description="该分类已被禁用" :image-size="200" />
    </div>

    <!-- 照片详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedPhoto?.title"
      width="80%"
      class="photo-dialog"
    >
      <div v-if="selectedPhoto" class="photo-dialog-content">
        <img :src="selectedPhoto.imageUrl" :alt="selectedPhoto.title" class="photo-preview" />
        <div class="photo-details">
          <h3>{{ selectedPhoto.title }}</h3>
          <p>{{ selectedPhoto.description }}</p>
          <div class="photo-meta">
            <span>上传时间: {{ formatDate(selectedPhoto.uploadDate) }}</span>
            <span>浏览次数: {{ selectedPhoto.viewCount }}</span>
            <span>点赞数: {{ selectedPhoto.likeCount }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import defaultCover from '@/assets/images/kahs.jpeg'
import { usePhotoCategories } from '@/composables/usePhotoCategories'
import { usePhotos } from '@/composables/usePhotos'
import { getPhotoCategoryDetail } from '@/api/photoCategories'

// 路由信息
const route = useRoute()

// 图片分类数据
const { photoCategories, initPhotoCategories } = usePhotoCategories()

// 照片数据
const { photos, initPhotos } = usePhotos()

// 当前分类
const currentCategory = ref<Api.PhotoCategory.PhotoCategoryItem | null>(null)

// 照片详情弹窗
const dialogVisible = ref(false)
const selectedPhoto = ref<Api.Photo.PhotoItem | null>(null)

// 刷新控制
let isRefreshing = false
const refreshTimer = ref<number | null>(null)

// 分类是否展示（兼容 status/isVisible）
const isCategoryActive = computed(() => {
  const c: any = currentCategory.value
  if (!c) return false
  const statusActive = c.status ? c.status === 'active' : true
  const visibleActive = c.isVisible !== false
  return statusActive && visibleActive
})

// 动态展示：照片数量与时间
const displayedPhotoCount = computed(() => {
  if (!isCategoryActive.value) return 0
  const clientCount = photos.value.length
  if (clientCount > 0) return clientCount
  const serverCount = currentCategory.value?.photoCount
  if (typeof serverCount === 'number') return serverCount
  return 0
})
const createdAtStr = computed(() =>
  currentCategory.value?.createdAt ? formatDate(currentCategory.value.createdAt) : '-',
)

// 取服务端分类更新时间与客户端最新上传图片时间的较大者，确保与管理端一致或更“新”
const latestPhotoUploadAtMs = computed(() => {
  const times = photos.value
    .map((p) => p.uploadDate)
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime())
    .filter((t) => !Number.isNaN(t))
  return times.length ? Math.max(...times) : 0
})
const computedUpdatedAtISO = computed(() => {
  const serverMs = currentCategory.value?.updatedAt
    ? new Date(currentCategory.value.updatedAt).getTime()
    : 0
  const ms = Math.max(serverMs, latestPhotoUploadAtMs.value)
  return ms ? new Date(ms).toISOString() : ''
})
const updatedAtStr = computed(() =>
  computedUpdatedAtISO.value ? formatDate(computedUpdatedAtISO.value) : '-',
)

/**
 * 格式化日期
 */
const formatDate = (dateInput?: string | Date) => {
  if (!dateInput) return '-'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 显示照片详情
 */
const showPhotoDetail = (photo: Api.Photo.PhotoItem) => {
  selectedPhoto.value = photo
  dialogVisible.value = true
}

/**
 * 拉取分类详情与照片列表（可重复调用，用于轮询）
 */
const fetchCategoryAndPhotos = async (id: string) => {
  if (!id || isRefreshing) return
  isRefreshing = true
  try {
    // 先尝试从列表中匹配（兼容 id 和 _id）
    currentCategory.value =
      photoCategories.value.find((category) => category._id === id || category.id === id) ||
      currentCategory.value

    // 再请求详情，确保 photoCount / createdAt / updatedAt 为最新
    const detail = await getPhotoCategoryDetail(id)
    if (detail) {
      currentCategory.value = detail as Api.PhotoCategory.PhotoCategoryItem
    }

    // 分类被禁用时不再加载照片并清空列表（兼容 status/inactive 与 isVisible=false）
    const c: any = currentCategory.value
    if (c && (c.status === 'inactive' || c.isVisible === false)) {
      photos.value = []
      return
    }

    // 计算用于查询照片列表的分类ID（优先 id，其余 _id）
    const fetchCategoryId = currentCategory.value?.id || currentCategory.value?._id || id
    await initPhotos({ categoryId: fetchCategoryId, isVisible: true })

    // 如果按 id 查询没有数据，回退用 _id 再查一次（兼容历史数据存储 categoryId 为 _id 的情况）
    if (
      photos.value.length === 0 &&
      currentCategory.value?._id &&
      currentCategory.value._id !== fetchCategoryId
    ) {
      await initPhotos({
        categoryId: currentCategory.value._id,
        isVisible: true,
      })
    }
  } catch (e) {
    console.warn('刷新分类与照片数据失败: ', e)
  } finally {
    isRefreshing = false
  }
}

/**
 * 初始化数据 + 开启轮询
 */
onMounted(async () => {
  // 初始化图片分类列表（确保有本地缓存可匹配）
  await initPhotoCategories({ isVisible: true })

  const routeId = route.params.id as string
  await fetchCategoryAndPhotos(routeId)

  // 取消定时刷新：不再使用 setInterval 轮询
})

// 路由切换时，立即刷新到新分类
watch(
  () => route.params.id,
  async (newId) => {
    if (typeof newId === 'string' && newId) {
      await fetchCategoryAndPhotos(newId)
    }
  },
)

// 组件卸载清理轮询
onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
})
</script>

<style scoped lang="scss">
.photo-category-detail {
  // 修复海浪跳动与缝隙：提升内容层级
  .category-info,
  .photo-list,
  .empty {
    position: relative;
    z-index: 2;
  }

  .category-info {
    width: 80%;
    margin: 50px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(212, 212, 212, 0.723);

    .category-header {
      h2 {
        font-size: 24px;
        margin-bottom: 15px;
      }

      .description {
        font-size: 16px;
        color: #b1b1b1;
        margin-bottom: 20px;
        line-height: 1.6;
      }

      .meta {
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #888;

        span {
          &:not(:last-child)::after {
            content: ' | ';
            margin-left: 10px;
          }
        }
      }
    }
  }

  .photo-list {
    width: 80%;
    margin: 30px auto;

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;

      .photo-item {
        cursor: pointer;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

          .photo-overlay {
            opacity: 1;
          }
        }

        .photo-container {
          position: relative;
          width: 100%;
          padding-top: 100%; // 1:1 宽高比

          img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          &:hover img {
            transform: scale(1.05);
          }

          .photo-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: flex-end;
            padding: 20px;

            .photo-info {
              color: white;

              h3 {
                font-size: 16px;
                margin-bottom: 5px;
              }

              p {
                font-size: 14px;
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }

  .photo-dialog {
    .photo-dialog-content {
      .photo-preview {
        width: 100%;
        max-height: 60vh;
        object-fit: contain;
        margin-bottom: 20px;
      }

      .photo-details {
        h3 {
          font-size: 20px;
          margin-bottom: 10px;
        }

        p {
          font-size: 16px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .photo-meta {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #888;

          span {
            &:not(:last-child)::after {
              content: ' | ';
              margin-left: 10px;
            }
          }
        }
      }
    }
  }

  .empty {
    text-align: center;
    padding: 50px 0;
  }
}
</style>
