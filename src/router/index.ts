import { type RouteRecordRaw, createRouter } from "vue-router"
import { history, flatMultiLevelRoutes } from "./helper"
import routeSettings from "@/config/route"

const Layouts = () => import("@/layouts/index.vue")

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
        component: () => import("@/views/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/views/error-page/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/cmdb/dashboard",
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
  },
  {
    path: "/cmdb/model",
    component: Layouts,
    redirect: "/cmdb/model/index",
    meta: {
      title: "模型管理",
      elIcon: "Grid",
      platforms: ["cmdb"]
    },
    children: [
      {
        path: "index",
        component: () => import("@/views/model/index.vue"),
        name: "model-index",
        meta: {
          title: "模型资产",
          svgIcon: "unocss",
          platforms: ["cmdb"]
        }
      },
      {
        path: "info",
        component: () => import("@/views/model/info/index.vue"),
        name: "model-info",
        meta: {
          hidden: true,
          title: "模型详情",
          platforms: ["cmdb"]
        }
      },
      {
        path: "relation",
        component: () => import("@/views/model/relation-graph/index.vue"),
        name: "model-relation",
        meta: {
          title: "关联关系",
          svgIcon: "link",
          platforms: ["cmdb"]
        }
      },
      {
        path: "relation-type",
        component: () => import("@/views/model/relation-type/index.vue"),
        name: "model-type",
        meta: {
          title: "关联类型",
          svgIcon: "link",
          platforms: ["cmdb"]
        }
      }
    ]
  },
  {
    path: "/cmdb/resource",
    component: Layouts,
    redirect: "/cmdb/resource/index",
    meta: {
      title: "资产管理",
      svgIcon: "link",
      platforms: ["cmdb"]
    },
    children: [
      {
        path: "index",
        component: () => import("@/views/resource/warehouse/index.vue"),
        name: "resource-warehouse",
        meta: {
          title: "资产仓库",
          svgIcon: "unocss",
          platforms: ["cmdb"]
        }
      },
      {
        path: "list",
        component: () => import("@/views/resource/warehouse/list/list.vue"),
        name: "resource-warehouse-list",
        meta: {
          hidden: true,
          title: "资产列表",
          platforms: ["task"]
        }
      },
      {
        path: "info",
        component: () => import("@/views/resource/warehouse/info/info.vue"),
        name: "resource-warehouse-info",
        meta: {
          hidden: true,
          title: "资产详情",
          platforms: ["task"]
        }
      }
    ]
  },
  {
    path: "/cmdb/template",
    component: Layouts,
    redirect: "/cmdb/template/index",
    meta: {
      title: "工单中心",
      svgIcon: "link",
      platforms: ["cmdb"]
    },
    children: [
      {
        path: "info",
        component: () => import("@/views/template/info/detail.vue"),
        name: "template-info",
        meta: {
          title: "模型详情",
          svgIcon: "link",
          platforms: ["cmdb"]
        }
      },
      {
        path: "manager",
        component: () => import("@/views/template/manager/index.vue"),
        name: "template-manager",
        meta: {
          title: "模版管理",
          svgIcon: "link",
          platforms: ["cmdb"]
        }
      }
    ]
  }
]

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/permission",
    component: Layouts,
    redirect: "/permission/page",
    name: "Permission",
    meta: {
      title: "权限",
      svgIcon: "lock",
      roles: ["admin", "editor"], // 可以在根路由中设置角色
      alwaysShow: true, // 将始终显示根菜单
      hidden: true
    },
    children: [
      {
        path: "page",
        component: () => import("@/views/permission/page.vue"),
        name: "PagePermission",
        meta: {
          title: "页面级",
          roles: ["admin"] // 或者在子导航中设置角色
        }
      },
      {
        path: "directive",
        component: () => import("@/views/permission/directive.vue"),
        name: "DirectivePermission",
        meta: {
          title: "按钮级" // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
        }
      }
    ]
  }
]

const router = createRouter({
  history,
  routes: routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
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
    window.location.reload()
  }
}

export default router
