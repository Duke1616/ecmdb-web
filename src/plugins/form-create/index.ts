import { type App } from "vue"
import formCreate from "@form-create/element-ui"
import FcDesigner from "@form-create/designer"

export function loadFromCreate(app: App) {
  app.use(formCreate)
  app.use(FcDesigner)
}
