import { describe, expect, it } from "vitest"
import {
  NOTIFY_HIDDEN_STYLE_FIELD,
  createNotifyDisplayBaseRule,
  isRuleNotifyHidden,
  normalizeNotifyDisplayRules,
  syncNotifyHiddenToRules
} from "./notifyDisplayComponent"

describe("notifyDisplayComponent", () => {
  describe("createNotifyDisplayBaseRule", () => {
    it("should create baseRule appending styled native switch rule", () => {
      const baseRuleConfig = createNotifyDisplayBaseRule()
      expect(baseRuleConfig.append).toBe(true)
      const rules = baseRuleConfig.rule()
      expect(rules).toHaveLength(1)
      expect(rules[0].type).toBe("switch")
      expect(rules[0].field).toBe(NOTIFY_HIDDEN_STYLE_FIELD)
      expect(rules[0].title).toBe("禁用通知推送")
      expect(rules[0].warning).toBeDefined()
      expect(rules[0].value).toBe(false)
      expect(rules[0].wrap?.class).toBe("notify-display-card-item")
      expect(rules[0].props?.activeValue).toBe(true)
      expect(rules[0].props?.inactiveValue).toBe(false)
    })
  })

  describe("isRuleNotifyHidden", () => {
    it("should correctly identify hidden rules with proper precedence", () => {
      // 默认未配置
      expect(isRuleNotifyHidden(undefined)).toBe(false)
      expect(isRuleNotifyHidden({ type: "input", field: "test" })).toBe(false)

      // 显式 style.notify_hidden
      expect(isRuleNotifyHidden({ style: { notify_hidden: true } })).toBe(true)
      expect(isRuleNotifyHidden({ style: { notify_hidden: "true" } })).toBe(true)

      // 如果显式关闭 style.notify_hidden 为 false，哪怕 legacy notify_display 存在也应以 false 为准
      expect(
        isRuleNotifyHidden({
          style: {
            notify_hidden: false,
            notify_display: "false"
          }
        })
      ).toBe(false)

      // 显式 root notify_hidden
      expect(isRuleNotifyHidden({ notify_hidden: true })).toBe(true)
      expect(isRuleNotifyHidden({ notify_hidden: false })).toBe(false)

      // 兼容 legacy notify_display: false 或 "false" 为隐藏
      expect(isRuleNotifyHidden({ style: { notify_display: false } })).toBe(true)
      expect(isRuleNotifyHidden({ style: { notify_display: "false" } })).toBe(true)

      // legacy notify_display 为 true 或 "true" 时绝对不能视为隐藏
      expect(isRuleNotifyHidden({ style: { notify_display: true } })).toBe(false)
      expect(isRuleNotifyHidden({ style: { notify_display: "true" } })).toBe(false)
    })
  })

  describe("normalizeNotifyDisplayRules", () => {
    it("should accurately normalize only hidden fields without affecting normal fields", () => {
      const rules = [
        {
          type: "input",
          field: "hidden_field_1",
          style: {
            notify_display: "false"
          }
        },
        {
          type: "input",
          field: "visible_field_1",
          style: {
            notify_display: "true"
          }
        },
        {
          type: "select",
          field: "hidden_field_2",
          notify_hidden: true
        },
        {
          type: "fcRow",
          children: [
            {
              type: "col",
              children: [
                {
                  type: "input",
                  field: "visible_field_2"
                },
                {
                  type: "input",
                  field: "hidden_field_3",
                  style: {
                    notify_hidden: true
                  }
                }
              ]
            }
          ]
        }
      ]

      const normalized = normalizeNotifyDisplayRules(rules) as any[]

      // hidden_field_1 (老配置 "false")
      expect(normalized[0].notify_hidden).toBe(true)
      expect(normalized[0].style.notify_hidden).toBe(true)
      expect(normalized[0].style.notify_display).toBe("false")

      // visible_field_1 (老配置 "true"，不能被隐藏)
      expect(normalized[1].notify_hidden).toBeUndefined()
      expect(normalized[1].style?.notify_hidden).toBeUndefined()
      expect(normalized[1].style?.notify_display).toBeUndefined()

      // hidden_field_2 (标准 notify_hidden)
      expect(normalized[2].notify_hidden).toBe(true)
      expect(normalized[2].style.notify_hidden).toBe(true)

      // fcRow 及内部组件
      const col = normalized[3].children[0]
      expect(col.children[0].notify_hidden).toBeUndefined()
      expect(col.children[1].notify_hidden).toBe(true)
    })
  })

  describe("syncNotifyHiddenToRules", () => {
    it("should synchronize notify_hidden cleanly and purge unhidden attributes", () => {
      const rules = [
        {
          type: "input",
          field: "field_1",
          style: {
            notify_hidden: true
          }
        },
        {
          type: "input",
          field: "field_2",
          style: {
            notify_hidden: false,
            notify_display: "false"
          }
        },
        {
          type: "input",
          field: "field_3"
        }
      ]

      const synced = syncNotifyHiddenToRules(rules) as any[]

      // field_1 应该保存通知隐藏，notify_display 不再写入（新标准仅用 notify_hidden）
      expect(synced[0].notify_hidden).toBe(true)
      expect(synced[0].style.notify_hidden).toBe(true)
      expect(synced[0].style.notify_display).toBeUndefined()

      // field_2 用户主动取消，应当被彻底清理
      expect(synced[1].notify_hidden).toBeUndefined()
      expect(synced[1].style?.notify_hidden).toBeUndefined()
      expect(synced[1].style?.notify_display).toBeUndefined()

      // field_3 未配置，不带任何隐藏脏字段
      expect(synced[2].notify_hidden).toBeUndefined()
      expect(synced[2].style?.notify_hidden).toBeUndefined()
      expect(synced[2].style?.notify_display).toBeUndefined()
    })
  })
})
