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

/** 资源详情 */
export function detailResourceApi(data: resource.detailResource) {
  return instance.post<resource.Resource>({
    url: "resource/detail",
    data: data
  })
}

/** 删除资源 */
export function deleteResourceApi(id: number) {
  return instance.post<number>({
    url: "resource/delete",
    data: { id: id }
  })
}

/** 获取可关联的数据 */
export function canBeRelatedResourceApi(data: resource.canBeRelationReq) {
  return instance.post<resource.ResourceData>({
    url: "resource/relation/can_be_related",
    data: data
  })
}
