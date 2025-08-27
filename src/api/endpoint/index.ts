import type * as endpoint from "./types/endpoint"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 列表 */
export function listEndpointApi(data: endpoint.listByPathReq) {
  return instance.post<endpoint.endpoints>({
    url: `${API_SERVICE.CMDB}/endpoint/list`,
    data: data
  })
}
