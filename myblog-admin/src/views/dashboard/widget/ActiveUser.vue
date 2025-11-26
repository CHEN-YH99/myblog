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
      <h3 class="box-title">{{ $t('dashboard.activeUser.title') }}</h3>
      <p class="subtitle">{{ $t('dashboard.activeUser.monthOverMonth') }} <span class="text-success">{{ currentMonthGrowth }}</span></p>
      <p class="subtitle">{{ $t('dashboard.activeUser.desc') }}</p>
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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const monthLabels = computed(() => [
    t('dashboard.months[0]'), t('dashboard.months[1]'), t('dashboard.months[2]'), t('dashboard.months[3]'),
    t('dashboard.months[4]'), t('dashboard.months[5]'), t('dashboard.months[6]'), t('dashboard.months[7]'),
    t('dashboard.months[8]'), t('dashboard.months[9]'), t('dashboard.months[10]'), t('dashboard.months[11]')
  ])
  
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
    { name: t('dashboard.activeUser.totalArticles'), num: totalArticles.value.toString() },
    { name: t('dashboard.activeUser.currentMonth'), num: currentMonthArticles.value.toString() },
    { name: t('dashboard.activeUser.averageMonthly'), num: averageMonthlyArticles.value.toString() },
    { name: t('dashboard.activeUser.mom'), num: currentMonthGrowth.value }
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
