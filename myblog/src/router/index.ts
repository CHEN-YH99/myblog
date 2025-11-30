import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', description: '小灰个人博客首页：最新文章、标签与站点动态。', transition: 'fade' },
  },
  {
    path: '/timeline',
    name: 'TimeLine',
    component: () => import('../views/TimeLine.vue'),
    meta: { title: '时间轴', transition: 'slide-left' },
  },
  {
    path: '/frontend',
    name: 'FrontEnd',
    component: () => import('../views/FrontEnd.vue'),
    meta: { title: '前端', transition: 'slide-left' },
  },
  {
    path: '/frontend/frontendDetail',
    name: 'FrontendDetail',
    component: () => import('../views/FrontendDetail.vue'),
    meta: { title: '网站列表', transition: 'slide-left' },
  },
  {
    path: '/backend',
    name: 'BackEnd',
    component: () => import('../views/BackEnd.vue'),
    meta: { title: '后端', transition: 'slide-left' },
  },
  {
    path: '/backend/backendDetail',
    name: 'BackendDetail',
    component: () => import('../views/BackendDetail.vue'),
    meta: { title: '后端详情', transition: 'slide-left' },
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('../views/Category.vue'),
    meta: { title: '分类', transition: 'scale' },
  },
  {
    path: '/category/:tag',
    name: 'CategoryTag',
    component: () => import('../views/CategoryTag.vue'),
    meta: { title: '分类文章', transition: 'slide-right' },
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetail.vue'),
    meta: { title: '文章详情', transition: 'slide-right' },
  },
  {
    path: '/category/detail/:category',
    name: 'CategoryDetail',
    component: () => import('../views/CategoryDetail.vue'),
    meta: { title: '文章详情', transition: 'slide-right' },
  },
  {
    path: '/photoAlbum',
    name: 'PhotoAlbum',
    component: () => import('../views/PhotoAlbum.vue'),
    meta: { title: '相册', transition: 'scale' },
  },
  {
    path: '/photo-category/:id',
    name: 'PhotoCategoryDetail',
    component: () => import('../views/PhotoCategoryDetail.vue'),
    meta: { title: '相册分类', transition: 'slide-right' },
  },
  {
    path: '/talk',
    name: 'Talk',
    component: () => import('../views/Talk.vue'),
    meta: { title: '说说', transition: 'fade' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', transition: 'scale' },
  },
  {
    path: '/user/center',
    name: 'UserCenter',
    component: () => import('../views/UserCenter.vue'),
    meta: { title: '个人中心', requiresAuth: true, transition: 'slide-left' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 添加滚动行为优化
  scrollBehavior(to, _from, savedPosition) {
    // 1) 浏览器前进/后退：直接返回保存位置，不延迟，避免覆盖用户主动滚动
    if (savedPosition) {
      return savedPosition
    }

    // 2) 同页锚点：交给路由处理平滑滚动，并考虑固定头部高度
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80,
      }
    }

    // 3) 普通路由切换：立即滚动到顶部（不要延迟/不要平滑），
    //    避免在进入页面后延迟滚动覆盖用户点击目录产生的滚动。
    return { top: 0 }
  },
})

// 设置路由守卫
setupRouterGuards(router)

export default router
