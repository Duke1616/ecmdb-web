import type * as endpoint from "./types/endpoint"
import instance from "@/common/utils/service"

/** 列表 */
export function listEndpointApi(data: endpoint.listByPathReq) {
  return instance.post<endpoint.endpoints>({
    url: "endpoint/list",
    data: data
  })
}
