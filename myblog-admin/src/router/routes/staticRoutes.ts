import { AppRouteRecordRaw } from '../utils/utils'
import { RoutesAlias } from '../routesAlias'

/**
 * 静态路由配置
 * 不需要权限就能访问的路由
 *
 * 注意事项：
 * 1、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 * 2、不需要登录就能访问的路由，在 meta 中添加 noLogin: true
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  // 不需要登录就能访问的路由示例
  // {
  //   path: '/welcome',
  //   name: 'WelcomeStatic',
  //   component: () => import('@views/dashboard/console/index.vue'),
  //   meta: { title: 'menus.dashboard.title', noLogin: true }
  // },
  {
    path: RoutesAlias.Login,
    name: 'Login',
    component: () => import('@views/auth/login/index.vue'),
    meta: { title: 'menus.login.title', isHideTab: true, setTheme: true }
  },
  {
    path: RoutesAlias.Register,
    name: 'Register',
    component: () => import('@views/auth/register/index.vue'),
    meta: { title: 'menus.register.title', isHideTab: true, noLogin: true, setTheme: true }
  },
  {
    path: RoutesAlias.ForgetPassword,
    name: 'ForgetPassword',
    component: () => import('@views/auth/forget-password/index.vue'),
    meta: { title: 'menus.forgetPassword.title', isHideTab: true, noLogin: true, setTheme: true }
  },
  {
    path: '/sitemanagement',
    name: 'SiteManagement',
    component: () => import('@views/site/sitemanagement/index.vue'),
    meta: { title: 'menus.sitemanagement.title', noLogin: false, roles: ['R_SUPER', 'R_ADMIN'] }
  },
  {
    path: '/backgroundmanagement',
    name: 'BackgroundManagement',
    component: () => import('@views/site/backgroundmanagement/index.vue'),
    meta: { title: 'menus.backgroundmanagement.title', noLogin: false, roles: ['R_SUPER', 'R_ADMIN'] }
  },
  {
    path: '/friendlinkmanagement',
    name: 'FriendLinkManagement',
    component: () => import('@views/site/friendLinkmanagement/index.vue'),
    meta: { title: 'menus.friendlinkmanagement.title', noLogin: false, roles: ['R_SUPER', 'R_ADMIN'] }
  },
  {
    path: '/photoalbum/category/:id',
    name: 'PhotoCategoryDetail',
    component: () => import('@views/photoalbum/category-detail.vue'),
    meta: { title: '分类图片详情', noLogin: false, roles: ['R_SUPER', 'R_ADMIN'] }
  },
  {
    path: '/outside',
    component: () => import('@views/index/index.vue'),
    name: 'Outside',
    meta: { title: 'menus.outside.title' },
    children: [
      {
        path: '/outside/iframe/:path',
        name: 'Iframe',
        component: () => import('@/views/outside/Iframe.vue'),
        meta: { title: 'iframe' }
      }
    ]
  }
]
