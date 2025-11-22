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
       <i class="iconfont end-image" :class="item.image" style="font-size: 40px;"></i>
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
import '@/assets/style/iconfont.scss'

const route = useRoute()

// 根据不同的卡片类型定义不同的数据
const getStateByType = (type: string) => {
  switch(type) {
    case '后端语言':
      return [
        { id: nanoid(), title: 'Java', image: 'icon-java', content: 'Java 是企业级应用开发的主流语言', url: 'https://www.oracle.com/java/' },
        { id: nanoid(), title: 'Python', image: 'icon-python', content: 'Python 是数据科学和Web开发的热门语言', url: 'https://www.python.org/' },
        { id: nanoid(), title: 'Go', image: 'icon-go', content: 'Go 是Google开发的高性能并发语言', url: 'https://golang.google.cn/' },
        { id: nanoid(), title: 'Node.js', image: 'icon-node-js', content: 'Node.js 让JavaScript运行在服务端', url: 'https://nodejs.org/'}
      ]
    case '工具':
      return [
        { id: nanoid(), title: 'Spring Boot', image: 'icon-spring-boot', content: 'Java生态最流行的微服务框架', url: 'https://spring.io/projects/spring-boot/'},
        { id: nanoid(), title: 'Django', image: 'icon-diangonggongqian', content: 'Python的全功能Web开发框架', url: 'https://www.djangoproject.com/'},
        { id: nanoid(), title: 'Docker', image: 'icon-rongqiDoker', content: '容器化部署和管理工具', url: 'https://www.docker.com/'},
        { id: nanoid(), title: 'Redis', image: 'icon-redius', content: '高性能的内存数据库和缓存', url: 'https://redis.io/'}
      ]
    case '大模型开发':
      return [
        { id: nanoid(), title: 'LangChain', image: 'icon-LangChainbianpai', content: '大语言模型应用开发框架', url: 'https://github.com/LangChain/langchain'},
        { id: nanoid(), title: 'Transformers', image: 'icon-Transformer', content: 'Hugging Face的预训练模型库' , url: 'https://huggingface.co/docs/transformers/index'},
        { id: nanoid(), title: 'OpenAI API', image: 'icon-openai-fill', content: 'OpenAI提供的GPT模型接口', url: 'https://openai.com/api/'},
        { id: nanoid(), title: 'LlamaIndex', image: 'icon-XML', content: '构建LLM应用的数据框架', url: 'https://docs.llamalab.com/llamaindex/'}
      ]
    case '推荐网站':
      return [
        { id: nanoid(), title: 'Stack Overflow', image: 'icon-stack-overflow', content: '程序员问答社区和技术交流平台', url: 'https://stackoverflow.com/'},
        { id: nanoid(), title: 'GitHub', image: 'icon-github-fill', content: '全球最大的代码托管和协作平台', url: 'https://github.com/'},
        { id: nanoid(), title: 'Docker Hub', image: 'icon-docker_hub_fill', content: '容器镜像的官方仓库', url: 'https://hub.docker.com/'},
        { id: nanoid(), title: 'Postman', image: 'icon-postman', content: 'API开发和测试的强大工具', url: 'https://www.postman.com/'}
      ]
    default:
      return []
  }
}

// 跳转到官网

const goToWebsite = (url: string) => {
  window.open(url, '_blank')
}

// 响应式计算当前显示的数据
const state = computed(() => {
  const type = route.query.type as string
  return getStateByType(type || '后端语言')
})

</script>
<style scoped lang="scss">
</style>
