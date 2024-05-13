import type * as Relation from "./types/relation"

import instance from "@/utils/hy_service"

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
