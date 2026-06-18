import type * as Relation from "./types/relation"

import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增关联类型 */
export function CreateRelationTypeApi(data: Relation.CreateRealtionTypeReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/relation/create`,
    data: data
  })
}

/** 获取关联类型 */
export function ListRelationTypeApi(data: Relation.ListRelationTypeReq) {
  return instance
    .post<Relation.ListRelationTypeResult>({
      url: `${API_SERVICE.CMDB}/relation/list`,
      data: data
    })
    .then((response) => {
      console.log(response)
      return response
    })
}

/** 更新关联类型 */
export function UpdateRelationTypeApi(data: Relation.UpdateRelationTypeReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/relation/update`,
    data: data
  })
}

/** 删除关联类型 */
export function DeleteRelationTypeApi(data: Relation.DeleteRelationTypeReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/relation/delete`,
    data: data
  })
}

/** 新增模型关联 */
export function CreateModelRelationApi(data: Relation.CreateModelRelationReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/relation/create`,
    data: data
  })
}

/** 获取模型关联 */
export function ListModelRelationApi(data: Relation.ListModelRealtionReq) {
  return instance.post<Relation.ListModelRelationResult>({
    url: `${API_SERVICE.CMDB}/model/relation/list`,
    data: data
  })
}

/** 更新模型关联 */
export function UpdateModelRelationApi(data: Relation.UpdateModelRelationReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/relation/update`,
    data: data
  })
}

export function DeleteModelRelationApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/relation/delete`,
    data: { id: id }
  })
}

/** 新增资产关联 */
export function CreateResourceRelationApi(data: Relation.createResourceRelation) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/resource/relation/create`,
    data: data
  })
}

/** 获取指定资产所关联的所有其他资产信息 */
export function ListRelatedAssetsApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: `${API_SERVICE.CMDB}/resource/relation/pipeline/all`,
    data: data
  })
}

export function ListRelatedAssetsSrcApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: `${API_SERVICE.CMDB}/resource/relation/pipeline/src`,
    data: data
  })
}

export function ListRelatedAssetsDstApi(data: Relation.listRelatedAssetsReq) {
  return instance.post<Relation.relatedAssetsData[]>({
    url: `${API_SERVICE.CMDB}/resource/relation/pipeline/dst`,
    data: data
  })
}

export function deleteResourceRelationApi(data: Relation.deleteResourceRelationReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/resource/relation/delete`,
    data: data
  })
}
