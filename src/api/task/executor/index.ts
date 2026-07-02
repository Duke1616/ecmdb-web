import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { Executor, ListExecutorsReq, ListExecutorsResp } from "./type"

/**
 * 获取执行器列表
 * @returns 执行器及其节点列表
 */
export const listExecutorsApi = (params: ListExecutorsReq = {}) => {
  return instance.get<ListExecutorsResp>({
    url: `${API_SERVICE.TASK}/executor/list`,
    params
  })
}

export const listAllExecutorsApi = async (params: Omit<ListExecutorsReq, "cursor"> = {}) => {
  const executors: Executor[] = []
  let cursor = ""
  let hasMore = true

  while (hasMore) {
    const { data } = await listExecutorsApi({
      ...params,
      cursor,
      limit: params.limit ?? 100
    })
    executors.push(...(data.executors || []))
    cursor = data.next_cursor || ""
    hasMore = data.has_more && Boolean(cursor)
  }

  return executors
}
