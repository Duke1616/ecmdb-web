import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { RetrieveResult, QueryRange } from "./types/index"

/** 获取时序数据 */
export function QueryRangeApi(params: QueryRange) {
  return instance.post<RetrieveResult>({
    url: `${API_SERVICE.ALERT}/proxy/query_range`,
    data: params
  })
}
