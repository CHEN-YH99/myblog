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
     <li v-for="item in state" :key="item.id" @click="goToWebsite(item.url)" >
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
        { id: nanoid(), title: 'Vue', image: '', content: 'Vue.js 是一个渐进式JavaScript框架', url: 'https://vuejs.org/' },
        { id: nanoid(), title: 'React', image: '', content: 'React 是Facebook开发的用户界面库',url: 'https://reactjs.org/' },
        { id: nanoid(), title: 'Angular', image: '', content: 'Angular 是Google开发的完整框架',url: 'https://angular.io/' },
        { id: nanoid(), title: 'Svelte', image: '', content: 'Svelte 是新兴的编译时框架', url: 'https://svelte.dev/'},
        { id: nanoid(), title: 'Jquery', image: '', content: 'jQuery是JavaScript最流行的库', url: 'https://jquery.com/'},
        { id: nanoid(), title: 'Ember', image: '', content: 'Ember.js 是一个JavaScript MVC框架', url: 'https://emberjs.com/'},
        { id: nanoid(), title: 'Backbone', image: '', content: 'Backbone.js 是一个JavaScript MVC框架', url: 'http://backbonejs.org/'},
        { id: nanoid(), title: 'Bootstrap', image: '', content: 'Bootstrap 是最流行的前端框架', url: 'https://getbootstrap.com/'},
        { id: nanoid(), title: 'Foundation', image: '', content: 'Foundation 是最流行的响应式框架', url: 'https://get.foundation/'},
        { id: nanoid(), title: 'Tailwind CSS', image: '', content: 'Tailwind CSS 是一个CSS框架', url: 'https://tailwindcss.com/'},
      ]
    case 'UI框架':
      return [
        { id: nanoid(), title: 'Element Plus', image: '', content: 'Vue 3的桌面端组件库', url: 'https://element-plus.org/'},
        { id: nanoid(), title: 'Ant Design Vue', image: '', content: '企业级UI设计语言和组件库', url: 'https://antdv.com/'},
        { id: nanoid(), title: 'Vuetify', image: '', content: 'Material Design组件框架' , url: 'https://vuetifyjs.com/'},
        { id: nanoid(), title: 'Naive UI', image: '', content: '比较完整的Vue 3组件库', url: 'https://www.naiveui.com/zh-CN/os-theme'},
        { id: nanoid(), title: 'Vuetify', image: '', content: 'Vuetify 是一个无需设计技能的 UI 库', url: 'https://vuetifyjs.com/en/'},
        { id: nanoid(), title: 'Quasar', image: '', content: 'Quasar 是一个基于 Vue.js 的全栈框架', url: 'https://quasar.dev/'},
        { id: nanoid(), title: 'BalmUI', image: '', content: '轻量级Vue 3组件库', url: 'https://balm.js.org/'},
        { id: nanoid(), title: 'Windi CSS', image: '', content: '基于Tailwind CSS的实用工具', url: 'https://windicss.org/'},
        { id: nanoid(), title: 'Chakra UI', image: '', content: '基于React的UI组件库', url: 'https://chakra-ui.com/'},
        { id: nanoid(), title: 'PrimeVue', image: '', content: '基于Vue 3的UI组件库', url: 'https://www.primefaces.org/primevue/'},
        { id: nanoid(), title: 'Mint UI', image: '', content: '基于Vue 2的移动端组件库', url: 'https://mint-ui.github.io/#!/zh-cn'},
            ]
    case '学习':
      return [
        { id: nanoid(), title: 'MDN Web Docs', image: '', content: 'Web开发最权威的文档' , url: 'https://developer.mozilla.org/zh-CN/docs/Web'},
        { id: nanoid(), title: 'Vue官方文档', image: '', content: 'Vue.js官方学习资料', url: 'https://v3.cn.vuejs.org/'},
        { id: nanoid(), title: '现代JavaScript教程', image: '', content: '深入学习JavaScript', url: 'https://javascript.info/'},
        { id: nanoid(), title: 'TypeScript手册', image: '', content: 'TypeScript官方学习指南', url: 'https://www.typescriptlang.org/docs/handbook/intro.html'}
        
      ]
    case '推荐网站':
      return [
        { id: nanoid(), title: 'GitHub', image: '', content: '全球最大的代码托管平台', url: 'https://github.com/' },
        { id: nanoid(), title: 'CodePen', image: '', content: '在线代码编辑和分享平台' , url: 'https://codepen.io/'},
        { id: nanoid(), title: 'Stack Overflow', image: '', content: '程序员问答社区' , url: 'https://stackoverflow.com/'},
        { id: nanoid(), title: 'Can I Use', image: '', content: '浏览器兼容性查询网站', url: 'https://caniuse.com/'}
      ]
    default:
      return []
  }
}

// 点击卡片跳转到对应网站
const goToWebsite = (url: string) => {
  if (url) {
    window.open(url, '_blank')
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