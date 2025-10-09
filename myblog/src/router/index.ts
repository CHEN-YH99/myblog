import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { setupRouterGuards } from "./guards";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue")
  },
  {
    path: "/timeline",
    name: "TimeLine",
    component: () => import("../views/TimeLine.vue"),
    meta: { title: "时间轴" },
    
  },
  {
    path: "/frontend",
    name: "FrontEnd",
    component: () => import("../views/FrontEnd.vue"),
    meta: { title: "前端" },
  },
  {
    path: "/frontend/frontendDetail",
    name: "FrontendDetail",
    component: () => import("../views/FrontendDetail.vue"),
    meta: { title: "网站列表" },
  },
  {
    path: "/backend",
    name: "BackEnd",
    component: () => import("../views/BackEnd.vue"),
    meta: { title: "后端" },
  },
  {
    path: "/backtend/backendDetail",
    name: "BackendDetail",
    component: () => import("../views/BackendDetail.vue"),
  },
  {
    path: "/category",
    name: "Category",
    component: () => import("../views/Category.vue"),
    meta: { title: "分类" }
  },
  {
    path: "/category/:tag",
    name: "CategoryTag", 
    component: () => import("../views/CategoryTag.vue"),
    meta: { title: "分类文章" }
  },
  {
    path: "/article/:id",
    name: "ArticleDetail",
    component: () => import("../views/ArticleDetail.vue"),
    meta: { title: "文章详情" }
  },
  {
    path: "/category/detail/:category",
    name: "CategoryDetail",
    component: () => import("../views/CategoryDetail.vue"),
    meta: { title: "文章详情" }
  },
  {
    path: "/photoAlbum",
    name: "PhotoAlbum",
    component: () => import("../views/PhotoAlbum.vue"),
    meta: { title: "相册" }
  },
  {
    path: "/photo-category/:id",
    name: "PhotoCategoryDetail",
    component: () => import("../views/PhotoCategoryDetail.vue"),
    meta: { title: "相册分类" }
  },
  {
    path: "/talk",
    name: "Talk",
    component: () => import("../views/Talk.vue"),
    meta: { title: "说说" }
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { title: "登录" }
  },
  {
    path: "/user/center",
    name: "UserCenter",
    component: () => import("../views/UserCenter.vue"),
    meta: { title: "个人中心", requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 设置路由守卫
setupRouterGuards(router);

export default router;