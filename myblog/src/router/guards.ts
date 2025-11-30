import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { applySEO } from '@/utils/seo'

export function setupRouterGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    const meta = to.meta as Record<string, any>
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

    // 基础 SEO：根据路由元信息设置标题/描述/Canonical
    const title = meta.title ? String(meta.title) : undefined
    const description = meta.description
      ? String(meta.description)
      : title
        ? `${title} - 小灰个人博客`
        : '小灰个人博客，分享前端/后端/学习资源、说说与相册。'

    const canonical = typeof window !== 'undefined' ? window.location.href : undefined

    // 登录页与需要登录的页面设置为 noindex
    const robots = to.name === 'Login' || requiresAuth ? 'noindex,nofollow' : 'index,follow'

    applySEO({ title, description, canonical, robots })

    next()
  })
}
