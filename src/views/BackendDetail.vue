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
    case '后端语言':
      return [
        { id: nanoid(), title: 'Java', image: '', content: 'Java 是企业级应用开发的主流语言' },
        { id: nanoid(), title: 'Python', image: '', content: 'Python 是数据科学和Web开发的热门语言' },
        { id: nanoid(), title: 'Go', image: '', content: 'Go 是Google开发的高性能并发语言' },
        { id: nanoid(), title: 'Node.js', image: '', content: 'Node.js 让JavaScript运行在服务端' }
      ]
    case '工具':
      return [
        { id: nanoid(), title: 'Spring Boot', image: '', content: 'Java生态最流行的微服务框架' },
        { id: nanoid(), title: 'Django', image: '', content: 'Python的全功能Web开发框架' },
        { id: nanoid(), title: 'Docker', image: '', content: '容器化部署和管理工具' },
        { id: nanoid(), title: 'Redis', image: '', content: '高性能的内存数据库和缓存' }
      ]
    case '大模型开发':
      return [
        { id: nanoid(), title: 'LangChain', image: '', content: '大语言模型应用开发框架' },
        { id: nanoid(), title: 'Transformers', image: '', content: 'Hugging Face的预训练模型库' },
        { id: nanoid(), title: 'OpenAI API', image: '', content: 'OpenAI提供的GPT模型接口' },
        { id: nanoid(), title: 'LlamaIndex', image: '', content: '构建LLM应用的数据框架' }
      ]
    case '推荐网站':
      return [
        { id: nanoid(), title: 'Stack Overflow', image: '', content: '程序员问答社区和技术交流平台' },
        { id: nanoid(), title: 'GitHub', image: '', content: '全球最大的代码托管和协作平台' },
        { id: nanoid(), title: 'Docker Hub', image: '', content: '容器镜像的官方仓库' },
        { id: nanoid(), title: 'Postman', image: '', content: 'API开发和测试的强大工具' }
      ]
    default:
      return []
  }
}

// 响应式计算当前显示的数据
const state = computed(() => {
  const type = route.query.type as string
  return getStateByType(type || '后端语言')
})

</script>
<style scoped lang="scss">
</style>