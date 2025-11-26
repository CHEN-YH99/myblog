<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">{{ $t('dashboard.salesOverview.title') }}</h4>
        <p class="subtitle">{{ $t('dashboard.salesOverview.totalViews') }} <span class="text-success">{{ totalViews.toLocaleString() }}</span></p>
      </div>
    </div>
    <ArtLineChart
      class="chart"
      height="calc(100% - 40px)"
      :data="monthlyViewsData"
      :xAxisData="xAxisData"
      :showAreaColor="true"
      :showAxisLine="false"
      :key="refreshKey"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import { useArticleStats, articleEventBus } from '@/composables/useArticleStats'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const xAxisData = computed(() => [
    t('dashboard.months[0]'),
    t('dashboard.months[1]'),
    t('dashboard.months[2]'),
    t('dashboard.months[3]'),
    t('dashboard.months[4]'),
    t('dashboard.months[5]'),
    t('dashboard.months[6]'),
    t('dashboard.months[7]'),
    t('dashboard.months[8]'),
    t('dashboard.months[9]'),
    t('dashboard.months[10]'),
    t('dashboard.months[11]')
  ])

  // 使用文章统计 Composable
  const { 
    articleStats, 
    refreshKey, 
    fetchArticleStats 
  } = useArticleStats()
  
  // 从全局状态获取数据
  const monthlyViewsData = computed(() => articleStats.value.monthlyViewsData)
  const totalViews = computed(() => articleStats.value.totalViews)

  // 监听路由变化，当从文章编辑页面返回时刷新数据
  const handleRouteChange = () => {
    const fromEdit = sessionStorage.getItem('fromArticleEdit')
    if (fromEdit) {
      console.log('SalesOverview.vue: 检测到从编辑页面返回，刷新统计数据')
      fetchArticleStats()
    }
  }

  onMounted(async () => {
    console.log('SalesOverview.vue: 组件挂载，获取访问量统计数据')
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
    padding: 20px 0 30px;

    .card-header {
      padding: 0 18px !important;
    }

    .chart {
      box-sizing: border-box;
      width: 100%;
      padding: 20px 20px 0;
    }
  }

  @media screen and (max-width: $device-phone) {
    .card {
      height: 280px;
    }
  }
</style>

<style lang="scss" scoped>
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 420px;
    padding: 20px 0 30px;

    .card-header {
      padding: 0 18px !important;
    }

    .chart {
      box-sizing: border-box;
      width: 100%;
      padding: 20px 20px 0;
    }
  }

  @media screen and (max-width: $device-phone) {
    .card {
      height: 280px;
    }
  }
</style>
