import { type App } from "vue"
import codemirror from "vue-codemirror"
import "codemirror/lib/codemirror.css"

export function loadCodeMirror(app: App) {
  app.use(codemirror)
}
