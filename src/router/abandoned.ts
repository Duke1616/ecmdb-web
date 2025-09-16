// import { type RouteRecordRaw } from "vue-router"
// const Layouts = () => import("@/layouts/index.vue")

// export const constantRoutes: RouteRecordRaw[] = [
//   {
//     path: "/redirect",
//     component: Layouts,
//     children: [
//       {
//         path: ":path(.*)",
//         component: () => import("@/views/redirect/index.vue")
//       }
//     ]
//   },
//   {
//     path: "/403",
//     component: () => import("@/views/error-page/403.vue"),
//     meta: {
//       hidden: true
//     }
//   },
//   {
//     path: "/404",
//     component: () => import("@/views/error-page/404.vue"),
//     meta: {
//       hidden: true
//     },
//     alias: "/:pathMatch(.*)*"
//   },
//   {
//     path: "/login",
//     component: () => import("@/views/login/index.vue"),
//     meta: {
//       hidden: true
//     }
//   },
//   {
//     path: "/",
//     component: Layouts,
//     redirect: "/cmdb/dashboard",
//     children: [
//       {
//         path: "/cmdb/dashboard",
//         component: () => import("@/views/search/search.vue"),
//         name: "Dashboard",
//         meta: {
//           title: "全局搜索",
//           svgIcon: "search",
//           affix: true,
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "/cmdb/dashboard/search",
//         component: () => import("@/views/search/tabs-info.vue"),
//         name: "search",
//         meta: {
//           title: "搜索列表",
//           hidden: true,
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/model",
//     component: Layouts,
//     redirect: "/cmdb/model/index",
//     meta: {
//       title: "模型管理",
//       svgIcon: "model",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "index",
//         component: () => import("@/views/model/index.vue"),
//         name: "model-index",
//         meta: {
//           title: "模型资产",
//           svgIcon: "model-one",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "info",
//         component: () => import("@/views/model/info/index.vue"),
//         name: "model-info",
//         meta: {
//           hidden: true,
//           title: "模型详情",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "relation",
//         component: () => import("@/views/model/relation-graph/index.vue"),
//         name: "model-relation",
//         meta: {
//           title: "关联关系",
//           svgIcon: "relation-graph",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "relation-type",
//         component: () => import("@/views/model/relation-type/index.vue"),
//         name: "model-type",
//         meta: {
//           title: "关联类型",
//           svgIcon: "relation-type",
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/resource",
//     component: Layouts,
//     redirect: "/cmdb/resource/index",
//     meta: {
//       title: "资产管理",
//       svgIcon: "link",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "index",
//         component: () => import("@/views/resource/warehouse/index.vue"),
//         name: "resource-warehouse",
//         meta: {
//           title: "资产仓库",
//           svgIcon: "resource",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "list",
//         component: () => import("@/views/resource/warehouse/list/list.vue"),
//         name: "resource-warehouse-list",
//         meta: {
//           hidden: true,
//           title: "资产列表",
//           platforms: ["task"]
//         }
//       },
//       {
//         path: "info",
//         component: () => import("@/views/resource/warehouse/info/info.vue"),
//         name: "resource-warehouse-info",
//         meta: {
//           hidden: true,
//           title: "资产详情",
//           platforms: ["task"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/order",
//     component: Layouts,
//     redirect: "/cmdb/order/index",
//     meta: {
//       title: "工单中心",
//       svgIcon: "order-center",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "start",
//         component: () => import("@/views/order/start/index.vue"),
//         name: "order-start",
//         meta: {
//           title: "提交工单",
//           svgIcon: "submit-order",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "list",
//         component: () => import("@/views/order/index.vue"),
//         name: "order-list",
//         meta: {
//           title: "工单列表",
//           svgIcon: "order-list",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "convert",
//         component: () => import("@/views/order/convert/index.vue"),
//         name: "order-convert",
//         meta: {
//           title: "工单流转",
//           svgIcon: "order-convert",
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/process",
//     component: Layouts,
//     redirect: "/cmdb/process/index",
//     meta: {
//       title: "流程控制",
//       svgIcon: "process-control",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "template",
//         component: () => import("@/views/process/template/index.vue"),
//         name: "process-template",
//         meta: {
//           title: "模版管理",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "workflow",
//         component: () => import("@/views/process/index.vue"),
//         name: "process-workflow",
//         meta: {
//           title: "流程管理",
//           svgIcon: "process",
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/task",
//     component: Layouts,
//     redirect: "/cmdb/task/codebook",
//     meta: {
//       title: "任务中心",
//       svgIcon: "task",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "codebook",
//         component: () => import("@/views/task/codebook/index.vue"),
//         name: "task-codebook",
//         meta: {
//           title: "任务模版",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "worker",
//         component: () => import("@/views/task/worker/index.vue"),
//         name: "task-worker",
//         meta: {
//           title: "工作节点",
//           svgIcon: "worker",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "runner",
//         component: () => import("@/views/task/runner/index.vue"),
//         name: "task-runner",
//         meta: {
//           title: "执行单元",
//           svgIcon: "runner",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "history",
//         component: () => import("@/views/task/history/index.vue"),
//         name: "task-history",
//         meta: {
//           title: "历史任务",
//           svgIcon: "task-history",
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/system",
//     component: Layouts,
//     redirect: "/cmdb/system/menu",
//     meta: {
//       title: "系统管理",
//       svgIcon: "process-control",
//       platforms: ["cmdb"]
//     },
//     children: [
//       {
//         path: "role",
//         component: () => import("@/views/system/role/index.vue"),
//         name: "system-role",
//         meta: {
//           title: "角色管理",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "menu",
//         component: () => import("@/views/system/menu/index.vue"),
//         name: "system-menu",
//         meta: {
//           title: "菜单管理",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "api",
//         component: () => import("@/views/system/api/index.vue"),
//         name: "system-api",
//         meta: {
//           title: "接口管理",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       },
//       {
//         path: "user",
//         component: () => import("@/views/system/user/index.vue"),
//         name: "system-user",
//         meta: {
//           title: "用户管理",
//           svgIcon: "template",
//           platforms: ["cmdb"]
//         }
//       }
//     ]
//   },
//   {
//     path: "/cmdb/system",
//     component: Layouts,
//     redirect: "/cmdb/system/menu",
//     meta: {
//       title: "系统管理",
//       svgIcon: "process-control",
//       platforms: ["cmdb"]
//     },
//     children: []
//   }
// ]

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
// export const dynamicRoutes: RouteRecordRaw[] = [
//   {
//     path: "/permission",
//     component: Layouts,
//     redirect: "/permission/page",
//     name: "Permission",
//     meta: {
//       title: "权限",
//       svgIcon: "lock",
//       roles: ["admin", "editor"], // 可以在根路由中设置角色
//       alwaysShow: true, // 将始终显示根菜单
//       hidden: true
//     },
//     children: [
//       {
//         path: "page",
//         component: () => import("@/views/permission/page.vue"),
//         name: "PagePermission",
//         meta: {
//           title: "页面级",
//           roles: ["admin"] // 或者在子导航中设置角色
//         }
//       },
//       {
//         path: "directive",
//         component: () => import("@/views/permission/directive.vue"),
//         name: "DirectivePermission",
//         meta: {
//           title: "按钮级" // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
//         }
//       }
//     ]
//   }
// ]
