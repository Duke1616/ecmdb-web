import { type App } from "vue"

import { createTheme, Theme } from "@/composables/theme"

export function loadCodeMirror(app: App) {
  const theme = createTheme(Theme.Dark)
  app.use(theme)
}
