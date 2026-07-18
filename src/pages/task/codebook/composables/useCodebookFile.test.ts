import { describe, expect, it } from "vitest"
import { buildScriptFileName, parseScriptFileName, type ScriptFileType } from "./useCodebookFile"

describe("脚本文件名", () => {
  const testCases: Array<{
    name: string
    input: string
    type: ScriptFileType
    want: string
  }> = [
    { name: "Shell 自动补充扩展名", input: "deploy", type: "sh", want: "deploy.sh" },
    { name: "Python 自动补充扩展名", input: "main", type: "py", want: "main.py" },
    { name: "避免重复扩展名", input: "deploy.sh", type: "sh", want: "deploy.sh" },
    { name: "自定义保留完整名称", input: "Dockerfile", type: "custom", want: "Dockerfile" }
  ]

  it.each(testCases)("$name", ({ input, type, want }) => {
    expect(buildScriptFileName(input, type)).toBe(want)
  })

  it("反解析内置扩展名", () => {
    expect(parseScriptFileName("deploy.py")).toEqual({ name: "deploy", type: "py" })
  })

  it("新脚本默认使用 Shell", () => {
    expect(parseScriptFileName("")).toEqual({ name: "", type: "sh" })
  })

  it("将其他扩展名识别为自定义", () => {
    expect(parseScriptFileName("deploy.js")).toEqual({ name: "deploy.js", type: "custom" })
  })
})
