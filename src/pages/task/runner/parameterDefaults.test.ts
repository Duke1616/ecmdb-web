import { describe, expect, it } from "vitest"
import { ParameterRole, type Parameter } from "@/api/task/resource/type"
import { inputsToParameterDefaults, parameterDefaultsToInputs } from "./parameterDefaults"

const parameters: Parameter[] = [
  {
    key: "args",
    role: ParameterRole.Args,
    desc: "参数",
    required: false,
    default: "{}",
    bindings: { static: { component: "code-editor", config: {}, placeholder: "", label: "" } }
  },
  {
    key: "check",
    desc: "预演",
    required: false,
    default: "false",
    bindings: { static: { component: "boolean-switch", config: {}, placeholder: "", label: "" } }
  },
  {
    key: "forks",
    desc: "并发",
    required: false,
    default: "0",
    bindings: { static: { component: "number-input", config: {}, placeholder: "", label: "" } }
  },
  { key: "vars", role: ParameterRole.Variables, desc: "变量", required: false, default: "[]", bindings: {} }
]

describe("Runner 默认参数转换", () => {
  it("在编辑字符串与 JSON 存储格式之间转换", () => {
    const inputs = parameterDefaultsToInputs({ args: { env: "dev" }, check: true, forks: 5 })
    expect(inputs).toEqual({ args: '{"env":"dev"}', check: "true", forks: "5" })
    expect(inputsToParameterDefaults({ ...inputs, vars: "[]", stale: "x" }, parameters)).toEqual({
      args: { env: "dev" },
      check: true,
      forks: 5
    })
  })
})
