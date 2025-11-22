import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', transition: 'fade' },
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
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（浏览器前进/后退）
    if (savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(savedPosition)
        }, 300) // 等待过渡动画完成
      })
    }

    // 如果是锚点链接
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80, // 考虑导航栏高度
      }
    }

    // 默认滚动到顶部
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ top: 0, behavior: 'smooth' })
      }, 300)
    })
  },
})

// 设置路由守卫
setupRouterGuards(router)

export default router
