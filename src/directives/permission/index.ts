import { usePermissionStoreHook } from "@/store/modules/permission"
import { Directive, DirectiveBinding } from "vue"
import router from "@/router/index"

/**
 * 按钮权限 eg: v-permission="['user-add','user-edit']"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // 「超级管理员」拥有所有的按钮权限
    const { roles } = usePermissionStoreHook()
    if (roles.includes("admin")) {
      return true
    }

    // 「其他角色」按钮权限校验
    const buttons = router.currentRoute.value.meta.buttons as string[]
    const { value } = binding
    if (value) {
      const requiredPerms = value
      const hasPerm = buttons?.some((perm) => {
        return requiredPerms.includes(perm)
      })

      if (!hasPerm) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error("need perms! Like v-permission=\"['user-add','user-edit']\"")
    }
  }
}
