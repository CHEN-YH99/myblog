<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">{{ $t('dashboard.dynamic.title') }}</h4>
        <p class="subtitle">{{ $t('dashboard.dynamic.added') }}<span class="text-success">+6</span></p>
      </div>
    </div>

    <div class="list">
      <div v-for="(item, index) in list" :key="index">
        <span class="user">{{ item.username }}</span>
        <span class="type">{{ $t(item.typeKey) }}</span>
        <span class="target">{{ item.target }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue-demi'

  const list = reactive([
    {
      username: '中小鱼',
      typeKey: 'dashboard.dynamic.types.followed',
      target: '誶誶淰'
    },
    {
      username: '何小荷',
      typeKey: 'dashboard.dynamic.types.publishedArticle',
      target: 'Vue3 + Typescript + Vite 项目实战笔记'
    },
    {
      username: '誶誶淰',
      typeKey: 'dashboard.dynamic.types.askedQuestion',
      target: '主题可以配置吗'
    },
    {
      username: '发呆草',
      typeKey: 'dashboard.dynamic.types.redeemedItem',
      target: '《奇特的一生》'
    },
    {
      username: '甜筒',
      typeKey: 'dashboard.dynamic.types.closedQuestion',
      target: '发呆草'
    },
    {
      username: '冷月呆呆',
      typeKey: 'dashboard.dynamic.types.redeemedItem',
      target: '《高效人士的七个习惯》'
    }
  ])
</script>

<style lang="scss" scoped>
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 510px;
    padding: 0 25px;

    .header {
      display: flex;
      justify-content: space-between;
      padding: 20px 0 0;
    }

    .list {
      height: calc(100% - 100px);
      margin-top: 10px;
      overflow: hidden;

      > div {
        height: 70px;
        overflow: hidden;
        line-height: 70px;
        border-bottom: 1px solid var(--art-border-color);

        span {
          font-size: 13px;
        }

        .user {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }

        .type {
          margin: 0 8px;
        }

        .target {
          color: var(--main-color);
        }
      }
    }
  }
</style>
