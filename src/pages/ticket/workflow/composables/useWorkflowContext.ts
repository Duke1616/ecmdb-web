import { provide, inject, type InjectionKey, type Ref } from "vue"
import type LogicFlow from "@logicflow/core"

export interface WorkflowContext {
  lf: Ref<LogicFlow | undefined>
  engineType: Ref<string>
  isReadonly: Ref<boolean>
  updateNodeProperties: (nodeId: string, properties: Record<string, any>) => void
  updateNodeText: (nodeId: string, text: string) => void
  syncCanvasData: () => void
}

export const WORKFLOW_CONTEXT_KEY: InjectionKey<WorkflowContext> = Symbol("WORKFLOW_CONTEXT")

/**
 * 根设计器提供工作流依赖上下文
 */
export const provideWorkflowContext = (context: WorkflowContext) => {
  provide(WORKFLOW_CONTEXT_KEY, context)
}

/**
 * 子孙组件安全消费工作流上下文
 */
export const useWorkflowContext = (): WorkflowContext | undefined => {
  return inject(WORKFLOW_CONTEXT_KEY, undefined)
}
