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
</style>
