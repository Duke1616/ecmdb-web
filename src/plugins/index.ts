import { type App } from "vue"
import { loadElementPlus } from "./element-plus"
import { loadElementPlusIcon } from "./element-plus-icon"
import { loadVxeTable } from "./vxe-table"
import { loadFromCreate } from "./form-create"
import { loadIconPicker } from "./icon-picker"
import { loadFinder } from "./finder"
import { loadCodeMirror } from "./codemirror"
import { loadIconSvg } from "./icon-svg"
import { loadCommonComponents } from "./common-components"
import { loadPreventReClick } from "./prevent-reclick"

export function installPlugins(app: App) {
  loadPreventReClick(app)
  loadElementPlus(app)
  loadCommonComponents(app)
  loadElementPlusIcon(app)
  loadFromCreate(app)
  loadVxeTable(app)
  loadIconPicker(app)
  loadFinder(app)
  loadCodeMirror(app)
  loadIconSvg(app)
}
