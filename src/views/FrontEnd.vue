<template>
  <!-- 头部大图 -->
  <div class="page_header">
    <div class="large-img">
      <img src="../assets/images/frontend.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer  />
  </div>
  <!-- 内容 -->
  <div class="frontend_content animate__animated animate__fadeInUp">
   <ul class="frontend-item">
     <li v-for="item in state" :key="item.title">
       <el-image class="frontend-image" style="width: 60px; height: 60px" />
       <div class="frontend-description">
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
import { ref, reactive, toRefs, onMounted} from 'vue'
import {nanoid} from 'nanoid'
import WaveContainer from '@/components/WaveContainer.vue';
import Footer from '@/components/Footer.vue';

const state = reactive([
  {
    id: nanoid(),
    title: '前端框架',
    image: '',
    content: '前端开发用到的js框架,如vue、react、angular等'
  },
    {
    id: nanoid(),
    title: 'UI框架',
    image: '',
    content: '已经封装好的组件库,如element-ui、ant-design-vue等'
  },
    {
    id: nanoid(),
    title: '学习',
    image: '',
    content: '学习前端的一些资料'
  },
  {
    id: nanoid(),
    title: '推荐网站',
    image: '',
    content: '学习或者开发好用的网站'
  }
])
</script>
<style scoped lang="scss">
// .frontend_content{
//   padding: 0 1rem;
//   .frontend-item {
//     display: flex;
//     flex-wrap: wrap;
//     justify-content: center;
//     .frontend-image {
//       border-radius: 50%;
//       flex-shrink: 0;
//     }
//     .frontend-description{
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       margin: 0 1rem;
//     }
//     li {
//       display: flex;
//       flex: 1;
//       align-items: center;
//       padding: 1rem;
//       // background-color: aquamarine;
//       box-shadow: 1px 1px 10px 1px #abaaaaca;
//       list-style-type: none;
//       margin: 50px 5px 150px 5px;
//       cursor: pointer;
//     }
//   }
// }
.frontend_content{
  padding: 0 1rem;
  .frontend-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    .frontend-image {
      border-radius: 50%;
      flex-shrink: 0;
    }
    .frontend-description{
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0 1rem;
    }
    li {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 1rem;
      box-shadow: 1px 1px 10px 1px #abaaaaca;
      list-style-type: none;
      margin: 50px 5px 150px 5px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); // 添加过渡动画
      transform: translateY(0); // 初始位置
      
      // 悬停效果
      &:hover {
        transform: translateY(-8px) scale(1.02); // 向上移动同时轻微放大
        box-shadow: 2px 8px 25px 2px rgba(171, 170, 170, 0.3);
      }
      
      // 点击效果
      &:active {
        transform: translateY(-3px) scale(0.98); // 点击时轻微缩小
        transition: all 0.1s ease;
      }
    }
  }
}

// 小于768px
@media screen and (max-width: 768px){
  .frontend_content{
    .frontend-item {
      margin: 30px 0;
      li {
        flex: 0 0 80%;
        margin: 5px auto;
      }
    }
  }
}
</style>