/**
 * 升级步骤管理组合式函数
 */

import { ref, computed } from "vue"
import { ElMessageBox } from "element-plus"
import { useRoute } from "vue-router"
import {
  listStepsByConfigIDApi,
  createStepApi,
  updateStepApi,
  deleteStepApi,
  getConfigApi
} from "@/api/alert/escalation"
import type { StepVO, CreateStepReq, ConfigVO } from "@/api/alert/escalation/types"

export function useEscalationSteps() {
  const route = useRoute()

  const config = ref<ConfigVO | null>(null)
  const steps = ref<StepVO[]>([])
  const selectedSteps = ref<StepVO[]>([])
  const loading = ref(false)

  const configId = computed(() => Number(route.params.id))

  // 加载配置信息
  const loadConfig = async () => {
    if (!configId.value) return

    const response = await getConfigApi(configId.value)
    config.value = response.data.config
  }

  // 加载步骤数据
  const loadSteps = async () => {
    if (!configId.value) return

    loading.value = true
    try {
      const response = await listStepsByConfigIDApi({
        config_id: configId.value
      })

      steps.value = response.data.steps || []
    } finally {
      loading.value = false
    }
  }

  // 创建步骤
  const createStep = async (data: CreateStepReq) => {
    const createData = {
      ...data,
      config_id: configId.value
    }

    console.log("创建步骤数据:", createData)
    console.log("configId.value:", configId.value)

    await createStepApi(createData)
    await loadSteps()
    return true
  }

  // 更新步骤
  const updateStep = async (id: number, data: Partial<CreateStepReq>) => {
    const updateData = {
      id,
      level: data.level || 1,
      config_id: configId.value,
      template_set_id: data.template_set_id || 0,
      step_template_id: data.step_template_id,
      delay: data.delay || 0,
      max_retries: data.max_retries || 3,
      retry_interval: data.retry_interval || 60,
      skip_if_handled: data.skip_if_handled ?? false,
      continue_on_fail: data.continue_on_fail ?? true,
      condition_expr: data.condition_expr || "",
      urgency_level: data.urgency_level || 1
    }

    console.log("更新步骤数据:", updateData)
    console.log("configId.value:", configId.value)

    await updateStepApi(updateData)
    await loadSteps()
    return true
  }

  // 删除步骤
  const deleteStep = async (step: StepVO) => {
    await ElMessageBox.confirm(`确定要删除第 ${step.level} 级步骤吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteStepApi(step.id)
    await loadSteps()
    return true
  }

  // 批量删除步骤
  const deleteSteps = async (stepIds: number[]) => {
    await ElMessageBox.confirm(`确定要删除选中的 ${stepIds.length} 个步骤吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    for (const stepId of stepIds) {
      await deleteStepApi(stepId)
    }

    await loadSteps()
    return true
  }

  return {
    config,
    steps,
    selectedSteps,
    loading,
    configId,
    loadConfig,
    loadSteps,
    createStep,
    updateStep,
    deleteStep,
    deleteSteps
  }
}
