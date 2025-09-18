<template>
  <div class="photo-category-detail">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img :src="currentCategory?.coverImage || defaultCover" alt="" />
        <div class="inner-header flex">
          <h1 class="animate__animated animate__backInDown">{{ currentCategory?.title || '相册分类' }}</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>

    <!-- 分类信息 -->
    <div v-if="currentCategory" class="category-info">
      <div class="category-header">
        <h2>{{ currentCategory.title }}</h2>
        <p class="description">{{ currentCategory.description }}</p>
        <div class="meta">
          <span>照片数量: {{ currentCategory.photoCount }}</span>
          <span>创建时间: {{ formatDate(currentCategory.createdAt) }}</span>
          <span>更新时间: {{ formatDate(currentCategory.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 照片列表 -->
    <div class="photo-list">
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import defaultCover from '@/assets/images/kahs.jpeg'
import { usePhotoCategories } from '@/composables/usePhotoCategories'
import { usePhotos } from '@/composables/usePhotos'

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

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
 * 初始化数据
 */
onMounted(async () => {
  // 初始化图片分类列表
  await initPhotoCategories()
  
  // 获取当前分类ID
  const categoryId = route.params.id as string
  
  // 查找当前分类
  currentCategory.value = photoCategories.value.find(
    category => category._id === categoryId
  ) || null
  
  // 获取该分类下的照片列表
  if (currentCategory.value) {
    await initPhotos({ categoryId })
  }
})
</script>

<style scoped lang="scss">
.photo-category-detail {
  .category-info {
    width: 80%;
    margin: 30px auto;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    .category-header {
      h2 {
        font-size: 24px;
        margin-bottom: 15px;
        color: #333;
      }
      
      .description {
        font-size: 16px;
        color: #666;
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
            content: " | ";
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
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        
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
              content: " | ";
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