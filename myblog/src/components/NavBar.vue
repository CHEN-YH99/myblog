<template>
  <header
    class="navbar"
    :class="{ 'scroll-down': scrollDown, 'is-hidden': isHidden }"
  >
    <div class="navbar__inner">
      <el-avatar class="navbar__avatar" :size="32" :src="avatarUrl" alt="avatar" />

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
        @select="(index) => (activeIndex = index)"
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

        <el-sub-menu index="more" popper-class="navbar-submenu-popper" popper-effect="light">
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

        <!-- 已移除：相册分类 菜单项 -->

        <el-menu-item index="talk" @click="$router.push('/talk')">
          <el-icon><ChatLineRound /></el-icon>
          <span class="menu-text">说说</span>
        </el-menu-item>

        <el-menu-item index="links">
          <el-icon><LinkIcon /></el-icon>
          <span class="menu-text">友链<sup class="dev-tag">WIP</sup></span>
        </el-menu-item>

        <el-menu-item index="board">
          <el-icon><MessageIcon /></el-icon>
          <span class="menu-text">留言<sup class="dev-tag">WIP</sup></span>
        </el-menu-item>

        <!-- 用户登录状态显示 -->
        <div v-if="userStore.isLoggedIn" class="navbar__user" @click="handleUserMenuToggle">
          <el-avatar :src="displayAvatar" :size="32" class="user-avatar" />
          <span class="user-name">{{
            userStore.userInfo?.nickname || userStore.userInfo?.username
          }}</span>

          <!-- 用户下拉菜单 -->
          <div v-show="showUserMenu" class="user-menu" @click.stop>
            <div class="user-menu-item" @click="handleUserCenter">
              <el-icon><UserFilled /></el-icon>
              <span>个人中心</span>
            </div>
            <div class="user-menu-item" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </div>
          </div>
        </div>

        <!-- 未登录时显示登录按钮 -->
        <el-menu-item v-else index="login" @click="$router.push('/login')">
          <el-icon><User /></el-icon>
          <span class="menu-text">登录</span>
        </el-menu-item>

        <div class="navbar__switch" title="主题切换">
          <el-switch
            :model-value="is_Dark"
            @change="animateThemeSwitch"
            @click="rememberPointer"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            size="small"
          />
        </div>
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
        @select="(index) => (mobileActiveIndex = index)"
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
        <!-- 已移除：移动端 相册分类 菜单项 -->
        <el-menu-item index="m-talk" @click="handleMobileNavigation('/talk')">
          <el-icon><ChatLineRound /></el-icon>
          <span>说说</span>
        </el-menu-item>
        <el-menu-item index="m-links">
          <el-icon><LinkIcon /></el-icon>
          <span>友链<sup class="dev-tag">WIP</sup></span>
        </el-menu-item>
        <el-menu-item index="m-board">
          <el-icon><MessageIcon /></el-icon>
          <span>留言<sup class="dev-tag">WIP</sup></span>
        </el-menu-item>

        <!-- 移动端用户登录状态显示 -->
        <div v-if="userStore.isLoggedIn" class="mobile-user-section">
          <div class="mobile-user-info">
            <el-avatar :src="displayAvatar" :size="40" />
            <span class="mobile-user-name">{{
              userStore.userInfo?.nickname || userStore.userInfo?.username
            }}</span>
          </div>
          <el-menu-item index="m-user-center" @click="handleMobileNavigation('/user/center')">
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
          <el-menu-item index="m-logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-menu-item>
        </div>

        <!-- 移动端未登录时显示登录按钮 -->
        <el-menu-item v-else index="m-login" @click="handleMobileNavigation('/login')">
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
import { is_Dark, toggleDark, animateThemeSwitch, rememberPointer } from '@/assets/ts/theme'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  UserFilled,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'

import avatarUrl from '@/assets/images/hui.svg'
import { mapPathToMenu } from '@/utils/routerMap'

const router = useRouter()
const route = useRoute()
const drawer = ref(false)
const userStore = useUserStore()

// 与后台管理列表一致的默认头像生成策略
const getDefaultAvatar = (name) => {
  const safeName = name || 'User'
  const colors = ['409eff', '67c23a', 'e6a23c', 'f56c6c', '909399']
  const color = colors[safeName.length % colors.length]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${color}&color=fff&size=200`
}

// 统一的展示头像：优先使用用户头像；无则按用户名/ID生成默认头像
const displayAvatar = computed(() => {
  const user = userStore.userInfo
  if (user && user.avatar) return user.avatar
  const name = user?.nickname || user?.username || (user?.id ? String(user.id) : 'User')
  return getDefaultAvatar(name)
})

// 使用 ref 来控制活动菜单项，避免跳闪
const activeIndex = ref('')
const mobileActiveIndex = ref('')
const prevPath = ref('')

// 用户菜单下拉框显示状态
const showUserMenu = ref(false)

// 使用统一的路径->菜单索引映射工具（见 @/utils/routerMap）

const mapPathToMobileMenu = (path) => {
  const m = mapPathToMenu(path)
  if (!m) return null
  const map = {
    home: 'm-home',
    timeline: 'm-timeline',
    frontend: 'm-frontend',
    backend: 'm-backend',
    category: 'm-category',
    photos: 'm-photos',
    talk: 'm-talk',
    links: 'm-links',
    board: 'm-board',
    login: 'm-login',
  }
  return map[m] || 'm-home'
}

// 初始化活动状态
const initActiveState = () => {
  const currentPath = route.path
  // 优先使用 from 参数
  const fromParam = route.query.from && typeof route.query.from === 'string' ? route.query.from : ''
  if (currentPath.startsWith('/article/')) {
    if (fromParam) {
      activeIndex.value = fromParam
      mobileActiveIndex.value = `m-${fromParam}`
    } else {
      // 没有来源参数则回退为上一次值或首页
      activeIndex.value = activeIndex.value || 'home'
      mobileActiveIndex.value = mobileActiveIndex.value || 'm-home'
    }
  } else {
    activeIndex.value = mapPathToMenu(currentPath)
    mobileActiveIndex.value = mapPathToMobileMenu(currentPath)
  }
}

// 监听路由变化，使用 oldPath 作为进入文章详情的来源
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 记录上一个路径
    prevPath.value = oldPath || prevPath.value

    if (newPath.startsWith('/article/')) {
      const fromParam =
        route.query.from && typeof route.query.from === 'string' ? route.query.from : ''
      if (fromParam) {
        activeIndex.value = fromParam
        mobileActiveIndex.value = `m-${fromParam}`
        return
      }
      // 如果是从非文章页进入，则以 oldPath 判定来源
      if (oldPath && !oldPath.startsWith('/article/')) {
        activeIndex.value = mapPathToMenu(oldPath)
        mobileActiveIndex.value = mapPathToMobileMenu(oldPath)
        return
      }
      // 从文章页跳到另一个文章页：保持现有高亮不变
      return
    }
    // 普通页面：直接按当前路径映射
    activeIndex.value = mapPathToMenu(newPath)
    mobileActiveIndex.value = mapPathToMobileMenu(newPath)
  },
  { immediate: true },
)

// 处理移动端导航
const handleMobileNavigation = (path) => {
  drawer.value = false
  router.push(path)
}

// 用户相关方法
const handleUserMenuToggle = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleUserMenuClose = () => {
  showUserMenu.value = false
}

const handleUserCenter = () => {
  showUserMenu.value = false
  router.push('/user/center')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      showUserMenu.value = false
      userStore.logout()
      router.push('/')
      ElMessage.success('已退出登录')
    })
    .catch(() => {
      // 用户取消退出
    })
}

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (showUserMenu.value && !event.target.closest('.navbar__user')) {
    showUserMenu.value = false
  }
}

// 监听滚动事件
import {
  isHidden,
  scrollDirection,
  scrollDown,
  scrollUp,
  initScrollListener,
  removeScrollListener,
} from '@/assets/ts/navbar'

// 组件挂载时，监听滚动事件和初始化活动状态
onMounted(() => {
  initScrollListener()
  initActiveState()
  // 添加点击外部关闭菜单的监听器
  document.addEventListener('click', handleClickOutside)
  // 刷新用户信息，确保头像与后台同步（登录状态下）
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo().catch(() => {})
  }
})
// 记得在组件卸载时移除监听器
onBeforeUnmount(() => {
  removeScrollListener()
  document.removeEventListener('click', handleClickOutside)
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
  background-color: rgba(8, 20, 40, 0.1);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(200, 230, 255, 0.12);
  /* 背景变深 0.5s；隐藏/出现位移动画 1s */
  transition:
    background-color 0.5s ease,
    backdrop-filter 0.5s ease,
    transform 1s ease;
  will-change: transform, background-color;
  transform: translateY(0);
}
/* 滚动条下滑：仅改变背景色，加深 */
.navbar.scroll-down {
  background-color: rgba(8, 20, 40, 0.7);
}
/* 导航栏显示隐藏（上滑消失） */
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
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
}

/* Element Plus 菜单样式微调（桌面端） */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding: 0 7px;
  font-size: 13px;
  color: #3293eea6;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
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

.navbar__switch {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 7px;
  cursor: pointer;
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

/* 用户菜单样式 */
.navbar__user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 48px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.navbar__user:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: border-color 0.2s ease;
}

.navbar__user:hover .user-avatar {
  border-color: rgba(255, 255, 255, 0.4);
}

.user-name {
  color: #3293eea6;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.navbar__user:hover .user-name {
  color: #30a9e6;
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 140px;
  background: rgba(10, 18, 34, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(200, 230, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 8px 0;
  z-index: 1001;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: #7bb9f4;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

/* 移动端用户信息样式 */
.mobile-user-section {
  border-top: 1px solid rgba(200, 230, 255, 0.12);
  padding-top: 12px;
  margin-top: 12px;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(200, 230, 255, 0.08);
  margin-bottom: 8px;
}

.mobile-user-name {
  color: #78b4f5;
  font-size: 14px;
  font-weight: 500;
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

/* 修复：浅色主题下“更多”子菜单选中时文字与背景冲突不可见 */
:deep(.el-menu--popup .el-menu),
:deep(.navbar-submenu-popper .el-menu) {
  /* 明确子菜单使用浅色背景与主色变量 */
  --el-menu-active-color: var(--el-color-primary) !important;
  --el-menu-hover-text-color: var(--el-color-primary);
  --el-menu-bg-color: var(--el-bg-color-overlay, #fff);
  --el-menu-hover-bg-color: var(--el-color-primary-light-9, #ecf5ff);
}
:deep(.el-menu--popup .el-menu-item.is-active),
:deep(.navbar-submenu-popper .el-menu-item.is-active),
:deep(.el-menu--popup .el-menu-item:active),
:deep(.navbar-submenu-popper .el-menu-item:active),
:deep(.el-menu--popup .el-menu-item:focus),
:deep(.navbar-submenu-popper .el-menu-item:focus) {
  color: var(--el-color-primary) !important; /* 选中文字颜色 */
  background-color: var(--el-color-primary-light-9, #ecf5ff) !important; /* 浅色背景 */
}
:deep(.el-menu--popup .el-menu-item:hover),
:deep(.navbar-submenu-popper .el-menu-item:hover) {
  color: var(--el-color-primary) !important;
  background-color: var(--el-color-primary-light-9, #ecf5ff) !important;
}
/* 子菜单默认文字颜色（避免白底白字） */
:deep(.navbar-submenu-popper .el-menu) {
  /* 强制覆盖子菜单的激活/悬浮文本色变量，避免继承顶层 #fff */
  --el-menu-active-color: var(--el-color-primary);
  --el-menu-hover-text-color: var(--el-color-primary);
}
:deep(.navbar-submenu-popper .el-menu-item) {
  color: #303133; /* 浅色主题默认深色文字，提高可读性 */
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
  letter-spacing: 0.5px;
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
/* Dark theme submenu contrast */
.dark .navbar-submenu-popper,
:root.dark .navbar-submenu-popper {
  background-color: var(--el-bg-color-overlay, #141414) !important;
}
.dark .navbar-submenu-popper .el-menu-item.is-active,
.dark .navbar-submenu-popper .el-menu-item:active,
.dark .navbar-submenu-popper .el-menu-item:focus,
.dark .navbar-submenu-popper .el-menu-item:hover,
:root.dark .navbar-submenu-popper .el-menu-item.is-active,
:root.dark .navbar-submenu-popper .el-menu-item:active,
:root.dark .navbar-submenu-popper .el-menu-item:focus,
:root.dark .navbar-submenu-popper .el-menu-item:hover {
  color: #fff !important;
  background-color: color-mix(in srgb, var(--el-color-primary) 28%, #000) !important;
}
.dark .navbar-submenu-popper .el-menu-item,
:root.dark .navbar-submenu-popper .el-menu-item {
  color: var(--el-text-color-primary, #e5eaf3) !important;
}
/* 高级质感微调 */
.navbar {
  border-bottom: 1px solid rgba(180, 220, 255, 0.16);
}
.navbar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));
  pointer-events: none;
}
.navbar.scroll-down {
  backdrop-filter: blur(12px) saturate(130%);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

/* 菜单项：圆角毛玻璃 + 激活下划线动画 */
:deep(.el-menu--horizontal > .el-menu-item),
:deep(.el-menu--horizontal > .el-sub-menu > .el-sub-menu__title) {
  position: relative;
  border-radius: 10px;
  margin: 0 2px;
}
:deep(.el-menu--horizontal > .el-menu-item.is-active::after),
:deep(.el-menu--horizontal > .el-sub-menu.is-active > .el-sub-menu__title::after) {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 4px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #7dd3fc, #60a5fa, #a78bfa);
  box-shadow: 0 0 8px rgba(80, 160, 255, 0.55);
  transform-origin: left center;
  animation: navbar-underline 0.36s ease both;
}
@keyframes navbar-underline {
  from { transform: scaleX(0); opacity: .45; }
  to   { transform: scaleX(1); opacity: 1; }
}
/* 悬浮态：轻微浮起与图标增强 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  transform: translateY(-1px);
}
:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  transition: transform .2s ease, color .2s ease, opacity .2s ease;
}
:deep(.el-menu-item:hover .el-icon),
:deep(.el-sub-menu__title:hover .el-icon) {
  transform: translateY(-1px) scale(1.02);
}
:deep(.el-menu-item.is-active .menu-text) {
  text-shadow: 0 1px 6px rgba(56, 189, 248, .55);
}

/* 头像光环：不影响点击区域 */
.navbar__avatar { position: relative; }
.navbar__avatar::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(99,102,241,.55),
    rgba(59,130,246,.55),
    rgba(56,189,248,.55),
    rgba(99,102,241,.55)
  );
  -webkit-mask: radial-gradient(circle calc(50% - 2px), transparent 99%, #000 100%);
          mask: radial-gradient(circle calc(50% - 2px), transparent 99%, #000 100%);
  filter: blur(.4px);
  opacity: .65;
  pointer-events: none;
}

/* 用户弹层：圆角投影 + 小箭头 */
.user-menu { border-radius: 10px; box-shadow: 0 18px 50px rgba(0,0,0,.35); }
.user-menu::before {
  content: '';
  position: absolute;
  top: -6px; right: 18px;
  width: 12px; height: 12px;
  background: rgba(10, 18, 34, 0.95);
  border-left: 1px solid rgba(200, 230, 255, 0.12);
  border-top: 1px solid rgba(200, 230, 255, 0.12);
  transform: rotate(45deg);
}

/* 子菜单弹层圆角与阴影（不改功能，仅视觉） */
:deep(.navbar-submenu-popper) {
  border-radius: 10px !important;
  box-shadow: 0 20px 60px rgba(0,0,0,.35) !important;
  overflow: hidden;
}

/* 进一步美化：高级渐变与激活胶囊 */
:deep(.el-menu--horizontal > .el-menu-item),
:deep(.el-menu--horizontal > .el-sub-menu > .el-sub-menu__title) {
  position: relative;
}
:deep(.el-menu--horizontal > .el-menu-item)::before,
:deep(.el-menu--horizontal > .el-sub-menu > .el-sub-menu__title)::before {
  content: '';
  position: absolute;
  inset: 6px 6px 8px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0));
  opacity: 0;
  transition: opacity .2s ease, background .2s ease, box-shadow .2s ease;
  pointer-events: none;
}
:deep(.el-menu--horizontal > .el-menu-item:hover)::before,
:deep(.el-menu--horizontal > .el-sub-menu > .el-sub-menu__title:hover)::before {
  opacity: 1;
}
:deep(.el-menu--horizontal > .el-menu-item.is-active)::before,
:deep(.el-menu--horizontal > .el-sub-menu.is-active > .el-sub-menu__title)::before {
  opacity: 1;
  background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
  box-shadow: 0 6px 22px rgba(59,130,246,.22);
}

/* 激活项渐变文本（不改变结构） */
:deep(.el-menu-item.is-active .menu-text),
:deep(.el-sub-menu.is-active > .el-sub-menu__title .menu-text) {
  background: linear-gradient(90deg, #7dd3fc, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 可达性焦点可视化 */
:deep(.el-menu-item:focus-visible),
:deep(.el-sub-menu__title:focus-visible),
.navbar__switch :deep(.el-switch__core:focus-visible),
.icon-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 60%, #fff);
  outline-offset: 2px;
  border-radius: 10px;
}

/* 开关毛玻璃细化 */
.navbar__switch :deep(.el-switch__core) {
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(8px);
}

/* 顶部流光边 */
.navbar::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(125,211,252,.65) 20%, rgba(96,165,250,.65) 50%, rgba(167,139,250,.65) 80%, transparent 100%);
  pointer-events: none;
}

</style>

<!-- 全局样式：确保挂载到 body 的弹出层也能生效 -->
<style>
/* 主题切换背景视图过渡（更炫酷的径向揭示动画） */
@supports (view-transition-name: theme) or (view-transition-name: page-theme) {
  /* 指定文档根的视图过渡名称，作用于整页背景 */
  html { view-transition-name: page-theme; }

  ::view-transition-old(page-theme),
  ::view-transition-new(page-theme) {
    animation-duration: 1520ms;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
    /* 避免混合模式导致颜色失真 */
    mix-blend-mode: normal;
  }
  /* 新主题从点击点向外扩散 */
  ::view-transition-new(page-theme) {
    animation-name: theme-reveal-in;
    z-index: 9999;
  }
  /* 旧主题向点击点收缩 */
  ::view-transition-old(page-theme) {
    animation-name: theme-reveal-out;
  }

  @keyframes theme-reveal-in {
    from { clip-path: circle(0 at var(--vt-x, 50%) var(--vt-y, 50%)); }
    to   { clip-path: circle(150% at var(--vt-x, 50%) var(--vt-y, 50%)); }
  }
  @keyframes theme-reveal-out {
    from { clip-path: circle(150% at var(--vt-x, 50%) var(--vt-y, 50%)); }
    to   { clip-path: circle(0 at var(--vt-x, 50%) var(--vt-y, 50%)); }
  }
}

/* 子菜单弹层容器（通过 popper-class 绑定） */
.navbar-submenu-popper {
  background-color: var(--el-bg-color-overlay, #fff) !important;
}
.navbar-submenu-popper .el-menu {
  --el-menu-active-color: var(--el-color-primary);
  --el-menu-hover-text-color: var(--el-color-primary);
  --el-menu-bg-color: var(--el-bg-color-overlay, #fff);
  --el-menu-hover-bg-color: var(--el-color-primary-light-9, #ecf5ff);
}
.navbar-submenu-popper .el-menu-item.is-active,
.navbar-submenu-popper .el-menu-item:active,
.navbar-submenu-popper .el-menu-item:focus,
.navbar-submenu-popper .el-menu-item:hover {
  color: var(--el-color-primary) !important;
  background-color: var(--el-color-primary-light-9, #ecf5ff) !important;
}
.navbar-submenu-popper .el-menu-item,
.navbar-submenu-popper .el-sub-menu__title {
  color: var(--el-text-color-primary, #303133);
}
</style>
