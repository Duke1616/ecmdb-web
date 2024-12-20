import { type App } from "vue"

import "vuefinder/dist/style.css"
// @ts-ignore
import VueFinder from "vuefinder/dist/vuefinder"

export function loadFinder(app: App) {
  app.use(VueFinder, {
    i18n: {
      // @ts-ignore
      en: async () => await import("vuefinder/dist/locales/en.js"),
      // @ts-ignore
      zhCN: async () => await import("vuefinder/dist/locales/zhCN.js")
    }
  })
}
