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
    meta: { title: "时间轴" }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

