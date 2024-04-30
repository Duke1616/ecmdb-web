import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import "@/router/permission"
import pinia from "./store"

// load
import { loadSvg } from "@/icons"
import { loadPlugins } from "@/plugins"
import { loadDirectives } from "@/directives"

// CSS
import "uno.css"
import "normalize.css"
import "element-plus/dist/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"
import "@/styles/index.scss"

const app = createApp(App)

/** 加载插件 */
loadPlugins(app)
/** 加载全局 SVG */
loadSvg(app)
/** 加载自定义指令 */
loadDirectives(app)

// 动态路由，对加载顺序有要求，不然会导致刷新404
app.use(pinia)
app.use(router)

app.mount("#app")
