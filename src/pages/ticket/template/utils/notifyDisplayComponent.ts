export const NOTIFY_HIDDEN_STYLE_FIELD = "formCreateStyle>notify_hidden"

export interface DesignerRuleItem {
  type?: string
  field?: string
  style?: Record<string, unknown>
  notify_hidden?: boolean
  children?: DesignerRuleItem[]
  [key: string]: unknown
}

/**
 * 创建设计器基础规则中的“禁用通知推送”配置项
 * 使用标准布尔值映射至 notify_hidden。
 */
export const createNotifyDisplayBaseRule = () => ({
  rule: () => [
    {
      type: "switch",
      field: NOTIFY_HIDDEN_STYLE_FIELD,
      title: "禁用通知推送",
      warning: "开启后，工单审批与流转通知中不推送此字段",
      value: undefined,
      wrap: {
        class: "notify-display-card-item"
      },
      props: {
        activeValue: true,
        inactiveValue: false
      }
    }
  ],
  append: true
})

/**
 * 遍历并标准化 rules 中的 notify_hidden 属性，
 * 无论历史数据来源于 style.notify_display 还是标准 notify_hidden，
 * 都统一初始化，确保设计器内的开关组件能稳定回显。
 */
export const normalizeNotifyDisplayRules = (value: unknown): unknown => {
  const isJson = typeof value === "string"
  let rules: unknown = value

  if (isJson) {
    try {
      rules = JSON.parse(value as string)
    } catch {
      return value
    }
  }
  if (!Array.isArray(rules)) return value

  const walk = (items: DesignerRuleItem[]) => {
    items.forEach((item) => {
      const isHidden =
        item.notify_hidden === true ||
        item.style?.notify_hidden === true ||
        item.style?.notify_hidden === "true" ||
        item.style?.notify_display !== undefined

      if (isHidden) {
        item.notify_hidden = true
        item.style = item.style || {}
        item.style.notify_hidden = true
      }

      if (Array.isArray(item.children)) {
        walk(item.children)
      }
    })
  }

  walk(rules as DesignerRuleItem[])
  return isJson ? JSON.stringify(rules) : rules
}

/**
 * 保存表单前同步并格式化 rules：
 * 1. 在根级挂载标准 notify_hidden: true 字段，供 Go 后端 Rule.NotifyHidden 直接映射；
 * 2. 在 style 中保留 notify_display，实现老版本完全无缝过渡；
 * 3. 未勾选时清理多余属性，避免脏字段留存。
 */
export const syncNotifyHiddenToRules = (value: unknown): unknown => {
  const isJson = typeof value === "string"
  let rules: unknown = value

  if (isJson) {
    try {
      rules = JSON.parse(value as string)
    } catch {
      return value
    }
  }
  if (!Array.isArray(rules)) return value

  const walk = (items: DesignerRuleItem[]) => {
    items.forEach((item) => {
      const isHidden =
        item.notify_hidden === true ||
        item.style?.notify_hidden === true ||
        item.style?.notify_hidden === "true" ||
        item.style?.notify_display !== undefined

      if (isHidden) {
        item.notify_hidden = true
        item.style = item.style || {}
        item.style.notify_hidden = true
        item.style.notify_display = "false"
      } else {
        delete item.notify_hidden
        if (item.style) {
          delete item.style.notify_hidden
          delete item.style.notify_display
        }
      }

      if (Array.isArray(item.children)) {
        walk(item.children)
      }
    })
  }

  walk(rules as DesignerRuleItem[])
  return isJson ? JSON.stringify(rules) : rules
}
