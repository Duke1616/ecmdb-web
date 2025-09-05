import { type App } from "vue"

import { createTheme, Theme } from "@@/composables/theme"
// CodeMirror 样式
import "@codemirror/theme-one-dark"

export function loadCodeMirror(app: App) {
  const theme = createTheme(Theme.Dark)
  app.use(theme)
}
