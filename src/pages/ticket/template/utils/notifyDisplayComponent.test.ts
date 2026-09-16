import { describe, expect, it } from "vitest"
import {
  NOTIFY_HIDDEN_STYLE_FIELD,
  createNotifyDisplayBaseRule,
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
      expect(rules[0].wrap?.class).toBe("notify-display-card-item")
      expect(rules[0].props?.activeValue).toBe(true)
      expect(rules[0].props?.inactiveValue).toBe(false)
    })
  })

  describe("normalizeNotifyDisplayRules", () => {
    it("should normalize legacy notify_display and notify_hidden to boolean", () => {
      const rules = [
        {
          type: "input",
          field: "field_1",
          style: {
            notify_display: false
          }
        },
        {
          type: "select",
          field: "field_2",
          notify_hidden: true
        },
        {
          type: "row",
          children: [
            {
              type: "input",
              field: "field_3",
              style: {
                notify_hidden: true
              }
            }
          ]
        },
        {
          type: "input",
          field: "field_4"
        }
      ]

      const normalized = normalizeNotifyDisplayRules(rules) as any[]
      expect(normalized[0].notify_hidden).toBe(true)
      expect(normalized[0].style.notify_hidden).toBe(true)
      expect(normalized[1].notify_hidden).toBe(true)
      expect(normalized[2].children[0].notify_hidden).toBe(true)
      expect(normalized[3].notify_hidden).toBeUndefined()
    })
  })

  describe("syncNotifyHiddenToRules", () => {
    it("should extract notify_hidden to root rule and maintain legacy compatibility", () => {
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
            notify_hidden: false
          }
        }
      ]

      const synced = syncNotifyHiddenToRules(rules) as any[]
      expect(synced[0].notify_hidden).toBe(true)
      expect(synced[0].style.notify_hidden).toBe(true)
      expect(synced[0].style.notify_display).toBe("false")

      expect(synced[1].notify_hidden).toBeUndefined()
      expect(synced[1].style?.notify_hidden).toBeUndefined()
    })
  })
})
