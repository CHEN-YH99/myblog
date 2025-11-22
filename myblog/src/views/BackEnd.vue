<template>
   <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/backend.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer  />
  </div>
  <!-- 内容 -->
  <div class="end_content animate__animated animate__fadeInUp">
    <ul class="end-item">
      <li v-for="item in state" :key="item.id" @click="goToDetail(item)">
        <el-image class="end-image" style="width: 60px; height: 60px" />
        <div class="end-description">
          <h4>{{ item.title }}</h4>
          <p>{{ item.content }}</p>
        </div>
      </li>
    </ul>
  </div>
  <!-- 页脚 -->
  <Footer />
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import {nanoid} from 'nanoid'
import WaveContainer from '@/components/WaveContainer.vue';
import Footer from '@/components/Footer.vue';
import  '@/assets/style/common/morecategories.scss'

const router = useRouter();

const state = reactive([
  {
    id: nanoid(),
    title: '后端语言',
    image: '',
    content: '后端开发用到的框架,如Java、Python、Go等'
  },
    {
    id: nanoid(),
    title: '工具',
    image: '',
    content: '已经封装好的组件库,如element-ui、ant-design-vue等'
  },
    {
    id: nanoid(),
    title: '大模型开发',
    image: '',
    content: '学习大模型的相关框架和工具'
  },
  {
    id: nanoid(),
    title: '推荐网站',
    image: '',
    content: '后端学习或者开发好用推荐的网站'
  }
])

// 定义 item 类型接口
interface BackendItem {
  id: string;
  title: string;
  image: string;
  content: string;
}

// 跳转到详情页
const goToDetail = (item: BackendItem) => {
  router.push({
    path: '/backend/backendDetail',
    query: { 
      type: item.title,
    }
  })
}
</script>
<style scoped lang="scss">
</style>
