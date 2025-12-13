<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="meta">
        <p>© 小灰的个人博客</p>
        <p>Powered by Vue3</p>
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
    img: 'https://img.shields.io/badge/阿里云-Escalation-orange',
    imgurl:
      'https://help.aliyun.com/zh/ecs/?spm=5176.28507329.nav-v2-dropdown-menu-3.d_main_0_0.384a2868VFVVko&scm=20140722.M_9489640._.V_1',
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
    img: 'https://img.shields.io/badge/华为云-Escalation-yellow',
    imgurl: 'https://www.huaweicloud.com/',
  },
])
</script>

<style scoped lang="scss">
.footer {
  width: 100%;
  margin-top: 48px; /* 和上面内容保持合理距离 */
  padding: 20px 12px 40px;
  background: transparent; /* 保持与页面背景一致 */
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.meta {
  text-align: center;
  line-height: 1.6;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.meta p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.82); /* 灰白色 */
}
.icp {
  display: inline-block;
  margin-top: 2px;
}
.icp a {
  color: rgba(255, 255, 255, 0.82); /* 灰白色 */
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
