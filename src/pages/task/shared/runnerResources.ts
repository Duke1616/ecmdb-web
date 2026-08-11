import { Kind } from "@/api/task/runner/types/runner"
import { ResourceKind, type HandlerDetail, type Resource } from "@/api/task/resource/type"

interface RunnerHandlerReference {
  kind: Kind
  target: string
  handler: string
}

const resourceKindByRunnerKind: Record<Kind, ResourceKind> = {
  [Kind.GRPC]: ResourceKind.Executor,
  [Kind.KAFKA]: ResourceKind.Agent
}

/** 根据 Runner 的执行通道、资源池和 Handler 名称解析对应元数据。 */
export const resolveRunnerHandler = (
  runner: RunnerHandlerReference | null | undefined,
  resources: readonly Resource[]
): HandlerDetail | undefined => {
  if (!runner) return undefined
  const resourceKind = resourceKindByRunnerKind[runner.kind]
  return resources
    .find((resource) => resource.kind === resourceKind && resource.name === runner.target)
    ?.handlers.find((handler) => handler.name === runner.handler)
}
