import type * as worker from "./types/worker"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 列表 */
export function listWorkerApi(data: worker.listWorkerReq) {
  return instance.post<worker.workers>({
    url: `${API_SERVICE.CMDB}/worker/list`,
    data: data
  })
}
