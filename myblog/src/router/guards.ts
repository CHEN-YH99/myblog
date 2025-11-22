import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function setupRouterGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    const meta = to.meta as Record<string, unknown>
    const requiresAuth = (meta as { requiresAuth?: boolean }).requiresAuth
    if (requiresAuth) {
      if (!userStore.isLoggedIn) {
        next('/login')
        return
      }
    }

    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/')
      return
    }

    next()
  })
}
