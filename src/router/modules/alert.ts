import { type RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 告警平台路由配置
 */
export const alertRoutes: RouteRecordRaw[] = [
  {
    path: "/alert",
    component: Layouts,
    redirect: "/alert/dashboard",
    meta: {
      title: "告警平台",
      svgIcon: "alarm",
      platforms: ["alert"],
      hidden: false
    },
    children: [
      // {
      //   path: "/alert/dashboard",
      //   component: () => import("@/pages/alert/index.vue"),
      //   name: "AlertDashboard",
      //   meta: {
      //     title: "告警平台",
      //     svgIcon: "component",
      //     platforms: ["alert"]
      //   }
      // }
      // {
      //   path: "/alert/workspace",
      //   component: () => import("@/pages/alert/workspace/index.vue"),
      //   name: "AlertWorkspace",
      //   meta: {
      //     title: "工作空间",
      //     svgIcon: "workspace",
      //     platforms: ["alert"]
      //   }
      // },
      // {
      //   path: "/alert/workspace/:id",
      //   component: () => import("@/pages/alert/workspace/detail.vue"),
      //   name: "AlertWorkspaceDetail",
      //   meta: {
      //     hidden: true,
      //     title: "工作空间详情",
      //     svgIcon: "user",
      //     platforms: ["alert"]
      //   }
      // }
      // {
      //   path: "/alert/datasource",
      //   component: () => import("@/pages/alert/datasource/index.vue"),
      //   name: "AlertDatasource",
      //   meta: {
      //     title: "数据源管理",
      //     svgIcon: "datasource",
      //     platforms: ["alert"]
      //   }
      // }
      // {
      //   path: "/alert/template",
      //   redirect: "/alert/template/list",
      //   meta: {
      //     title: "通知模板",
      //     svgIcon: "notify_template",
      //     platforms: ["alert"]
      //   },
      //   children: [
      //     {
      //       path: "/alert/template/list",
      //       component: () => import("@/pages/alert/template/index.vue"),
      //       name: "AlertTemplate",
      //       meta: {
      //         title: "通知模板",
      //         svgIcon: "notify_template",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/template/create",
      //       component: () => import("@/pages/alert/template/detail.vue"),
      //       name: "AlertTemplateCreate",
      //       meta: {
      //         hidden: true,
      //         title: "创建模板",
      //         svgIcon: "component",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/template/edit/:id",
      //       component: () => import("@/pages/alert/template/detail.vue"),
      //       name: "AlertTemplateEdit",
      //       meta: {
      //         hidden: true,
      //         title: "编辑模板",
      //         svgIcon: "component",
      //         platforms: ["alert"]
      //       }
      //     }
      //   ]
      // },
      // {
      //   path: "/alert/manager",
      //   redirect: "/alert/rule",
      //   meta: {
      //     title: "告警管理",
      //     svgIcon: "alert_manager",
      //     platforms: ["alert"]
      //   },
      //   children: [
      //     {
      //       path: "/alert/rule",
      //       component: () => import("@/pages/alert/rule/index.vue"),
      //       name: "AlertRule",
      //       meta: {
      //         title: "告警规则",
      //         svgIcon: "alert_rule",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/rule/create",
      //       component: () => import("@/pages/alert/rule/create.vue"),
      //       name: "AlertRuleCreate",
      //       meta: {
      //         title: "新增告警规则",
      //         svgIcon: "component",
      //         platforms: ["alert"],
      //         hidden: true
      //       }
      //     },
      //     {
      //       path: "/alert/rule/edit/:id",
      //       component: () => import("@/pages/alert/rule/edit.vue"),
      //       name: "AlertRuleEdit",
      //       meta: {
      //         title: "编辑告警规则",
      //         svgIcon: "component",
      //         platforms: ["alert"],
      //         hidden: true
      //       }
      //     },
      //     {
      //       path: "/alert/history",
      //       component: () => import("@/pages/alert/history/index.vue"),
      //       name: "AlertHistory",
      //       meta: {
      //         title: "历史告警",
      //         svgIcon: "alert_his",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/current",
      //       component: () => import("@/pages/alert/current/index.vue"),
      //       name: "AlertCurrent",
      //       meta: {
      //         title: "当前告警",
      //         svgIcon: "alert_cur",
      //         platforms: ["alert"]
      //       }
      //     }
      //   ]
      // }
      // {
      //   path: "/alert/team",
      //   component: () => import("@/pages/alert/team/index.vue"),
      //   name: "AlertTeam",
      //   meta: {
      //     title: "团队管理",
      //     svgIcon: "team",
      //     platforms: ["alert"]
      //   }
      // }
    ]
  }
]
