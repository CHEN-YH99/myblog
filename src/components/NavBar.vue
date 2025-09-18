<template>
  <header class="navbar" :class="{ 'scroll-down': scrollDown, 'navbar': scrollUp,'is-hidden': isHidden }">
    <div class="navbar__inner">
      <el-avatar
        class="navbar__avatar"
        :size="32"
        :src="avatarUrl"
        alt="avatar"
      />

      <!-- 桌面端菜单 -->
      <el-menu
        :key="activeIndex"
        mode="horizontal"
        :default-active="activeIndex"
        class="navbar__menu"
        background-color="transparent"
        text-color="#00BFFF"
        active-text-color="#ffffff"
        :ellipsis="false"
        @select="(index) => activeIndex = index"
      >
        <el-menu-item index="search" class="navbar__search" title="搜索">
          <el-icon><Search /></el-icon>
        </el-menu-item>

        <el-menu-item index="home" @click="$router.push('/')">
          <el-icon><House /></el-icon>
          <span class="menu-text">主页</span>
        </el-menu-item>

        <el-menu-item index="timeline" @click="$router.push('/timeline')">
          <el-icon><Clock /></el-icon>
          <span class="menu-text">时间轴</span>
        </el-menu-item>
        
        <el-sub-menu index="more">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span class="menu-text">更多</span>
          </template>
          <el-menu-item index="frontend" @click="$router.push('/frontend')">
            <span>前端推荐</span>
          </el-menu-item>
          <el-menu-item index="backend" @click="$router.push('/backend')">
            <span>后端推荐</span>
          </el-menu-item>
        </el-sub-menu>


        <el-menu-item index="category" @click="$router.push('/category')">
          <el-icon><Collection /></el-icon>
          <span class="menu-text">分类</span>
        </el-menu-item>

        <el-menu-item index="photos" @click="$router.push('/photoAlbum')">
          <el-icon><Picture /></el-icon>
          <span class="menu-text">相册</span>
        </el-menu-item>

        <el-menu-item index="photo-category" @click="$router.push('/photo-category')">
          <el-icon><Folder /></el-icon>
          <span class="menu-text">相册分类</span>
        </el-menu-item>

        <el-menu-item index="talk">
          <el-icon><ChatLineRound /></el-icon>
          <span class="menu-text">说说</span>
        </el-menu-item>

        <el-menu-item index="links">
          <el-icon><LinkIcon /></el-icon>
          <span class="menu-text">友链</span>
        </el-menu-item>

        <el-menu-item index="board">
          <el-icon><MessageIcon /></el-icon>
          <span class="menu-text">留言</span>
        </el-menu-item>

        <el-menu-item index="login">
          <el-icon><User /></el-icon>
          <span class="menu-text">登录</span>
        </el-menu-item>

        <el-menu-item index="theme" class="navbar__switch" title="主题切换">
          
           <el-switch
            :model-value="is_Dark"
            @change="animateThemeSwitch"
            @click="rememberPointer"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            size="small"
          />
        </el-menu-item>
      </el-menu>

      <!-- 移动端操作区：搜索 + 菜单按钮 -->
      <div class="navbar__mobile" aria-label="移动端操作区">
        <button class="icon-btn" aria-label="搜索">
          <el-icon><Search /></el-icon>
        </button>
        <button class="icon-btn" aria-label="打开菜单" @click="drawer = true">
          <el-icon><MenuIcon /></el-icon>
        </button>
      </div>
    </div>

    <!-- 右侧抽屉：移动端菜单 -->
    <el-drawer
      v-model="drawer"
      direction="rtl"
      size="50%"
      :with-header="false"
      class="navbar-drawer"
      append-to-body
    >
      <div class="drawer__header">
        <div class="drawer__title">导航</div>
        
         <el-switch
          :model-value="is_Dark"
          @change="animateThemeSwitch"
          @click="rememberPointer"
          :active-action-icon="Moon"
          :inactive-action-icon="Sunny"
          size="small"
          aria-label="主题切换"
        />
      </div>

      <el-menu
        :key="mobileActiveIndex"
        class="drawer__menu"
        :default-active="mobileActiveIndex"
        background-color="transparent"
        text-color="#cfe8ff"
        active-text-color="#ffffff"
        @select="(index) => mobileActiveIndex = index"
      >
        <el-menu-item index="m-search">
          <el-icon><Search /></el-icon>
          <span>搜索</span>
        </el-menu-item>
        <el-menu-item index="m-home" @click="handleMobileNavigation('/')">
          <el-icon><House /></el-icon>
          <span>主页</span>
        </el-menu-item>
        <el-menu-item index="m-timeline" @click="handleMobileNavigation('/timeline')">
          <el-icon><Clock /></el-icon>
          <span>时间轴</span>
        </el-menu-item>
        <el-sub-menu index="m-more" >
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>更多</span>
          </template>
          <el-menu-item index="m-frontend" @click="handleMobileNavigation('/frontend')">
            <span>前端推荐</span>
          </el-menu-item>
          <el-menu-item index="m-backend" @click="handleMobileNavigation('/backend')">
            <span>后端推荐</span>
          </el-menu-item> 
        </el-sub-menu>
        <el-menu-item index="m-category" @click="handleMobileNavigation('/category')">
          <el-icon><Collection /></el-icon>
          <span>分类</span>
        </el-menu-item>
        <el-menu-item index="m-photos" @click="handleMobileNavigation('/photoAlbum')">
            <el-icon><Picture /></el-icon>
            <span>相册</span>
        </el-menu-item>
        <el-menu-item index="m-photo-category" @click="handleMobileNavigation('/photo-category')">
            <el-icon><Folder /></el-icon>
            <span>相册分类</span>
        </el-menu-item>
        <el-menu-item index="m-talk">
          <el-icon><ChatLineRound /></el-icon>
          <span>说说</span>
        </el-menu-item>
        <el-menu-item index="m-links">
          <el-icon><LinkIcon /></el-icon>
          <span>友链</span>
        </el-menu-item>
        <el-menu-item index="m-board">
          <el-icon><MessageIcon /></el-icon>
          <span>留言</span>
        </el-menu-item>
        <el-menu-item index="m-login">
          <el-icon><User /></el-icon>
          <span>登录</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
 import { is_Dark, toggleDark, animateThemeSwitch,rememberPointer} from '@/assets/ts/theme'
import {
  Search,
  House,
  Clock,
  Grid,
  Collection,
  Picture,
  ChatLineRound,
  Link as LinkIcon,
  Message as MessageIcon,
  User,
  Moon,
  Sunny,
  Menu as MenuIcon,
  Folder
} from '@element-plus/icons-vue'

import avatarUrl from '../assets/images/hui.svg'

const router = useRouter()
const route = useRoute()
const drawer = ref(false)

// 使用 ref 来控制活动菜单项，避免跳闪
const activeIndex = ref('')
const mobileActiveIndex = ref('')

// 获取活动菜单项的函数
const getActiveMenuItem = (path) => {
  if (path === '/') return 'home'
  if (path === '/timeline') return 'timeline'
  if (path.startsWith('/frontend')) return 'frontend'
  if (path.startsWith('/backend')) return 'backend'
  if (path.startsWith('/category')) return 'category'
  if (path.startsWith('/photoAlbum')) return 'photos'
  if (path.startsWith('/photo-category')) return 'photo-category'
  if (path.startsWith('/talk')) return 'talk'
  if (path.startsWith('/links')) return 'links'
  if (path.startsWith('/board')) return 'board'
  if (path.startsWith('/login')) return 'login'
  return 'home'
}

// 获取移动端活动菜单项的函数
const getMobileActiveMenuItem = (path) => {
  if (path === '/') return 'm-home'
  if (path === '/timeline') return 'm-timeline'
  if (path.startsWith('/frontend')) return 'm-frontend'
  if (path.startsWith('/backend')) return 'm-backend'
  if (path.startsWith('/category')) return 'm-category'
  if (path.startsWith('/photoAlbum')) return 'm-photos'
  if (path.startsWith('/photo-category')) return 'm-photo-category'
  if (path.startsWith('/talk')) return 'm-talk'
  if (path.startsWith('/links')) return 'm-links'
  if (path.startsWith('/board')) return 'm-board'
  if (path.startsWith('/login')) return 'm-login'
  return 'm-home'
}

// 初始化活动状态
const initActiveState = () => {
  const currentPath = route.path
  activeIndex.value = getActiveMenuItem(currentPath)
  mobileActiveIndex.value = getMobileActiveMenuItem(currentPath)
}

// 监听路由变化
watch(() => route.path, (newPath) => {
  activeIndex.value = getActiveMenuItem(newPath)
  mobileActiveIndex.value = getMobileActiveMenuItem(newPath)
}, { immediate: true })

// 处理移动端导航
const handleMobileNavigation = (path) => {
  drawer.value = false
  router.push(path)
}

// 监听滚动事件
import { 
  isHidden, 
  scrollDirection, 
  scrollDown, 
  scrollUp,
  initScrollListener, 
  removeScrollListener 
} from '@/assets/ts/navbar'

	// 组件挂载时，监听滚动事件和初始化活动状态
	onMounted(() => {
    initScrollListener()
    initActiveState()
  })
// 记得在组件卸载时移除监听器
  onBeforeUnmount(() => {
    removeScrollListener()
  })
</script>

<style scoped lang="scss">
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 5px;
  z-index: 1000;
  height: 48px;
  background: linear-gradient(180deg, rgba(8, 20, 40, 0.1), rgba(8, 20, 40, 0.2));
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(200, 230, 255, 0.12);
  transition: all .8s ease-in-out;
  transform: translateY(0);
}
// 滚动条下滑触发
.scroll-down {
  position: fixed;
  top: 0;
  left: 0;
  right: 5px;
  z-index: 1000;
  height: 48px;
  background: linear-gradient(180deg, rgba(8, 20, 40, 0.7), rgba(8, 20, 40, 0.55));
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(200, 230, 255, 0.12);
  transition: all .8s ease-in-out;
}
// 导航栏显示隐藏
.navbar.is-hidden {
  transform: translateY(-100%);
}

.navbar__inner {
  // max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex !important;
  align-items: center;
  justify-content: space-between !important;
}

.navbar__avatar {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35) inset;
  cursor: pointer;
  transform: rotate(0deg);
  transition: transform 1s ease-in-out;
}
// 头像图片旋转动画 */
.navbar__avatar:hover {
  transform: rotate(360deg);
  transition: transform 1s ease-in-out;
}

.navbar__logo {
  height: 32px;
  width: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

/* 桌面端菜单（默认显示） */
.navbar__menu {
  height: 48px;
  background: transparent !important;
  border-bottom: none !important;
}

/* 移动端操作区（默认隐藏） */
.navbar__mobile {
  display: none;
  gap: 6px;
  align-items: center;
}

.icon-btn {
  height: 32px;
  width: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #e0f2ff;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, border-color .2s ease;
}
.icon-btn:hover {
  background: rgba(255,255,255,.08);
  color: #fff;
  border-color: rgba(255,255,255,.35);
}

/* Element Plus 菜单样式微调（桌面端） */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding: 0 7px;
  font-size: 13px;
  color: #3293eea6;
  transition: color 0.2s ease, background-color 0.2s ease;
  /* 防止布局抖动 */
  will-change: color, background-color;
  transform: translateZ(0);
}

// 去除二级菜单右边箭头
:deep(.el-sub-menu__title) {
  // 去除箭头图标
  .el-sub-menu__icon-arrow {
    display: none !important;
  }
  
  // 重置右边距，去除箭头预留空间
  padding-right: 7px !important;
  
  // 去除可能的伪元素箭头
  &::after {
    display: none !important;
  }
  
  // 确保没有额外的右边距
  .el-icon {
    margin-right: 0 !important;
  }
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: #30a9e6;
  background-color: rgba(255, 255, 255, 0.06);
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title),
:deep(.el-menu-item.is-active) {
  color: #26c1f4;
  background-color: rgba(255, 255, 255, 0.08);
}

.navbar__search :deep(.el-icon) {
  font-size: 16px;
  color: #f0ff7c;
  opacity: 0.9;
}

.navbar__switch :deep(.el-switch) {
  --el-switch-on-color: #ffffff;
  --el-switch-off-color: #1f2937;
  // background-color: rgba(255, 255, 255, 0.12);
}
.navbar__switch :deep(.el-switch__core) {
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.navbar__switch :deep(.el-switch__action) {
  background: #0b1220;
  color: #ffffff;
}

.menu-text {
  margin-left: 6px;
}

/* 响应式：小屏隐藏横向菜单，显示移动端操作区 */
@media (max-width: 992px) {
  .navbar {
    height: 50px;
  }
  .navbar__menu {
    display: none;
  }
  .navbar__mobile {
    display: inline-flex;
  }
}

/* 抽屉样式（全局透传） */
:deep(.navbar-drawer) {
  background: rgba(10, 18, 34, 0.96);
  backdrop-filter: blur(8px);
  color: #cfe8ff;
  border-left: 1px solid rgba(200, 230, 255, 0.12);
}
.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
  border-bottom: 1px solid rgba(200, 230, 255, 0.12);
}
.drawer__title {
  font-size: 14px;
  color: #78b4f5;
  letter-spacing: .5px;
}
.drawer__menu {
  padding: 6px 0;
  border-right: none;
  border-left: none;
  background: transparent !important;
}
.drawer__menu :deep(.el-menu-item),
.drawer__menu :deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  padding: 0 14px;
  font-size: 14px;
  color: #7bb9f4;
}
.drawer__menu :deep(.el-menu-item:hover),
.drawer__menu :deep(.el-sub-menu__title:hover) {
  color: #000000;
  background-color: rgba(255, 255, 255, 0.06);
}
</style>