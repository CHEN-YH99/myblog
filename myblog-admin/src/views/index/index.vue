<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <main id="app-main">
      <div class="app-header">
        <ArtHeaderBar />
      </div>
      <div class="app-content">
        <ArtPageContent />
      </div>

      <div class="app-footer">
        <span class="icp-badge">ICP备</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2025506377号-2</a>
      </div>
    </main>

    <div class="app-global">
      <ArtGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppLayout' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
