<template>
  <div class="footer">
    <p>© 小灰的个人博客</p>
    <p>Powered by Vue3</p>
    <div class="badges">
      <a
        v-for="(item, index) in footlist"
        :key="index"
        :href="item.imgurl"
        target="_blank"
        rel="noopener noreferrer"
        :title="`前往：${item.imgurl}`"
      >
        <img :src="item.img" :alt="`站点徽章-${index + 1}`" />
      </a>
    </div>
  </div>
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
    img: 'https://img.shields.io/badge/MongDB-Database-gren',
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
  position: relative;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  a {
    display: flex;
    justify-content: center;
  }
  p {
    text-align: center;
    font-size: 12px;
    color: #aeaeae;
  }
  img {
    margin: 20px 5px;
  }
}
</style>
