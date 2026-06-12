import type { App } from "vue"
import SvgIcon from "~virtual/svg-component"

// 使用 Vite 的 import.meta.glob 批量静态引入 icons 目录下所有 SVG 文件，使用 eager: true 强制同步打入
// 必须使用相对路径，防止 Vite 生产环境打包时别名失效导致 Tree Shaking 剔除图标
import.meta.glob("../../common/assets/icons/**/*.svg", { eager: true })

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
