<template>
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/kahs.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">相册</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer />
  </div>
   <!-- 内容 -->
  <div v-if="articleslist.length" class="timeline_content animate__animated animate__fadeInUp">
    <!-- 标签栏 -->
    <div class="about-me tags-info">
      <section class="tag-cloud">
        <div class="photo-scroll-container">
          <div v-for="(item,index) in articleslist" :key="index" class="photo-item">
            <router-link :to="'/article/'+item._id">
              <img :src="item.image" :alt="item.title || '文章图片'" class="album-image" />
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
  <div v-else class="empty">
    <el-empty description="暂无文章" :image-size="200" />
  </div>
  <Footer />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const { articles: articleslist, initArticles, cleanup } = useArticles()

// 组件挂载时初始化数据
onMounted(async () => {
  await initArticles()
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.tags-info {
  width: 50%;
  margin: 50px auto 200px auto;
  @media (max-width: 768px) {
  .tag-cloud {
    .photo-scroll-container {
      // 平板显示3张图片
      max-width: calc(3 * 180px + 2 * 20px + 40px);
    }
    
    .photo-item {
      width: 180px;
      height: 180px;
    }
  }
    width: 80% !important; // 平板宽度
    margin: 50px auto 200px auto !important; // 外边距完全一样
  }
  
  @media (max-width: 480px) {
    width: 95% !important; // 手机宽度
    margin: 50px auto 200px auto !important; // 外边距完全一样
    .tag-cloud {
    .photo-scroll-container {
      // 手机显示2张图片
      max-width: calc(2 * 150px + 1 * 20px + 40px);
    }
    
    .photo-item {
      width: 150px;
      height: 150px;
    }
  }
  }
  .tag-cloud {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px; // 固定容器高度
    width: 100%;
    
    .photo-scroll-container {
      display: flex;
      gap: 20px;
      width: 100%;
      height: 250px;
      overflow-x: auto; // 横向滚动
      overflow-y: hidden;
      padding: 20px 0;

      // 只显示4张图片的宽度
      max-width: calc(4 * 200px + 3 * 20px + 40px); // 4张图片 + 3个间距 + 左右padding

      // 自定义横向滚动条样式
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;

        &:hover {
          background: #555;
        }
      }
    }

    .photo-item {
      flex-shrink: 0; // 防止图片被压缩
      width: 200px;
      height: 200px;

      .album-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      }
    }
  }
}
</style>

