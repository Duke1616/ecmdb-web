import { Kind, type runner } from "@/api/task/runner/types/runner"
import { ResourceKind, type HandlerDetail, type Resource } from "@/api/task/resource/type"

const resourceKindByRunnerKind: Record<Kind, ResourceKind> = {
  [Kind.GRPC]: ResourceKind.Executor,
  [Kind.KAFKA]: ResourceKind.Agent
}

/** 按执行通道、资源池和 Handler 精确解析 Runner 的程序能力。 */
export const resolveRunnerHandler = (
  candidate: runner | undefined,
  resources: readonly Resource[]
): HandlerDetail | undefined => {
  if (!candidate) return undefined
  const resourceKind = resourceKindByRunnerKind[candidate.kind]
  return resources
    .find((resource) => resource.kind === resourceKind && resource.name === candidate.target)
    ?.handlers.find((handler) => handler.name === candidate.handler)
}
