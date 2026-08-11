import { computed, type Ref } from "vue"
import type { TaskFormState } from "./useTaskData"
import { useRunnerCallParameters } from "@/pages/task/shared/useRunnerCallParameters"

/** 任务管理对通用 Runner 调用参数上下文的表单适配。 */
export const useRunnerParameterOverrides = (form: Ref<TaskFormState>) => {
  const overrides = computed<Record<string, string>>({
    get: () => form.value.runner_params,
    set: (values) => {
      form.value.runner_params = values
    }
  })
  return useRunnerCallParameters(overrides)
}
