import { type RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 告警平台路由配置
 */
export const alertRoutes: RouteRecordRaw[] = [
  {
    path: "/task",
    component: Layouts,
    redirect: "/task/manager",
    meta: {
      title: "任务调度",
      svgIcon: "task-manager",
      platforms: ["alert"],
      hidden: false
    },
    children: []
  }
]
