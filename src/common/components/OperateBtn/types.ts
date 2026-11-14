import type { Component } from "vue"
import type { ButtonType } from "element-plus"

/** OperateBtn 操作项契约；TCode 收窄 code 到具体动作枚举。 */
export interface OperateItem<TCode extends string = string> {
  name: string
  code: TCode
  type?: ButtonType
  icon?: string | Component
  disabled?: boolean
  capability?: string | string[]
}