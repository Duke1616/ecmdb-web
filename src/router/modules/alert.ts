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
      // 分发规则
      {
        path: "/alert/dispatch",
        component: () => import("@/pages/alert/dispatch/index.vue"),
        name: "AlertDispatch",
        meta: {
          title: "分发规则",
          svgIcon: "dispatch_rule",
          platforms: ["alert"]
        }
      }
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
      // 引用 notify_manager 图标
      // {
      //   path: "/alert/notify-manager",
      //   component: () => import("@/pages/alert/workspace/index.vue"),
      //   name: "NotifyManager",
      //   meta: {
      //     title: "通知管理",
      //     svgIcon: "notify_manager",
      //     platforms: ["alert"],
      //     hidden: true
      //   }
      // },
      // 引用 escalation_config 图标
      // {
      //   path: "/alert/escalation-config",
      //   component: () => import("@/pages/alert/workspace/index.vue"),
      //   name: "EscalationConfig",
      //   meta: {
      //     title: "升级配置",
      //     svgIcon: "escalation_config",
      //     platforms: ["alert"],
      //     hidden: true
      //   }
      // },
      // 引用 notify_escalation 图标
      // {
      //   path: "/alert/notify-escalation",
      //   component: () => import("@/pages/alert/workspace/index.vue"),
      //   name: "NotifyEscalation",
      //   meta: {
      //     title: "通知升级",
      //     svgIcon: "notify_escalation",
      //     platforms: ["alert"],
      //     hidden: true
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
      //   path: "/alert/template-set",
      //   redirect: "/alert/template-set/list",
      //   meta: {
      //     title: "模板集合",
      //     svgIcon: "template",
      //     platforms: ["alert"]
      //   },
      //   children: [
      //     {
      //       path: "/alert/template-set/list",
      //       component: () => import("@/pages/alert/template_set/index.vue"),
      //       name: "AlertTemplateSet",
      //       meta: {
      //         title: "模板集合",
      //         svgIcon: "template",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/template-set/items/:id",
      //       component: () => import("@/pages/alert/template_set/items.vue"),
      //       name: "AlertTemplateSetItems",
      //       meta: {
      //         hidden: true,
      //         title: "集合条目管理",
      //         svgIcon: "component",
      //         platforms: ["alert"]
      //       }
      //     }
      //   ]
      // },
      // {
      //   path: "/alert/escalation",
      //   redirect: "/alert/escalation/config",
      //   meta: {
      //     title: "消息升级",
      //     svgIcon: "alert_manager",
      //     platforms: ["alert"]
      //   },
      //   children: [
      //     {
      //       path: "/alert/escalation/config",
      //       component: () => import("@/pages/alert/escalation/index.vue"),
      //       name: "EscalationConfig",
      //       meta: {
      //         title: "升级配置",
      //         svgIcon: "alert_manager",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/escalation/create",
      //       component: () => import("@/pages/alert/escalation/create.vue"),
      //       name: "EscalationConfigCreate",
      //       meta: {
      //         hidden: true,
      //         title: "创建升级配置",
      //         svgIcon: "component",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/escalation/steps/:id",
      //       component: () => import("@/pages/alert/escalation/steps.vue"),
      //       name: "AlertEscalationSteps",
      //       meta: {
      //         hidden: true,
      //         title: "升级步骤",
      //         svgIcon: "component",
      //         platforms: ["alert"]
      //       }
      //     },
      //     {
      //       path: "/alert/escalation/templates",
      //       component: () => import("@/pages/alert/escalation/templates.vue"),
      //       name: "AlertEscalationTemplates",
      //       meta: {
      //         title: "步骤模板",
      //         svgIcon: "template",
      //         platforms: ["alert"]
      //       }
      //     }
      //   ]
      // }
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
