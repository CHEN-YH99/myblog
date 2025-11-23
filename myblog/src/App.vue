<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import { onMounted, onBeforeUnmount } from 'vue'
import { useTokenCheck } from '@/composables/useTokenCheck'
import { useExternalLinkConfirm } from '@/composables/useExternalLinkConfirm'

// 启动token定期检查
const { startTokenCheck } = useTokenCheck()
// 外链确认
const { enable: enableExternal, disable: disableExternal } = useExternalLinkConfirm()

onMounted(() => {
  startTokenCheck()
  enableExternal()
})

onBeforeUnmount(() => {
  disableExternal()
})
</script>

<template>
  <div class="app-container theme-transition">
    <NavBar />
    <!-- 极简安全渲染：直接渲染 RouterView，排除过渡/插槽影响 -->
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: transparent;
}

/* 加载状态样式（保留，后续若恢复 Suspense 可复用） */
.loading-fallback {
  padding: 60px 20px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-fallback :deep(.el-skeleton) {
  width: 100%;
  max-width: 800px;
}
</style>
