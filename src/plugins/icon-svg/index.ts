import type { App } from "vue"
import SvgIcon from "~virtual/svg-component"

// 由于生产环境打包插件（如 unplugin-svg-component 等）是通过对源码中出现的静态字符串常量进行正则匹配来决定将哪些 SVG 打包进雪碧图（Sprite）中。
// 我们在此处声明所有可用的图标名字符串数组，强行保留以促使打包插件全量引入所有图标，解决动态加载时的遗漏问题。
const allSvgNames = [
  "404",
  "alarm",
  "alert_cur",
  "alert_his",
  "alert_manager",
  "alert_rule",
  "api",
  "authorize",
  "bug",
  "codebook",
  "component",
  "dashboard",
  "datasource",
  "department",
  "dispatch_rule",
  "escalation_config",
  "escalation_step",
  "fullscreen-exit",
  "fullscreen",
  "identity",
  "identity_source",
  "keyboard-down",
  "keyboard-enter",
  "keyboard-esc",
  "keyboard-up",
  "link",
  "lock",
  "menu",
  "model-one",
  "model",
  "notify_escalation",
  "notify_manager",
  "notify_template",
  "order-center",
  "order-convert",
  "order-list",
  "organization",
  "permission",
  "policy",
  "process-control",
  "process",
  "relation-graph",
  "relation-type",
  "resource",
  "role",
  "runner",
  "schedule",
  "search",
  "submit-order",
  "task-history",
  "task-manager",
  "task",
  "team",
  "template",
  "template_set",
  "tenant",
  "time_series",
  "unocss",
  "user",
  "worker",
  "workspace"
]

export function loadIconSvg(app: App) {
  // 注册 SvgIcon 组件
  app.component("SvgIcon", SvgIcon)

  // 显式引用静态图标名数组，确保其在生产打包产物里作为静态字符串常量留存以防 Tree Shaking
  if (typeof window !== "undefined") {
    ;(window as any)._allSvgIconNames = allSvgNames
  }
}

// vite-plugin-svg-icons 插件使用方式，在当前项目中已经弃用
// import { type App } from "vue"
// import SvgIcon from "@@/components/SvgIcon/index.vue" // Svg Component
// import "virtual:svg-icons-register"

// export function loadIconSvg(app: App) {
//   app.component("SvgIcon", SvgIcon)
// }
