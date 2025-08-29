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
        mode="horizontal"
        default-active="home"
        class="navbar__menu"
        background-color="transparent"
        text-color="#000000"
        active-text-color="#ffffff"
        :ellipsis="false"
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

        <el-menu-item index="more">
          <el-icon><Grid /></el-icon>
          <span class="menu-text">更多</span>
        </el-menu-item>

        <el-menu-item index="category">
          <el-icon><Collection /></el-icon>
          <span class="menu-text">分类</span>
        </el-menu-item>

        <el-menu-item index="photos">
          <el-icon><Picture /></el-icon>
          <span class="menu-text">相册</span>
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
            v-model="isDark"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            size="small"
            @click="toggleDark()"
          />
          <!-- <el-button type="primary"  @click="toggleDark()">
             {{ isDark ? 'Dark' : 'Light' }} 
          </el-button> -->
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
          v-model="isDark"
          :active-action-icon="Moon"
          :inactive-action-icon="Sunny"
          size="small"
          aria-label="主题切换"
        />
      </div>

      <el-menu
        class="drawer__menu"
        background-color="transparent"
        text-color="#cfe8ff"
        active-text-color="#ffffff"
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
        <el-sub-menu index="m-more">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>更多</span>
          </template>
          <el-menu-item index="m-photos">
            <el-icon><Picture /></el-icon>
            <span>相册</span>
          </el-menu-item>
          <el-menu-item index="m-talk">
            <el-icon><ChatLineRound /></el-icon>
            <span>说说</span>
          </el-menu-item>
          <el-menu-item index="m-links">
            <el-icon><LinkIcon /></el-icon>
            <span>友链</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="m-category">
          <el-icon><Collection /></el-icon>
          <span>分类</span>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
// import { isDark, toggleDark } from '@/assets/ts/theme'
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
  Menu as MenuIcon
} from '@element-plus/icons-vue'

import avatarUrl from '../assets/images/hui.svg'

const router = useRouter()
const isDark = ref(true)
const drawer = ref(false)

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

	// 组件挂载时，监听滚动事件
	onMounted(() => {
    initScrollListener()
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
  color: #cfe8ff;
  transition: color 0.2s ease, background-color 0.2s ease;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.06);
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title),
:deep(.el-menu-item.is-active) {
  color: #ffffff;
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