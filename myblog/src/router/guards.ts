import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 需要登录才能访问的路由
const authRequiredRoutes = [
  '/article/', // 文章详情页
  '/talk',     // 说说页面
  '/user/center' // 个人中心
]

// 检查路由是否需要登录
const requiresAuth = (path: string): boolean => {
  return authRequiredRoutes.some(route => path.startsWith(route))
}

/**
 * 设置路由全局前置守卫
 */
export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const userStore = useUserStore()
    
    // 检查是否需要登录权限
    if (requiresAuth(to.path)) {
      if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再访问该页面')
        // 保存原始路径，登录后可以跳转回来
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
    
    // 如果已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/')
      return
    }
    
    next()
  })
}