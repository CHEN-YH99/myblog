<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import { onMounted } from 'vue'
import { useTokenCheck } from '@/composables/useTokenCheck'

// 启动token定期检查
const { startTokenCheck } = useTokenCheck()

onMounted(() => {
  startTokenCheck()
})
</script>

<template>   
  <div class="app-container theme-transition">
    <NavBar/>
    <!-- 添加路由过渡动画 -->
    <router-view v-slot="{ Component, route }">
      <transition 
        :name="(route.meta?.transition as string) || 'fade'"
      >
        <Suspense v-if="Component">
          <component :is="Component" :key="route.fullPath" />
          <template #fallback>
            <div class="loading-fallback">
              <el-skeleton :rows="5" animated />
            </div>
          </template>
        </Suspense>
      </transition>
    </router-view>
  </div>
</template>


<style scoped>
.app-container {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: transparent;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 滑动过渡效果 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 缩放过渡效果 */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* 加载状态样式 */
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
