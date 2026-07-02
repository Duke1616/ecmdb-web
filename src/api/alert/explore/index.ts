import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  RetrieveResult,
  QueryRange,
  AddQueryHistoryReq,
  ListQueryHistoryReq,
  ListQueryHistoryResp
} from "./types/index"

// ============= Query Range API =============

/** 获取时序数据 */
export function QueryRangeApi(params: QueryRange) {
  return instance.post<RetrieveResult>({
    url: `${API_SERVICE.ALERT}/explore/query_range`,
    data: params
  })
}

// ============= Query History API =============

/**
 * 添加查询历史
 */
export const addQueryHistoryApi = (data: AddQueryHistoryReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/explore/history/add`,
    data
  })
}

/**
 * 获取查询历史列表
 */
export const listQueryHistoryApi = (data: ListQueryHistoryReq = {}) => {
  return instance.post<ListQueryHistoryResp>({
    url: `${API_SERVICE.ALERT}/explore/history/list`,
    data
  })
}

/**
 * 删除指定查询历史
 */
export const deleteQueryHistoryApi = (timestamp: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/explore/history/delete/${timestamp}`
  })
}

/**
 * 清空所有查询历史
 */
export const clearQueryHistoryApi = () => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/explore/history/clear`
  })
}
