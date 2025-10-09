<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
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
