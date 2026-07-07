import { type RouteRecordRaw, createRouter } from "vue-router"
import { flatMultiLevelRoutes } from "./helper"
import { registerNavigationGuard } from "@/router/guard"
import { routerConfig } from "@/router/config"
import { isChunkLoadError, reloadOnChunkLoadError } from "@/common/utils/chunkLoadRecovery"
// import { alertRoutes } from "./modules/alert"
// import { taskRoutes } from "./modules/alert"

const Layouts = () => import("@/layouts/index.vue")
const Logicflow = () => import("@/pages/ticket/preview/logicflow.vue")
const PluginRuntimePage = () => import("@/pages/cmdb/plugin/runtime.vue")

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
    path: "/500",
    component: () => import("@/pages/error/500.vue"),
    meta: {
      hidden: true
    }
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
    path: "/join",
    component: () => import("@/pages/join/join.vue"),
    meta: {
      hidden: true,
      title: "加入租户"
    }
  },
  {
    path: "/callback",
    component: () => import("@/pages/login/callback.vue"),
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
    path: "/profile",
    component: Layouts,
    redirect: "/profile/index",
    meta: {
      hidden: true
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/iam/user/profile.vue"),
        name: "Profile",
        meta: {
          title: "个人中心",
          svgIcon: "user"
        }
      }
    ]
  },
  {
    path: "/governance",
    component: Layouts,
    redirect: "/governance/index",
    meta: {
      hidden: true
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/iam/governance/index.vue"),
        name: "Governance",
        meta: {
          title: "治理工作台"
        }
      }
    ]
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
  },
  {
    path: "/cmdb/plugin-runtime",
    component: PluginRuntimePage,
    name: "PluginRuntime",
    meta: {
      hidden: true,
      title: "插件运行时"
    }
  }
  // ...alertRoutes
  // ...taskRoutes
]

export const defaultRoutes: RouteRecordRaw[] = []

const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

router.onError((error) => {
  if (isChunkLoadError(error)) {
    reloadOnChunkLoadError()
  }
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
