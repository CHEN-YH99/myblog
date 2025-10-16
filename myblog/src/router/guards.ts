import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 需要登录的路由（客户端博客系统简化权限控制）
const authRequiredRoutes = ['/user-center', '/write-article']

export function setupRouterGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    
    // 客户端博客系统权限控制：
    // 1. 只检查是否登录，不检查具体角色权限
    // 2. 所有成功登录的用户都可以访问所有页面数据
    // 3. token过期检查交给HTTP拦截器处理，避免重复检查
    if (authRequiredRoutes.includes(to.path)) {
      if (!userStore.isLoggedIn) {
        console.log('访问需要登录的页面，跳转到登录页')
        next('/login')
        return
      }
      // 已登录用户无论角色如何，都允许访问
      console.log('已登录用户访问受保护页面，允许通过')
    }
    
    // 已登录用户访问登录页，跳转到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      console.log('已登录用户访问登录页，跳转到首页')
      next('/')
      return
    }
    
    next()
  })
}