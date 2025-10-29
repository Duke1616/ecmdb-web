import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveTicketConfigReq,
  SaveTicketConfigResponse,
  ListTicketConfigsResponse,
  DeleteTicketConfigResponse,
  ToggleTicketConfigStatusResponse,
  SwapPrioritiesReq,
  SwapPrioritiesResponse,
  TicketConfig
} from "./types"

// 创建工单配置
export const createTicketConfigApi = (data: SaveTicketConfigReq) => {
  return instance.post<SaveTicketConfigResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/create`,
    data
  })
}

// 更新工单配置
export const updateTicketConfigApi = (data: SaveTicketConfigReq) => {
  return instance.put<SaveTicketConfigResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/update`,
    data
  })
}

// 保存工单配置（统一创建和更新）
export const saveTicketConfigApi = (data: SaveTicketConfigReq) => {
  if (data.id) {
    return updateTicketConfigApi(data)
  }
  return createTicketConfigApi(data)
}

// 删除工单配置
export const deleteTicketConfigApi = (id: number) => {
  return instance.delete<DeleteTicketConfigResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/delete/${id}`
  })
}

// 获取工单配置详情
export const getTicketConfigByIdApi = (id: number) => {
  return instance.get<TicketConfig>({
    url: `${API_SERVICE.ALERT}/ticket_config/detail/${id}`
  })
}

// 按工作空间获取工单配置列表
export const listTicketConfigsByWorkspaceApi = (workspaceId: number) => {
  return instance.get<ListTicketConfigsResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/list/${workspaceId}`
  })
}

// 切换工单配置状态
export const toggleTicketConfigStatusApi = (id: number) => {
  return instance.patch<ToggleTicketConfigStatusResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/status/toggle/${id}`
  })
}

// 交换两个配置的优先级
export const swapPrioritiesApi = (data: SwapPrioritiesReq) => {
  return instance.post<SwapPrioritiesResponse>({
    url: `${API_SERVICE.ALERT}/ticket_config/swap_priorities`,
    data
  })
}
