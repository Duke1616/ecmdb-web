import { type App } from "vue"
// import { loadElementPlus } from "./element-plus"
import { loadElementPlusIcon } from "./element-plus-icon"
import { loadVxeTable } from "./vxe-table"
import { loadFromCreate } from "./form-create"
import { loadIconPicker } from "./icon-picker"
import { loadFinder } from "./finder"
import { loadCodeMirror } from "./codemirror"
import { loadIconSvg } from "./icon-svg"

export function installPlugins(app: App) {
  // loadElementPlus(app)
  loadElementPlusIcon(app)
  loadFromCreate(app)
  loadVxeTable(app)
  loadIconPicker(app)
  loadFinder(app)
  loadCodeMirror(app)
  loadIconSvg(app)
}
