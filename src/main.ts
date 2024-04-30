import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import pinia from "./store"
import registerIcons from "./global/register-icons"

// CSS
// import "uno.css"
import "normalize.css"
import "element-plus/dist/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"
import "@/styles/index.scss"

const app = createApp(App)
app.use(registerIcons)
// 动态路由，对加载顺序有要求，不然会导致刷新404
app.use(pinia)
app.use(router)

app.mount("#app")
