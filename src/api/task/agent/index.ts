import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { Agent } from "./type"

/**
 * 获取 Agent 队列模式列表
 * @returns Agent 列表
 */
export const listAgentsApi = () => {
  return instance.get<Agent[]>({
    url: `${API_SERVICE.TASK}/agent/list`
  })
}
