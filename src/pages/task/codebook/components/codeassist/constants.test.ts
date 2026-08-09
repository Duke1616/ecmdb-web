import { describe, expect, it } from "vitest"
import { CODE_ASSIST_PROFILES, DEFAULT_PROFILE_ID } from "./constants"

describe("CodeAssist profiles", () => {
  it("默认使用自然语言智能协作", () => {
    const profile = CODE_ASSIST_PROFILES.find((item) => item.id === DEFAULT_PROFILE_ID)

    expect(profile?.label).toBe("智能协作")
    expect(profile?.description).toContain("自动解释、审阅或生成候选变更")
  })

  it("专项 Profile 不携带隐藏 Prompt", () => {
    expect(CODE_ASSIST_PROFILES).toHaveLength(4)
    expect(CODE_ASSIST_PROFILES.every((profile) => !("prompt" in profile))).toBe(true)
  })
})
