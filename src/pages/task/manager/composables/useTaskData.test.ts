import { describe, expect, it } from "vitest"
import { TaskProtocol, TaskStatus, TaskType, type TaskItem } from "@/api/task/manager/type"
import { ProgramKind } from "@/api/task/program"
import { createDefaultFormState, mapToApiPayload, mapToFormState, validateBoundParameters } from "./useTaskData"

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

  it("Runner 任务只提交执行单元和调用参数覆盖", () => {
    const form = createDefaultFormState()
    form.protocol = TaskProtocol.RUNNER
    form.runner_id = 18
    form.runner_params = { args: '{"env":"dev"}' }
    form.grpc_params = { direct_only: "kept" }
    form.metadata = { variables: "runner" }

    const payload = mapToApiPayload(form)
    expect(payload.runner_id).toBe(18)
    expect(payload.grpc_config).toEqual({
      service_name: "",
      handler_name: "",
      params: { args: '{"env":"dev"}' }
    })
    expect(payload.program).toBeUndefined()
    expect(payload.metadata).toEqual({})

    form.protocol = TaskProtocol.GRPC
    form.grpc_service = "executor"
    form.grpc_handler = "shell"
    expect(mapToApiPayload(form).grpc_config?.params).toEqual({ direct_only: "kept" })
  })

  it("详情中的 runner_id 恢复为执行单元模式", () => {
    const task = {
      id: 2,
      runner_id: 18,
      name: "runner-task",
      type: TaskType.ONE_TIME,
      status: TaskStatus.ACTIVE,
      next_time: 0,
      ctime: 0,
      utime: 0,
      grpc_config: { service_name: "executor", handler_name: "ansible", params: { check: "true" } }
    } satisfies TaskItem

    const form = mapToFormState(task)
    expect(form.protocol).toBe(TaskProtocol.RUNNER)
    expect(form.runner_id).toBe(18)
    expect(form.runner_params).toEqual({ check: "true" })
    expect(form.grpc_params).toEqual({})
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

  it("任务参数覆盖规则能够从详情恢复并提交", () => {
    const task = {
      id: 3,
      name: "overridable-task",
      type: TaskType.ONE_TIME,
      status: TaskStatus.ACTIVE,
      next_time: 0,
      ctime: 0,
      utime: 0,
      param_override_rules: [
        { param_key: "limit", allowed_modes: ["MANUAL"], default_mode: "MANUAL" },
        { param_key: "tags", allowed_modes: ["MANUAL"], default_mode: "MANUAL" }
      ],
      grpc_config: {
        service_name: "executor",
        handler_name: "ansible",
        params: { limit: "A40-02", tags: "stop" }
      }
    } satisfies TaskItem

    const form = mapToFormState(task)
    expect(form.param_override_rules.map((rule) => rule.param_key)).toEqual(["limit", "tags"])
    expect(mapToApiPayload(form).param_override_rules).toEqual(task.param_override_rules)
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
})
