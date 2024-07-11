import { type App } from "vue"
import Vue3IconPicker from "vue3-icon-picker"
import "vue3-icon-picker/dist/style.css"

export function loadIconPicker(app: App) {
  app.use(Vue3IconPicker)
}
