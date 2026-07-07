import { type App } from "vue"
import { FormDialog } from "@/common/components/Dialogs"

export function loadCommonComponents(app: App) {
  // 全局注册 FormDialog 组件，供插件模板直接消费
  app.component("FormDialog", FormDialog)
}
