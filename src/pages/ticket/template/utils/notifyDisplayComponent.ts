export const NOTIFY_HIDDEN_STYLE_FIELD = "formCreateStyle>notify_hidden"

export interface DesignerRuleItem {
  type?: string
  field?: string
  style?: Record<string, any>
  notify_hidden?: boolean
  children?: DesignerRuleItem[]
  [key: string]: unknown
}

// ─── 内部辅助 ────────────────────────────────────────────────────────────────

/** 安全取出 item 的 style 对象，非对象时返回 null */
const getItemStyle = (item: DesignerRuleItem): Record<string, any> | null =>
  typeof item.style === "object" && item.style !== null ? (item.style as Record<string, any>) : null

/** 判断是否为实际表单字段（排除 fcRow / col 等布局容器） */
const isFormField = (item: DesignerRuleItem): boolean =>
  Boolean(item.field && item.type !== "fcRow" && item.type !== "col")

/**
 * 将 JSON 字符串或数组解析后传给 walk，完成后按原始格式返回。
 * 若解析失败或类型不匹配，原值透传。
 */
const withParsedRules = (value: unknown, walk: (rules: DesignerRuleItem[]) => void): unknown => {
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

  walk(rules as DesignerRuleItem[])
  return isJson ? JSON.stringify(rules) : rules
}

/**
 * 将隐藏通知状态写入 / 清除 item。
 * - 写入时仅使用 style.notify_hidden（新标准），不再写 notify_display；
 * - 清除时同时清理 notify_display，完成旧数据的自动迁移。
 */
const applyNotifyHidden = (item: DesignerRuleItem, hidden: boolean): void => {
  if (hidden) {
    item.notify_hidden = true
    item.style = { ...(getItemStyle(item) ?? {}), notify_hidden: true }
  } else {
    delete item.notify_hidden
    const style = getItemStyle(item)
    if (style) {
      delete style.notify_hidden
      // 清理历史遗留的 notify_display，完成一次性自动迁移
      delete style.notify_display
    }
  }
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

/**
 * 判断某个规则项是否被配置为"禁用通知推送"
 *
 * 判定优先级（高 → 低）：
 * 1. `style.notify_hidden`：设计器开关直接控制，支持 boolean / "true"；
 * 2. `rule.notify_hidden`：根级标准字段；
 * 3. `style.notify_display`：兼容老版本自定义样式，仅 false / "false" 视为禁用，
 *    true / "true" 一律视为正常推送，绝不误判。
 */
export const isRuleNotifyHidden = (item?: unknown): boolean => {
  if (!item || typeof item !== "object") return false
  const rule = item as DesignerRuleItem
  const style = getItemStyle(rule)

  if (style?.notify_hidden != null) {
    return style.notify_hidden === true || style.notify_hidden === "true"
  }

  if (rule.notify_hidden != null) {
    return rule.notify_hidden === true || (rule.notify_hidden as unknown) === "true"
  }

  if (style?.notify_display != null) {
    return style.notify_display === false || style.notify_display === "false"
  }

  return false
}

/**
 * 创建设计器基础规则中的"禁用通知推送"开关配置项。
 * 默认值为 false，确保未配置时开关默认关闭。
 */
export const createNotifyDisplayBaseRule = () => ({
  rule: () => [
    {
      type: "switch",
      field: NOTIFY_HIDDEN_STYLE_FIELD,
      title: "禁用通知推送",
      warning: "开启后，工单审批与流转通知中不推送此字段",
      value: false,
      wrap: { class: "notify-display-card-item" },
      props: { activeValue: true, inactiveValue: false }
    }
  ],
  append: true
})

/**
 * 加载模板时规范化 rules：
 * 将历史数据（`style.notify_display` / `notify_hidden`）统一转换为标准格式，
 * 确保设计器内的开关组件能准确回显。
 */
export const normalizeNotifyDisplayRules = (value: unknown): unknown =>
  withParsedRules(value, function walk(items) {
    items.forEach((item) => {
      if (isFormField(item)) applyNotifyHidden(item, isRuleNotifyHidden(item))
      if (Array.isArray(item.children)) walk(item.children)
    })
  })

/**
 * 保存模板前同步 rules：
 * 1. 根级写入 `notify_hidden: true`，供 Go 后端 `Rule.NotifyHidden` 直接映射；
 * 2. 未勾选时彻底清理相关属性，避免脏字段留存；
 * 3. 顺带清除旧版 `style.notify_display`，完成存量数据的自动迁移。
 */
export const syncNotifyHiddenToRules = (value: unknown): unknown =>
  withParsedRules(value, function walk(items) {
    items.forEach((item) => {
      if (isFormField(item)) applyNotifyHidden(item, isRuleNotifyHidden(item))
      if (Array.isArray(item.children)) walk(item.children)
    })
  })
