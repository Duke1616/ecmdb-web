import { reactive } from "vue"
import type { SaveTicketConfigReq, TicketConfig } from "@/api/alert/ticket_config/types"
import { clearZeroValues } from "@@/utils"

/**
 * 工单配置工具函数 Composable
 */
export function useTicketConfigUtils() {
  // 创建表单数据的工具函数
  const createFormData = (data: Partial<SaveTicketConfigReq> = {}): SaveTicketConfigReq => {
    return reactive({
      workspace_id: 0,
      name: "",
      description: "",
      enabled: true,
      priority: 0,
      levels: [],
      matchers: [],
      duration: 0,
      eval_count: 1,
      template_id: 0,
      ...data
    })
  }

  // 将 TicketConfig 转换为 SaveTicketConfigReq 的工具函数（自动清空零值）
  const convertConfigToFormData = (config: TicketConfig): SaveTicketConfigReq => {
    const data = {
      workspace_id: config.workspace_id,
      name: config.name,
      description: config.description || "",
      enabled: config.enabled,
      priority: config.priority || 0,
      levels: config.levels || [],
      matchers: config.matchers || [],
      duration: config.duration || 0,
      eval_count: config.eval_count || 1,
      template_id: config.template_id || 0
    }
    return clearZeroValues(data)
  }

  // 重置表单数据（自动清空零值）
  const createEmptyFormData = (): SaveTicketConfigReq => {
    const data = createFormData()
    return clearZeroValues(data)
  }

  return {
    createFormData,
    convertConfigToFormData,
    createEmptyFormData
  }
}
