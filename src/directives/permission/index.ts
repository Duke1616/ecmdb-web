import { Directive, DirectiveBinding } from "vue"

/**
 * 按钮权限 eg: v-permission="['user-add','user-edit']"
 * TODO: 适配新的 IAM 权限模型 (URN / Capability)
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    if (!value) {
      throw new Error("need perms! Like v-permission=\"['user-add','user-edit']\"")
    }

    // NOTE: 目前已切换至 IAM 模型，前端暂不根据 roles/buttons 物理过滤按钮
    // 后续可根据授权接口返回的权限 URN 进行过滤
    return true
  }
}
