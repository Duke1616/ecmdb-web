import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { AddQueryHistoryReq, ListQueryHistoryReq, ListQueryHistoryResp } from "./types"

/**
 * 添加查询历史
 */
export const addQueryHistoryApi = (data: AddQueryHistoryReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/query_history/add`,
    data
  })
}

/**
 * 获取查询历史列表
 */
export const listQueryHistoryApi = (params: ListQueryHistoryReq = {}) => {
  return instance.get<ListQueryHistoryResp>({
    url: `${API_SERVICE.ALERT}/query_history/list`,
    params
  })
}

/**
 * 删除指定查询历史
 */
export const deleteQueryHistoryApi = (timestamp: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/query_history/delete/${timestamp}`
  })
}

/**
 * 清空所有查询历史
 */
export const clearQueryHistoryApi = () => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/query_history/clear`
  })
}
