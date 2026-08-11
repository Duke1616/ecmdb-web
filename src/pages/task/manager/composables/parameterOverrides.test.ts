import { describe, expect, it } from "vitest"
import type { Parameter } from "@/api/task/resource/type"
import { mergeParameterValues, pickParameterOverrides, serializeRunnerVariables } from "./parameterOverrides"

const parameter = (key: string, component: string, config: Record<string, string> = {}): Parameter => ({
  key,
  desc: key,
  required: false,
  default: "",
  bindings: { static: { component, config, placeholder: "", label: "手动输入" } }
})

describe("参数差异覆盖", () => {
  it("展示默认值和已有覆盖值的合并结果", () => {
    expect(
      mergeParameterValues({ timeout: "30", check: "false", args: "{}" }, { timeout: "60", args: '{"env":"dev"}' })
    ).toEqual({ timeout: "60", check: "false", args: '{"env":"dev"}' })
  })

  it("只保留相对默认值真正变化的字段", () => {
    expect(
      pickParameterOverrides(
        { timeout: "60", check: "false", args: "{}", custom: "value" },
        { timeout: "30", check: "false", args: "{}" }
      )
    ).toEqual({ timeout: "60", custom: "value" })
  })

  it("JSON 仅格式和对象字段顺序变化时不生成覆盖", () => {
    const args = parameter("args", "code-editor", { language: "json" })
    expect(
      pickParameterOverrides({ args: '{\n  "retries": 3,\n  "env": "dev"\n}' }, { args: '{"env":"dev","retries":3}' }, [
        args
      ])
    ).toEqual({})
  })

  it("变量键值数组内容变化时保留覆盖", () => {
    const variables = parameter("variables", "kv-input")
    expect(
      pickParameterOverrides(
        { variables: '[{"key":"ENV","value":"prod","secret":false}]' },
        { variables: '[{"key":"ENV","value":"dev","secret":false}]' },
        [variables]
      )
    ).toEqual({ variables: '[{"key":"ENV","value":"prod","secret":false}]' })
  })

  it("把 Runner 私有变量转换为 variables 参数继承值", () => {
    expect(serializeRunnerVariables([{ key: "ENV", value: "dev", secret: false }])).toBe(
      '[{"key":"ENV","value":"dev","secret":false}]'
    )
  })
})
