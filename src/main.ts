// core
import { createApp } from "vue"
import App from "@/App.vue"
import store from "@/store"
import router from "@/router"

import "@/router/permission"
// load
import { loadSvg } from "@/icons"
import { installPlugins } from "@/plugins"
import { loadDirectives } from "@/directives"
// css
import "uno.css"
import "normalize.css"
import "element-plus/dist/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"
import "vxe-table/lib/style.css"
import "vxe-table-plugin-element/dist/style.css"
import "@/styles/index.scss"
// import "@smallwei/avue/lib/index.css"

const app = createApp(App)

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

/** 加载全局 SVG */
loadSvg(app)
/** 加载自定义指令 */
loadDirectives(app)

// 安装 pinia 和 router
app.use(store).use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount("#app")
})
