<template>
  <div class="reading-progress-container">
    <div 
      class="reading-progress-bar" 
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

// 计算阅读进度
const calculateProgress = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  
  if (scrollHeight <= 0) {
    progress.value = 0
    return
  }
  
  const scrollPercent = (scrollTop / scrollHeight) * 100
  progress.value = Math.min(100, Math.max(0, scrollPercent))
}

// 节流函数
const throttle = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastExecTime = 0
  
  return function (...args: unknown[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func.apply(null, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

const throttledCalculateProgress = throttle(calculateProgress, 16) // 约60fps

onMounted(() => {
  calculateProgress()
  window.addEventListener('scroll', throttledCalculateProgress)
  window.addEventListener('resize', throttledCalculateProgress)
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledCalculateProgress)
  window.removeEventListener('resize', throttledCalculateProgress)
})
</script>

<style scoped>
.reading-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.reading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  transition: width 0.1s ease-out;
  border-radius: 0 2px 2px 0;
}
</style>