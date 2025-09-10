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
    <div class= "tags-info">
      <section class="tag-cloud">
        <ul>
          <li v-for="(item, index) in imglist" :key="index">
            <router-link :to="'/photoalbum/' + item.title" class="photo-link">
              <div class="image-container">
                <img :src="item.src" alt="" />
                <div class="overlay">
                  <span class="title">{{ item.title }}</span>
                  <span class="content">{{ item.content }}</span>
                </div>
              </div>
            </router-link>
          </li>
        </ul>
      </section>
    </div>
  </div>
  <div v-else class="empty">
    <el-empty description="暂无文章" :image-size="200" />
  </div>
  <Footer />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { useArticles } from '@/composables/useArticles' // 引入获取到文章列表数据文件
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'

const { articles: articleslist, initArticles, cleanup } = useArticles()

const imglist = reactive([
  {
    src: 'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEBpP1owPE9sjhjPULfhsAa6x3o9qzkpgACoBcAAj4FCFY1JYUdfzclzTYE.jpg',
    title: '旅游',
    content:'记录沿途风景'

  },
  {
    src: 'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEBpPtowPE6kBGQDVlmMv2xhTkmgo0blAACnhcAAj4FCFZMm707q5R3SDYE.jpg',
    title: '美食',
    content:'唯有美食与爱不可辜负'
  },
  {
    src: 'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEBpP5owPE-CuRR6pvlieBCd28osVLqSwACoRcAAj4FCFbCPU9AEolMaDYE.jpg',
    title: '日常生活',
    content:'记录平凡生活'
  },
  {
    src: 'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEBpPpowPE6i1ILFM_VVdUOsPDmEFxPgwACnRcAAj4FCFa18pjg0YacVzYE.jpg',
    title: '工作',
    content:'记录工作日常'
  },
])

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
  .tag-cloud {
    width: 70%;
    margin: 100px auto 200px auto;
    box-shadow: 2px 2px 10px #ccc;
    ul {
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 8px; // 添加元素间距
      padding: 5px; // 添加内边距
      li {
        transition: all 0.3s ease-in-out;
        list-style-type: none;
        flex: 0 0 calc(25% - 6px); // 每行4个元素，减去gap的影响
        &:hover {
          transform: translateY(-3px);
          .image-container {
            img {
              filter: saturate(3); // 饱和度增加
            }
            
            .overlay {
              background-color: rgba(0, 0, 0, 0.4); // 背景变深
            }
          }
        }
        .image-container {
          position: relative;
          img {
            transition: filter 0.3s ease-in-out;
            width: 100%;
            height: 160px;
            object-fit: cover;
            border-radius: 10px;
          }
          .overlay {
            transition: background-color 0.3s ease-in-out;
            position: absolute;
            top: 10px;
            left: 0;
            right: 0;
            margin: 0 auto;
            width: 80%;
            background-color: rgba(0, 0, 0, 0.2);
            color: white;
            font-weight: bolder;
            padding: 10px;
            border-radius: 10px;
            .title {
              display: block;
              text-align: left;
              font-size: 16px;
            }
            .content {
              display: block;
              text-align: left;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>

