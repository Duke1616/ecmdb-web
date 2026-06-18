import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { Executor } from "./type"

/**
 * 获取执行器列表
 * @returns 执行器及其节点列表
 */
export const listExecutorsApi = () => {
  return instance.get<Executor[]>({
    url: `${API_SERVICE.TASK}/executor/list`
  })
}
