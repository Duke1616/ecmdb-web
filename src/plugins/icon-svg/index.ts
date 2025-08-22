import type { App } from "vue"
import SvgIcon from "~virtual/svg-component"

export function loadIconSvg(app: App) {
  // 注册 SvgIcon 组件
  app.component("SvgIcon", SvgIcon)
}

// vite-plugin-svg-icons 插件使用方式，在当前项目中已经弃用
// import { type App } from "vue"
// import SvgIcon from "@@/components/SvgIcon/index.vue" // Svg Component
// import "virtual:svg-icons-register"

// export function loadIconSvg(app: App) {
//   app.component("SvgIcon", SvgIcon)
// }
