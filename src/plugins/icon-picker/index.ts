import { type App } from "vue"
import Vue3IconPicker from "vue3-icon-picker"
import "vue3-icon-picker/dist/style.css"

import eIconPicker from "e-icon-picker"
import "e-icon-picker/icon/default-icon/symbol.js"
import "font-awesome/css/font-awesome.min.css"
import "e-icon-picker/index.css"
import "font-awesome/css/font-awesome.min.css"
import eIconList from "e-icon-picker/icon/default-icon/eIconList.js"

export function loadIconPicker(app: App) {
  app.use(Vue3IconPicker)
  app.use(eIconPicker, {
    addIconList: eIconList,
    removeIconList: [],
    zIndex: 3100
  })
}
