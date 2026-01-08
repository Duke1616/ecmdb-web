import { type RouteRecordRaw, createRouter } from "vue-router"
import { flatMultiLevelRoutes } from "./helper"
import { registerNavigationGuard } from "@/router/guard"
import { routerConfig } from "@/router/config"
// import { alertRoutes } from "./modules/alert"

const Layouts = () => import("@/layouts/index.vue")
const Terminal = () => import("@/views/terminal/index.vue")
const Logicflow = () => import("@/views/process/preview/logicflow.vue")

/**
 * 常驻路由
 * 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/navigation",
    children: [
      {
        path: "/navigation",
        component: () => import("@/pages/navigation/index.vue"),
        name: "Navigation",
        meta: {
          title: "首页导航",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/logicflow-preview",
    component: Logicflow,
    meta: {
      hidden: true
    }
  },
  {
    path: "/terminal",
    component: Terminal,
    meta: {
      hidden: true
    }
  },
  {
    path: "/process/template/discovery",
    component: () => import("@/views/process/discovery/index.vue"),
    name: "process-template-discovery",
    meta: {
      title: "自动发现",
      svgIcon: "search",
      hidden: true // 隐藏菜单，只能通过编程式导航访问
    }
  },
  {
    path: "/change",
    component: () => import("@/pages/change/index.vue"),
    meta: {
      title: "变更平台",
      svgIcon: "component",
      platforms: ["change"],
      hidden: true
    }
  }
  // ...alertRoutes
]

export const defaultRoutes: RouteRecordRaw[] = [
  {
    path: "/cmdb",
    component: Layouts,
    redirect: "/cmdb/dashboard",
    meta: {
      title: "CMDB",
      svgIcon: "dashboard",
      platforms: ["cmdb"]
    },
    children: [
      {
        path: "/cmdb/dashboard",
        component: () => import("@/views/search/search.vue"),
        name: "Dashboard",
        meta: {
          title: "全局搜索",
          svgIcon: "search",
          affix: true,
          platforms: ["cmdb"]
        }
      },
      {
        path: "/cmdb/dashboard/search",
        component: () => import("@/views/search/tabs-info.vue"),
        name: "search",
        meta: {
          title: "搜索列表",
          hidden: true,
          platforms: ["cmdb"]
        }
      }
    ]
  }
]

const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}
// 注册路由导航守卫
registerNavigationGuard(router)

export default router
