import { describe, expect, it } from "vitest"
import { getDefaultScriptCode, isReplaceableScriptCode } from "./scriptTemplates"

describe("Codebook 默认脚本模板", () => {
  it("Shell 模板使用当前运行契约", () => {
    const code = getDefaultScriptCode("sh")
    expect(code).toContain('args=$(<"$ETASK_ARGS_FILE")')
    expect(code).toContain("ETASK_SYSTEM_ROOT")
    expect(code).toContain("main")
  })

  it("Python 模板使用当前运行契约", () => {
    const code = getDefaultScriptCode("py")
    expect(code).toContain('load_json("ETASK_ARGS_FILE")')
    expect(code).toContain('load_json("ETASK_VARIABLES_FILE")')
    expect(code).toContain("from etask.third_party.base.want_result import want_result")
    expect(code).toContain('want_result(status="success", message="任务执行完成")')
    expect(code).toContain('if __name__ == "__main__":')
  })

  it("自定义类型不生成模板", () => {
    expect(getDefaultScriptCode("custom")).toBe("")
  })

  it("只允许空内容或默认模板被自动替换", () => {
    expect(isReplaceableScriptCode("")).toBe(true)
    expect(isReplaceableScriptCode(getDefaultScriptCode("sh"))).toBe(true)
    expect(isReplaceableScriptCode('echo "用户代码"')).toBe(false)
  })
})
