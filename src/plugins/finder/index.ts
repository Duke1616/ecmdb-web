import { type App } from "vue"

import VueFinder from "vuefinder"
import "vuefinder/dist/style.css"

export function loadFinder(app: App) {
  app.use(VueFinder, {
    locale: "zhCN",
    i18n: {
      // @ts-ignore
      en: async () => await import("vuefinder/dist/locales/en.js"),
      // @ts-ignore
      zhCN: async () => await import("vuefinder/dist/locales/zhCN.js")
    }
  })
}
