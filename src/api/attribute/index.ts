import type * as attribute from "./types/attribute"

import instance from "@/utils/hy_service"

/** 获取模型字段列表 */
export function listAttributesByModelUidApi(modelUid: string) {
  return instance.post<attribute.listAttributesResponseData>({
    url: "attribute/list",
    data: { model_uid: modelUid }
  })
}

export function CreateAttributeApi(data: attribute.CreateAttributeRequestData) {
  return instance.post<number>({
    url: "attribute/create",
    data: data
  })
}

export function CustomAttributeFieldColumnsApi(data: attribute.CustomAttributeFieldColumnsReq) {
  return instance.post<number>({
    url: "attribute/custom/field",
    data: data
  })
}

export function DeleteAttributeApi(id: number) {
  return instance.post<number>({
    url: "attribute/delete",
    data: { id: id }
  })
}
