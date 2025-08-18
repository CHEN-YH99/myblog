import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/views/Home.vue")
  },
  {
      path: "timeline",
      component: () => import("@/views/Timeline.vue")
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router