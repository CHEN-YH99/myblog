<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="meta">
        <p>© 小灰的个人博客</p>
        <p class="icp">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            粤ICP备2025506377号-1
          </a>
        </p>
      </div>
      <div class="badges" aria-label="技术栈与服务徽章">
        <a
          v-for="(item, index) in footlist"
          :key="index"
          :href="item.imgurl"
          target="_blank"
          rel="noopener noreferrer"
          :title="`前往：${item.imgurl}`"
          class="badge-link"
        >
          <img :src="item.img" :alt="`站点徽章-${index + 1}`" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const footlist = reactive([
  {
    id: 1,
    img: 'https://img.shields.io/badge/腾讯云-Server-orange',
    imgurl:
      'https://cloud.tencent.com/',
  },
  {
    id: 2,
    img: 'https://img.shields.io/badge/MongoDB-Database-green',
    imgurl: 'https://www.mongodb.com/zh-cn/docs/',
  },
  {
    id: 3,
    img: 'https://img.shields.io/badge/Node-Backend-blue',
    imgurl: 'https://nodejs.cn/en/download/prebuilt-installer',
  },
  {
    id: 4,
    img: 'https://img.shields.io/badge/Vue3-Frontend-yellow',
    imgurl: 'https://cn.vuejs.org/',
  },
])
</script>

<style scoped lang="scss">
.footer {
  width: 100%;
  margin-top: 48px; /* 和上面内容保持合理距离 */
  padding: 20px 12px 40px;
  background: transparent; /* 保持与页面背景一致 */
  --footer-text-color: #000;
  --footer-link-color: #000;
}
/* 深色主题（如果你是通过给 html/body 或根节点加 .dark 来切换主题） */
:global(.dark) .footer {
  --footer-text-color: #fff;
  --footer-link-color: #fff;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.footer {
  --footer-text-color: #000; /* 浅色默认黑 */
  --footer-link-color: #000;
}
:global(.dark) .footer {
  --footer-text-color: #fff; /* 深色白 */
  --footer-link-color: #fff;
}
.footer {
  --footer-text-color: #000;
  --footer-link-color: #000;
}
:root.dark .footer,
.dark .footer {
  --footer-text-color: #fff;
  --footer-link-color: #fff;
}
.meta {
  line-height: 1.6;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.meta p {
  margin: 0;
  font-size: 12px;
  color: var(--footer-text-color);
  white-space: nowrap;        /* 避免断行 */
}
.icp {
  display: inline-block;
  margin-top: 2px;
}
.icp a {
  color: var(--footer-link-color);
  text-decoration: none;
}
.icp a:hover {
  text-decoration: underline;
}

/* 深色模式下稍微提亮透明底色，提升可读性 */
@media (prefers-color-scheme: dark) {
  /* 已去除背景色：深色模式无需额外处理 */
}
.badges {
  /* 水平布局 */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 12px; /* 行间与列间间距 */
  margin-top: 6px;
}
.badge-link {
  display: inline-flex; /* 避免 a 变为块级导致垂直堆叠 */
}
.badge-link img {
  display: block;
  height: 20px;
  width: auto;
}

/* 小屏优化 */
@media (max-width: 768px) {
  .footer {
    margin-top: 32px;
    padding-bottom: 32px;
  }
  .badge-link img {
    height: 18px;
  }
}
</style>
