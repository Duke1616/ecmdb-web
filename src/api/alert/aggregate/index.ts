import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  AggregateGroupRule,
  DeleteAggregateRuleResponse,
  GetAggregateGroupByWorkspaceResp,
  ListAggregateRoutesResponse,
  ListAggregateRulesReq,
  ListAggregateRulesResponse,
  PreviewAggregateRouteReq,
  PreviewAggregateRouteResp,
  SaveAggregateGroupRuleReq,
  ReorderAggregateRoutesReq
} from "./types"

// 创建聚合路由
export const createAggregateRuleApi = (data: SaveAggregateGroupRuleReq) => {
  return instance.post<AggregateGroupRule>({
    url: `${API_SERVICE.ALERT}/aggregate/create`,
    data
  })
}

// 更新聚合路由
export const updateAggregateRuleApi = (data: SaveAggregateGroupRuleReq) => {
  return instance.put<AggregateGroupRule>({
    url: `${API_SERVICE.ALERT}/aggregate/update`,
    data
  })
}

// 兼容旧调用：带 id 走更新，否则走创建
export const saveAggregateRuleApi = (data: SaveAggregateGroupRuleReq) => {
  return data.id ? updateAggregateRuleApi(data) : createAggregateRuleApi(data)
}

// 获取工作空间下全部聚合路由节点
export const listAggregateRoutesByWorkspaceApi = (workspaceId: number) => {
  return instance.get<ListAggregateRoutesResponse>({
    url: `${API_SERVICE.ALERT}/aggregate/list/${workspaceId}`
  })
}

// 兼容旧调用：旧接口返回分页对象，新后端返回路由数组
export const listAggregateRulesApi = async (data: ListAggregateRulesReq) => {
  const resp = await listAggregateRoutesByWorkspaceApi(data.workspace_id)
  return {
    ...resp,
    data: {
      rules: resp.data,
      total: resp.data.length
    } satisfies ListAggregateRulesResponse
  }
}

// 删除聚合路由。当前后端仍禁止删除，前端页面会隐藏/禁用该操作。
export const deleteAggregateRuleApi = (id: number) => {
  return instance.delete<DeleteAggregateRuleResponse>({
    url: `${API_SERVICE.ALERT}/aggregate/delete/${id}`
  })
}

// 获取工作空间默认/root 聚合路由
export const getAggregateGroupByWorkspaceApi = (workspaceId: number) => {
  return instance.get<GetAggregateGroupByWorkspaceResp>({
    url: `${API_SERVICE.ALERT}/aggregate/detail/${workspaceId}`
  })
}

// 预览一条模拟告警最终命中的聚合路由
export const previewAggregateRouteApi = (data: PreviewAggregateRouteReq) => {
  return instance.post<PreviewAggregateRouteResp>({
    url: `${API_SERVICE.ALERT}/aggregate/preview`,
    data
  })
}

// 旧详情接口已由 detail/:workspace_id 替代，这里保留签名避免历史引用报错。
export const getAggregateRuleDetailApi = (data: { id: number }) => {
  return instance.get<AggregateGroupRule>({
    url: `${API_SERVICE.ALERT}/aggregate/detail/${data.id}`
  })
}

// 重排聚合路由
export const reorderAggregateRoutesApi = (data: ReorderAggregateRoutesReq) => {
  return instance.post<void>({
    url: `${API_SERVICE.ALERT}/aggregate/reorder`,
    data
  })
}

