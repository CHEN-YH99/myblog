<template>
   <!-- 头部大图 -->
  <div class="page-header">
    <div class="large-img">
      <img src="../assets/images/backend.jpeg" alt="" />
      <div class="inner-header flex">
        <h1 class="animate__animated animate__backInDown">{{ $route.meta.title }}</h1>
      </div>
    </div>
    <!-- 海水波浪 -->
    <WaveContainer  />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs, onMounted} from 'vue'
import WaveContainer from '@/components/WaveContainer.vue';
</script>
<style scoped lang="scss">
</style>