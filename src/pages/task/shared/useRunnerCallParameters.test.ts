import { describe, expect, it } from "vitest"
import { ParameterRole, type HandlerDetail } from "@/api/task/resource/type"
import { buildRunnerDeclaredDefaults } from "./runnerCallDefaults"

const variableParameter = (key: string): HandlerDetail => ({
  name: "handler",
  desc: "handler",
  metadata: [
    {
      key,
      role: ParameterRole.Variables,
      desc: "变量",
      required: false,
      default: "[]",
      bindings: {}
    }
  ]
})

describe("Runner 调用参数默认值", () => {
  it("按 Handler 声明的语义 Key 注入 Runner 私有变量", () => {
    const runner = {
      parameter_defaults: { extra_args: "--syntax-check" },
      variables: [{ key: "REGION", value: "cn", secret: false }]
    }

    expect(buildRunnerDeclaredDefaults(runner, variableParameter("variables"))).toEqual({
      extra_args: "--syntax-check",
      variables: '[{"key":"REGION","value":"cn","secret":false}]'
    })
    expect(buildRunnerDeclaredDefaults(runner, variableParameter("vars"))).toEqual({
      extra_args: "--syntax-check",
      vars: '[{"key":"REGION","value":"cn","secret":false}]'
    })
  })
})
