<template>
  <div class="frontend-wrapper">
    <!-- 头部大图 -->
    <div class="page_header">
      <div class="large-img">
        <img src="../assets/images/frontend.jpeg" alt="前端页面头图" />
        <div class="inner-header flex">
          <h1 v-typing="{ duration: 1000 }" class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
        </div>
      </div>
      <!-- 海水波浪 -->
      <WaveContainer />
    </div>
    <!-- 内容 -->
    <div class="end_content animate__animated animate__fadeInUp">
      <ul class="end-item">
        <li v-for="item in state" :key="item.id" @click="goToDetail(item)">
          <el-image class="end-image" style="width: 60px; height: 60px" alt="前端分类图标" />
          <div class="end-description">
            <h4>{{ item.title }}</h4>
            <p>{{ item.content }}</p>
          </div>
        </li>
      </ul>
    </div>
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import WaveContainer from '@/components/WaveContainer.vue'
import Footer from '@/components/Footer.vue'
import '@/assets/style/common/morecategories.scss'

const router = useRouter()

const state = reactive([
  {
    id: nanoid(),
    title: '前端框架',
    image: '',
    content: '前端开发用到的js框架,如vue、react、angular等',
  },
  {
    id: nanoid(),
    title: 'UI框架',
    image: '',
    content: '已经封装好的组件库,如element-ui、ant-design-vue等',
  },
  {
    id: nanoid(),
    title: '学习',
    image: '',
    content: '学习前端的一些资料',
  },
  {
    id: nanoid(),
    title: '推荐网站',
    image: '',
    content: '学习或者开发好用的网站',
  },
])

// 定义 item 类型接口
interface FrontendItem {
  id: string
  title: string
  image: string
  content: string
}

// 跳转到详情页
const goToDetail = (item: FrontendItem) => {
  router.push({
    path: '/frontend/frontendDetail',
    query: {
      type: item.title,
    },
  })
}
</script>

<style scoped lang="scss">
/* 主题色变量 */
.frontend-wrapper {
  --card-bg: rgba(255, 255, 255, 0.7);
  --card-bg-hover: rgba(255, 255, 255, 0.85);
  --card-shadow: rgba(0, 0, 0, 0.1);
  --card-icon-bg: rgba(0, 0, 0, 0.05);
  --card-title-color: #1f2937;
  --card-text-color: #6b7280;
  --card-glow-color: rgba(96, 165, 250, 0.5);
  --card-border-color: rgba(56, 189, 248, 0.3);
  --card-border-hover-color: rgba(96, 165, 250, 0.7);
}

html.dark .frontend-wrapper {
  --card-bg: rgba(30, 41, 59, 0.5);
  --card-bg-hover: rgba(30, 41, 59, 0.75);
  --card-shadow: rgba(0, 0, 0, 0.3);
  --card-icon-bg: rgba(226, 232, 240, 0.1);
  --card-title-color: #e2e8f0;
  --card-text-color: #94a3b8;
  --card-glow-color: rgba(96, 165, 250, 0.4);
  --card-border-color: rgba(56, 189, 248, 0.2);
  --card-border-hover-color: rgba(96, 165, 250, 0.5);
}

.end_content {
  position: relative;
  z-index: 2;
  margin-top: -1px; /* 消除缝隙 */
  padding: 2rem 0;
}

.end-item {
  :deep(li) {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: var(--card-bg);
    border: 1px solid transparent;
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
                background 0.35s ease,
                box-shadow 0.35s ease;

    /* 移除原有阴影 */
    box-shadow: none !important;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 16px;
      padding: 1px;
      background: linear-gradient(135deg, var(--card-border-color), var(--card-border-hover-color));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      opacity: 0.6;
      transition: opacity 0.35s ease;
    }

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150%;
      padding-bottom: 150%;
      border-radius: 50%;
      background: radial-gradient(circle, var(--card-glow-color) 0%, transparent 65%);
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: none;
    }

    &:hover {
      transform: translateY(-10px);
      background: var(--card-bg-hover);
      box-shadow: 0 25px 50px -12px var(--card-shadow) !important;

      &::before { opacity: 1; }
      &::after { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }

      .end-image {
        transform: scale(1.1);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
    }
  }

  :deep(.end-image) {
    border-radius: 12px;
    background-color: var(--card-icon-bg);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  :deep(.end-description) {
    h4 {
      color: var(--card-title-color);
      font-size: 1.1rem;
      font-weight: 600;
    }
    p {
      color: var(--card-text-color);
      font-size: 0.9rem;
    }
  }
}
</style>