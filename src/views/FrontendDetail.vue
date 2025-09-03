<template>
   <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/frontdetail.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer  />
  </div>
   <!-- 内容 -->
  <div class="end_content animate__animated animate__fadeInUp">
   <ul class="end-item" >
     <li v-for="item in state" :key="item.id" >
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {nanoid} from 'nanoid'
import WaveContainer from '@/components/WaveContainer.vue';
import Footer from '@/components/Footer.vue';
import  '@/assets/style/common/morecategories.scss'

const route = useRoute()

// 根据不同的卡片类型定义不同的数据
const getStateByType = (type: string) => {
  switch(type) {
    case '前端框架':
      return [
        { id: nanoid(), title: 'Vue', image: '', content: 'Vue.js 是一个渐进式JavaScript框架' },
        { id: nanoid(), title: 'React', image: '', content: 'React 是Facebook开发的用户界面库' },
        { id: nanoid(), title: 'Angular', image: '', content: 'Angular 是Google开发的完整框架' },
        { id: nanoid(), title: 'Svelte', image: '', content: 'Svelte 是新兴的编译时框架' }
      ]
    case 'UI框架':
      return [
        { id: nanoid(), title: 'Element Plus', image: '', content: 'Vue 3的桌面端组件库' },
        { id: nanoid(), title: 'Ant Design Vue', image: '', content: '企业级UI设计语言和组件库' },
        { id: nanoid(), title: 'Vuetify', image: '', content: 'Material Design组件框架' },
        { id: nanoid(), title: 'Naive UI', image: '', content: '比较完整的Vue 3组件库' }
      ]
    case '学习':
      return [
        { id: nanoid(), title: 'MDN Web Docs', image: '', content: 'Web开发最权威的文档' },
        { id: nanoid(), title: 'Vue官方文档', image: '', content: 'Vue.js官方学习资料' },
        { id: nanoid(), title: '现代JavaScript教程', image: '', content: '深入学习JavaScript' },
        { id: nanoid(), title: 'TypeScript手册', image: '', content: 'TypeScript官方学习指南' }
      ]
    case '推荐网站':
      return [
        { id: nanoid(), title: 'GitHub', image: '', content: '全球最大的代码托管平台' },
        { id: nanoid(), title: 'CodePen', image: '', content: '在线代码编辑和分享平台' },
        { id: nanoid(), title: 'Stack Overflow', image: '', content: '程序员问答社区' },
        { id: nanoid(), title: 'Can I Use', image: '', content: '浏览器兼容性查询网站' }
      ]
    default:
      return []
  }
}

// 响应式计算当前显示的数据
const state = computed(() => {
  const type = route.query.type as string
  return getStateByType(type || '前端框架')
})
</script>

<style scoped lang="scss">
</style>