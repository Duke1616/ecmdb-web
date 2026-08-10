import { describe, expect, it } from "vitest"
import { Kind, type runner } from "@/api/task/runner/types/runner"
import {
  ResourceDispatchMode,
  ResourceIsolation,
  ResourceKind,
  ResourceTransport,
  type Resource
} from "@/api/task/resource/type"
import { ProgramKind } from "@/api/task/program"
import { resolveRunnerHandler } from "./programCapabilities"

const createRunner = (kind: Kind): runner => ({
  id: 1,
  name: "试运行",
  codebook_id: 1,
  program_kind: ProgramKind.INLINE,
  codebook_secret: "",
  kind,
  target: "runtime",
  handler: "shell",
  desc: "",
  tags: [],
  variables: []
})

const createResource = (kind: ResourceKind, programKinds: ProgramKind[]): Resource => ({
  name: "runtime",
  desc: "",
  kind,
  transport: kind === ResourceKind.Agent ? ResourceTransport.MQ : ResourceTransport.GRPC,
  dispatch_mode: ResourceDispatchMode.Push,
  isolation_level: ResourceIsolation.Shared,
  handlers: [{ name: "shell", desc: "Shell", program_kinds: programKinds }],
  nodes: []
})

describe("Codebook Runner 程序能力", () => {
  it("Agent Runner 只读取 Agent 资源的 Handler 能力", () => {
    const resources = [
      createResource(ResourceKind.Executor, [ProgramKind.INLINE]),
      createResource(ResourceKind.Agent, [ProgramKind.INLINE, ProgramKind.PROJECT])
    ]

    expect(resolveRunnerHandler(createRunner(Kind.KAFKA), resources)?.program_kinds).toEqual([
      ProgramKind.INLINE,
      ProgramKind.PROJECT
    ])
  })

  it("Executor Runner 只读取 Executor 资源的 Handler 能力", () => {
    const resources = [
      createResource(ResourceKind.Agent, [ProgramKind.PROJECT]),
      createResource(ResourceKind.Executor, [ProgramKind.INLINE, ProgramKind.PROJECT])
    ]

    expect(resolveRunnerHandler(createRunner(Kind.GRPC), resources)?.program_kinds).toEqual([
      ProgramKind.INLINE,
      ProgramKind.PROJECT
    ])
  })

  it("资源或 Handler 不匹配时不返回虚假的默认能力", () => {
    const resource = createResource(ResourceKind.Agent, [ProgramKind.INLINE, ProgramKind.PROJECT])
    expect(resolveRunnerHandler(createRunner(Kind.GRPC), [resource])).toBeUndefined()
  })
})
