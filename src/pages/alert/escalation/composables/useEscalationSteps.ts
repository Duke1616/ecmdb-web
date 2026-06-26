/**
 * 升级步骤管理组合式函数
 */

import { ref, computed } from "vue"
import { useRoute } from "vue-router"
import {
  listStepsByConfigIDApi,
  createStepApi,
  updateStepApi,
  swapStepLevelsApi
} from "@/api/alert/escalation"
import type { StepVO, CreateStepReq } from "@/api/alert/escalation/types"
import { getEscalationStepConfigID } from "../utils"

export function useEscalationSteps() {
  const route = useRoute()

  const steps = ref<StepVO[]>([])
  const loading = ref(false)

  const configId = computed(() => getEscalationStepConfigID(route))

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
      channels: data.channels || [],
      receivers: data.receivers || [],
      delay: data.delay || 30,
      max_retries: data.max_retries || 3,
      retry_interval: data.retry_interval || 60,
      skip_if_handled: data.skip_if_handled ?? false,
      continue_on_fail: data.continue_on_fail ?? true,
      condition_expr: data.condition_expr || "",
      urgency_level: data.urgency_level || 1
    }

    await updateStepApi(updateData)
    await loadSteps()
    return true
  }

  // 交换步骤等级
  const swapStepLevels = async (srcId: number, dstId: number) => {
    try {
      await swapStepLevelsApi({
        src_id: srcId,
        dst_id: dstId
      })
      await loadSteps()
      return true
    } catch (error) {
      console.error("交换步骤等级失败:", error)
      throw error
    }
  }

  return {
    steps,
    loading,
    configId,
    loadSteps,
    createStep,
    updateStep,
    swapStepLevels
  }
}
