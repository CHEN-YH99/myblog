import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

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
    path: "/category/categoryDetail",
    name: "CategoryDetail",
    component: () => import("../views/CategoryDetail.vue"),
    meta: { title: "文章内容" }
  },
  {
    path: "/photoAlbum",
    name: "PhotoAlbum",
    component: () => import("../views/PhotoAlbum.vue"),
    meta: { title: "相册" }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;



