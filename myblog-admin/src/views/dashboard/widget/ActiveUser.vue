<template>
  <div class="card art-custom-card">
    <ArtBarChart
      class="chart"
      barWidth="50%"
      height="13.7rem"
      :showAxisLine="false"
      :data="monthlyArticleData"
      :xAxisData="monthLabels"
      :key="refreshKey"
    />
    <div class="text">
      <h3 class="box-title">文章发表统计</h3>
      <p class="subtitle">比上月 <span class="text-success">{{ currentMonthGrowth }}</span></p>
      <p class="subtitle">每月文章发表数量统计，帮助您了解内容创作趋势</p>
    </div>
    <div class="list">
      <div v-for="(item, index) in list" :key="index">
        <p>{{ item.num }}</p>
        <p class="subtitle">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import { useArticleStats, articleEventBus } from '@/composables/useArticleStats'

  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  
  // 使用文章统计 Composable
  const { 
    articleStats, 
    refreshKey, 
    averageMonthlyArticles, 
    currentMonthGrowth, 
    fetchArticleStats 
  } = useArticleStats()
  
  // 从全局状态获取数据
  const monthlyArticleData = computed(() => articleStats.value.monthlyArticleData)
  const totalArticles = computed(() => articleStats.value.totalArticles)
  const currentMonthArticles = computed(() => articleStats.value.currentMonthArticles)

  const list = computed(() => [
    { name: '总文章数', num: totalArticles.value.toString() },
    { name: '本月发表', num: currentMonthArticles.value.toString() },
    { name: '平均月发表', num: averageMonthlyArticles.value.toString() },
    { name: '月同比', num: currentMonthGrowth.value }
  ])

  // 监听路由变化，当从文章编辑页面返回时刷新数据
  const handleRouteChange = () => {
    const fromEdit = sessionStorage.getItem('fromArticleEdit')
    if (fromEdit) {
      console.log('ActiveUser.vue: 检测到从编辑页面返回，刷新统计数据')
      sessionStorage.removeItem('fromArticleEdit')
      fetchArticleStats()
    }
  }

  onMounted(async () => {
    console.log('ActiveUser.vue: 组件挂载，获取文章统计数据')
    await fetchArticleStats()
    
    // 监听路由变化
    handleRouteChange()
    
    // 监听文章相关事件
    articleEventBus.on('article:stats:refresh', fetchArticleStats)
  })

  onUnmounted(() => {
    // 清理事件监听
    articleEventBus.off('article:stats:refresh', fetchArticleStats)
  })
</script>

<style lang="scss" scoped>
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 420px;
    padding: 16px;

    .chart {
      box-sizing: border-box;
      width: 100%;
      height: 220px;
      padding: 10px;
      border-radius: calc(var(--custom-radius) / 2 + 4px) !important;
    }

    .text {
      margin-left: 3px;

      h3 {
        margin-top: 20px;
        font-size: 18px;
        font-weight: 500;
      }

      p {
        margin-top: 5px;
        font-size: 14px;

        &:last-of-type {
          height: 42px;
          margin-top: 5px;
        }
      }
    }

    .list {
      display: flex;
      justify-content: space-between;
      margin-left: 3px;

      > div {
        flex: 1;

        p {
          font-weight: 400;

          &:first-of-type {
            font-size: 24px;
            color: var(--art-gray-900);
          }

          &:last-of-type {
            font-size: 13px;
          }
        }
      }
    }
  }

  .dark {
    .card {
      .chart {
        background: none;
      }
    }
  }

  @media screen and (max-width: $device-phone) {
    .dark {
      .card {
        .chart {
          padding: 15px 0 0 !important;
        }
      }
    }
  }
</style>
