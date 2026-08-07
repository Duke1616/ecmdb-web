import { describe, expect, it } from "vitest"
import { TaskProtocol, TaskStatus, TaskType, type TaskItem } from "@/api/task/manager/type"
import { ProgramKind } from "@/api/task/program"
import { createDefaultFormState, mapToApiPayload, mapToFormState } from "./useTaskData"

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
