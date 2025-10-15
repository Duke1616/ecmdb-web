/**
 * 升级配置管理组合式函数
 */

import { ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useRouter } from "vue-router"
import { usePagination } from "@/common/composables/usePagination"
import {
  listConfigsApi,
  createConfigApi,
  updateConfigApi,
  deleteConfigApi,
  updateConfigStatusApi,
  swapConfigPrioritiesApi
} from "@/api/alert/escalation"
import type { ConfigVO, CreateConfigReq } from "@/api/alert/escalation/types"
import { ESCALATION_LOGIC_TYPES } from "@/api/alert/escalation/types"

export function useEscalationConfig() {
  const router = useRouter()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  const configs = ref<ConfigVO[]>([])
  const loading = ref(false)

  // 加载配置数据
  const loadConfigs = async () => {
    loading.value = true
    try {
      const response = await listConfigsApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      configs.value = response.data.configs || []
      paginationData.total = response.data.total || 0
    } finally {
      loading.value = false
    }
  }

  // 创建配置
  const createConfig = async (data: CreateConfigReq) => {
    await createConfigApi(data)
    await loadConfigs()
    return true
  }

  // 更新配置
  const updateConfig = async (id: number, data: Partial<CreateConfigReq>) => {
    await updateConfigApi({
      id,
      name: data.name || "",
      description: data.description || "",
      enabled: data.enabled ?? true,
      timeout: data.timeout || 300,
      triggers: data.triggers || [],
      trigger_logic: data.trigger_logic || { type: ESCALATION_LOGIC_TYPES.ALL, expression: "", description: "" }
    })
    await loadConfigs()
    return true
  }

  // 删除配置
  const deleteConfig = async (config: ConfigVO) => {
    await ElMessageBox.confirm(`确定要删除配置 "${config.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteConfigApi(config.id)
    await loadConfigs()
    return true
  }

  // 切换配置状态
  const toggleConfigStatus = async (config: ConfigVO) => {
    const action = config.enabled ? "禁用" : "启用"
    await ElMessageBox.confirm(`确定要${action}配置 "${config.name}" 吗？`, `确认${action}`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await updateConfigStatusApi(config.id)

    await loadConfigs()
    ElMessage.success(`配置已${config.enabled ? "禁用" : "启用"}`)
    return true
  }

  // 跳转到步骤管理页面
  const navigateToSteps = (config: ConfigVO) => {
    router.push(`/alert/escalation/steps/${config.id}`)
  }

  // 交换配置优先级
  const swapConfigPriorities = async (srcId: number, dstId: number) => {
    try {
      await swapConfigPrioritiesApi({
        src_id: srcId,
        dst_id: dstId
      })
      await loadConfigs()
      return true
    } catch (error) {
      console.error("交换配置优先级失败:", error)
      throw error
    }
  }

  return {
    configs,
    loading,
    paginationData,
    loadConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfigStatus,
    navigateToSteps,
    swapConfigPriorities,
    handleCurrentChange,
    handleSizeChange
  }
}
