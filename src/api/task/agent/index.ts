import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { Agent, ListAgentsReq, ListAgentsResp } from "./type"

/**
 * 获取 Agent 队列模式列表
 * @returns Agent 列表
 */
export const listAgentsApi = (params: ListAgentsReq = {}) => {
  return instance.get<ListAgentsResp>({
    url: `${API_SERVICE.TASK}/agent/list`,
    params
  })
}

export const listAllAgentsApi = async (params: Omit<ListAgentsReq, "cursor"> = {}) => {
  const agents: Agent[] = []
  let cursor = ""
  let hasMore = true

  while (hasMore) {
    const { data } = await listAgentsApi({
      ...params,
      cursor,
      limit: params.limit ?? 100
    })
    agents.push(...(data.agents || []))
    cursor = data.next_cursor || ""
    hasMore = data.has_more && Boolean(cursor)
  }

  return agents
}
