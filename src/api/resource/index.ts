import instance from "@/utils/hy_service"
import type * as resource from "./types/resource"

/** 获取模型下所有资源 */
export function listResourceApi(data: resource.ListResourceReq) {
  return instance.post<resource.ResourceData>({
    url: "resource/list",
    data: data
  })
}

/** 新增资源 */
export function createResourceApi(data: resource.CreateResourceReq) {
  return instance.post<number>({
    url: "resource/create",
    data: data
  })
}
