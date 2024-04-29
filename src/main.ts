import './assets/main.css'

// import { createApp } from 'vue'
// import { createPinia } from 'pinia'

// import App from './App.vue'
// import router from './router'

// const app = createApp(App)

// app.use(createPinia())
// app.use(router)

// app.mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import registerIcons from './global/register-icons'

// 全局引入样式
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(registerIcons)
// 动态路由，对加载顺序有要求，不然会导致刷新404
app.use(pinia)
app.use(router)

app.mount('#app')
