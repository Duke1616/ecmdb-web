import { Directive, DirectiveBinding } from "vue"
import { useUserStoreHook } from "@/pinia/stores/user"

/**
 * 权限控制指令 (Pro Version)
 * 使用方式:
 * 1. 移除模式 (默认): v-permission="Auth.User.Edit"
 * 2. 禁用模式: v-permission:disable="Auth.User.Edit"
 * 3. 满足其一: v-permission="[Auth.User.Add, Auth.User.Edit]"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value, arg } = binding
    const userStore = useUserStoreHook()

    if (!value) return

    const requiredPermissions = Array.isArray(value) ? value : [value]

    // 权限匹配逻辑
    const hasPermission = userStore.permissions.some((p) => requiredPermissions.includes(p))

    if (!hasPermission) {
      if (arg === "disable") {
        // 禁用模式：不移除 DOM，仅设置禁用状态
        el.setAttribute("disabled", "disabled")
        el.classList.add("is-disabled")
        // 如果是 Element Plus 按钮，由于它是自定义组件，可能需要额外处理 pointer-events
        el.style.pointerEvents = "none"
        el.style.opacity = "0.5"
        el.style.cursor = "not-allowed"
      } else {
        // 移除模式：直接从父节点中剥离
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  }
}
