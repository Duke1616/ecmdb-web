import { describe, expect, it } from "vitest"
import { TaskProtocol, TaskStatus, TaskType, type TaskItem } from "@/api/task/manager/type"
import { ProgramKind } from "@/api/task/program"
import {
  createDefaultFormState,
  defaultParameterBinding,
  mapToApiPayload,
  mapToFormState,
  validateBoundParameters
} from "./useTaskData"

describe("任务程序来源映射", () => {
  it("详情中的 PROJECT 程序能原样提交", () => {
    const task = {
      id: 1,
      name: "ansible",
      type: TaskType.ONE_TIME,
      status: TaskStatus.ACTIVE,
      next_time: 0,
      ctime: 0,
      utime: 0,
      grpc_config: { service_name: "executor", handler_name: "ansible", params: { args: "{}" } },
      program: { kind: ProgramKind.PROJECT, project: { entry_codebook_id: 12 } }
    } satisfies TaskItem

    const form = mapToFormState(task)
    expect(form.program).toEqual(task.program)
    expect(mapToApiPayload(form).program).toEqual(task.program)
  })

  it("提交 ProgramSpec 时保留普通参数", () => {
    const form = createDefaultFormState()
    form.protocol = TaskProtocol.GRPC
    form.grpc_service = "executor"
    form.grpc_handler = "shell"
    form.grpc_params = { timeout: "11", args: "{}" }
    form.metadata = { timeout: "static", variables: "runner" }
    form.program = { kind: ProgramKind.INLINE, inline: { codebook_id: 11 } }

    const payload = mapToApiPayload(form)
    expect(payload.grpc_config?.params).toEqual({ timeout: "11", args: "{}" })
    expect(payload.metadata).toEqual({ timeout: "static", variables: "runner" })
  })
})

describe("任务动态参数校验", () => {
  const handler = {
    name: "ansible",
    desc: "Ansible",
    metadata: [
      {
        key: "variables",
        desc: "环境变量",
        required: false,
        default: "[]",
        bindings: {
          static: { component: "kv-input", config: {}, placeholder: "", label: "手动输入" },
          runner: { component: "runner-picker", config: {}, placeholder: "", label: "执行单元引用" }
        }
      }
    ]
  }

  it("拒绝 runner 绑定提交空 ID", () => {
    const form = createDefaultFormState()
    form.metadata = { variables: "runner" }
    form.grpc_params = { variables: "" }

    expect(validateBoundParameters(form, handler)).toBe("请选择环境变量对应的执行单元")
  })

  it("允许 runner 绑定提交有效 ID", () => {
    const form = createDefaultFormState()
    form.metadata = { variables: "runner" }
    form.grpc_params = { variables: "34" }

    expect(validateBoundParameters(form, handler)).toBeUndefined()
  })

  it("不要求静态的非必填参数有值", () => {
    const form = createDefaultFormState()
    form.metadata = { variables: "static" }
    form.grpc_params = { variables: "" }

    expect(validateBoundParameters(form, handler)).toBeUndefined()
  })

  it("不依赖 bindings 顺序并优先选择静态模式", () => {
    expect(defaultParameterBinding(handler.metadata[0])).toBe("static")
  })
})
