import { describe, expect, it } from "vitest"
import { ParameterRole, type Parameter } from "@/api/task/resource/type"
import { buildPreviewOverrides } from "./previewParams"

const parameters: Parameter[] = [
  { key: "args", role: ParameterRole.Args, desc: "参数", required: false, default: "{}", bindings: {} },
  { key: "extra_args", desc: "扩展参数", required: false, default: "", bindings: {} },
  { key: "vars", role: ParameterRole.Variables, desc: "变量", required: false, default: "[]", bindings: {} }
]

describe("Codebook 试运行调用参数", () => {
  it("分离普通参数与变量覆盖", () => {
    expect(
      buildPreviewOverrides(
        {
          args: '{"environment":"production"}',
          extra_args: "--syntax-check",
          vars: '[{"key":"REGION","value":"us","secret":false}]'
        },
        parameters
      )
    ).toEqual({
      params: { args: '{"environment":"production"}', extra_args: "--syntax-check" },
      variables: [{ key: "REGION", value: "us", secret: false }]
    })
  })

  it("没有变量覆盖时只提交普通参数", () => {
    expect(buildPreviewOverrides({ extra_args: "--check" }, parameters)).toEqual({
      params: { extra_args: "--check" },
      variables: []
    })
  })

  it("拒绝非法变量输入", () => {
    expect(() => buildPreviewOverrides({ vars: "{}" }, parameters)).toThrow("运行变量必须是键值数组")
  })
})
