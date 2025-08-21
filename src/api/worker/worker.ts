import type * as worker from "./types/worker"
import instance from "@/common/utils/hy_service"

/** 列表 */
export function listWorkerApi(data: worker.listWorkerReq) {
  return instance.post<worker.workers>({
    url: "worker/list",
    data: data
  })
}
