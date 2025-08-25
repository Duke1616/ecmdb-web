import type * as Relation from "./types/relation"

import instance from "@/common/utils/service"

/** 新增关联类型 */
export function CreateRelationTypeApi(data: Relation.CreateRealtionTypeReq) {
  return instance.post<number>({
    url: "relation/create",
    data: data
  })
}

/** 获取关联类型 */
export function ListRelationTypeApi(data: Relation.ListRelationTypeReq) {
  return instance
    .post<Relation.ListRelationTypeResult>({
      url: "relation/list",
      data: data
    })
    .then((response) => {
      console.log(response)
      return response
    })
}

/** 新增模型关联 */
export function CreateModelRelationApi(data: Relation.CreateModelRelationReq) {
  return instance.post<number>({
    url: "model/relation/create",
    data: data
  })
}

/** 获取模型关联 */
export function ListModelRelationApi(data: Relation.ListModelRealtionReq) {
  return instance.post<Relation.ListModelRelationResult>({
    url: "model/relation/list",
    data: data
  })
}

export function DeleteModelRelationApi(id: number) {
  return instance.post<number>({
    url: "model/relation/delete",
    data: { id: id }
  })
}

/** 新增资产关联 */
export function CreateResourceRelationApi(data: Relation.createResourceRelation) {
  return instance.post<number>({
    url: "resource/relation/create",
    data: data
  })
}

/** 获取指定资产所关联的所有其他资产信息 */
export function ListRelatedAssetsApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: "resource/relation/pipeline/all",
    data: data
  })
}

export function ListRelatedAssetsSrcApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: "resource/relation/pipeline/src",
    data: data
  })
}

export function ListRelatedAssetsDstApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: "resource/relation/pipeline/dst",
    data: data
  })
}

export function deleteResourceRelationApi(data: Relation.deleteResourceRelationReq) {
  return instance.post<number>({
    url: "resource/relation/delete",
    data: data
  })
}
