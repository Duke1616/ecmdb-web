import type { App } from 'vue'
import * as ElementPlusiconsVue from '@element-plus/icons-vue'

function registerIcons(app: App<Element>) {
  for (const [key, component] of Object.entries(ElementPlusiconsVue)) {
    app.component(key, component)
  }
}

export default registerIcons
