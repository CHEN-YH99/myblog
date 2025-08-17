<template>
  <nav class="sticky top-0 z-40 border-b border-white/10 bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-slate-900/30">
    <div class="max-w-7xl mx-auto h-12 px-4 flex items-center justify-between">
      <!-- 左侧：头像 + 搜索图标 -->
      <div class="flex items-center gap-4">
        <div class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20">
          <img src="../assets/images/hui.svg" alt="avatar" class="w-full h-full object-cover" />
        </div>
        <button aria-label="搜索" class="text-slate-200 hover:text-white transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
          </svg>
        </button>
      </div>

      <!-- 右侧：菜单 -->
      <ul class="flex items-center gap-5 text-sm text-slate-200">
        <!-- 主页 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7.5 7.5A1 1 0 0 0 2.5 11H4v6a1 1 0 0 0 1 1h3v-4h4v4h3a1 1 0 0 0 1-1v-6h1.5a1 1 0 0 0 .707-1.707l-7.5-7.5z"/>
            </svg>
            <span>主页</span>
          </a>
        </li>

        <!-- 时间轴 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 1 1 0 0-16 8 8 0 0 0 0 16zm1-12a1 1 0 1 0-2 0v3.586l2.121 2.121a1 1 0 1 0 1.415-1.414L11 8.586V6z" clip-rule="evenodd"/>
            </svg>
            <span>时间轴</span>
          </a>
        </li>

        <!-- 更多 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm4 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </svg>
            <span>更多</span>
          </a>
        </li>

        <!-- 分类 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 5a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm-1 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/>
            </svg>
            <span>分类</span>
          </a>
        </li>

        <!-- 相册 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 3a2 2 1 1 0 0 4 2 2 0 0 0 0-4zm-3 7l3.5-3.5 2.5 2.5L13 10l3 4H4z"/>
            </svg>
            <span>相册</span>
          </a>
        </li>

        <!-- 说说 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.8 8.8 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/>
            </svg>
            <span>说说</span>
          </a>
        </li>

        <!-- 友链 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 1 1 2.828 2.828l-3 3a2 2 0 0 1-2.828 0 1 1 0 0 0-1.414 1.414 4 4 0 0 0 5.656 0l3-3a4 4 0 1 0-5.656-5.656l-1.5 1.5a1 1 0 1 0 1.414 1.414l1.5-1.5z" clip-rule="evenodd"/>
            </svg>
            <span>友链</span>
          </a>
        </li>

        <!-- 留言 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z"/>
            </svg>
            <span>留言</span>
          </a>
        </li>

        <!-- 登录 -->
        <li>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 15a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1H4v-1z" clip-rule="evenodd"/>
            </svg>
            <span>登录</span>
          </a>
        </li>

        <!-- 主题切换 -->
        <li>
          <button aria-label="主题" class="text-slate-200 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"/>
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
</script>