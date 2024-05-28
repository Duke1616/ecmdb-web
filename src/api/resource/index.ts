import instance from "@/utils/hy_service"
import type * as resource from "./types/resource"
import { RGJsonData } from "relation-graph-vue3"

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

/** 获取可关联的数据, 增加过滤条件 */
export function canBeRelatedFilterResourceApi(data: resource.canBeRelationFilterReq) {
  return instance.post<resource.ResourceData>({
    url: "resource/relation/can_be_related",
    data: data
  })
}

/** 根据ids获取资源 */
export function listResourceByIdsApi(modelUid: string, resourceIds: number[]) {
  return instance.post<resource.ResourceData>({
    url: "resource/list/ids",
    data: { model_uid: modelUid, resource_ids: resourceIds }
  })
}

/** 查询拓扑图 */
export function findGraphApi(data: resource.findGraphReq) {
  return instance.post<RGJsonData>({
    url: "resource/relation/graph",
    data: data
  })
}

/** 拓扑图 Left 方向扩展 */
export function findLeftGraphApi(data: resource.findGraphReq) {
  return instance.post<RGJsonData>({
    url: "resource/relation/graph/add/left",
    data: data
  })
}

/** 拓扑图 Right 方向扩展 */
export function findRightGraphApi(data: resource.findGraphReq) {
  return instance.post<RGJsonData>({
    url: "resource/relation/graph/add/right",
    data: data
  })
}

/** 全局检索 */
export function globalSearchApi(text: string) {
  return instance.post<resource.globalSearchData[]>({
    url: "resource/search",
    data: { text: text }
  })
}
