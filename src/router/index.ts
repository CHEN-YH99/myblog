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
    path: "/backend",
    name: "BackEnd",
    component: () => import("../views/BackEnd.vue"),
    meta: { title: "后端" },
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

