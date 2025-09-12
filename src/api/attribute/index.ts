import type * as attribute from "./types/attribute"

import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 获取模型字段列表（包含分组信息） */
export function getModelAttributesWithGroupsApi(modelUid: string) {
  return instance.post<attribute.listAttributesResponseData>({
    url: `${API_SERVICE.CMDB}/attribute/list`,
    data: { model_uid: modelUid }
  })
}

export function CreateAttributeApi(data: attribute.createOrUpdateAttributeReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/attribute/create`,
    data: data
  })
}

export function UpdateAttributeApi(data: attribute.createOrUpdateAttributeReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/attribute/update`,
    data: data
  })
}

export function CustomAttributeFieldColumnsApi(data: attribute.CustomAttributeFieldColumnsReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/attribute/custom/field`,
    data: data
  })
}

export function DeleteAttributeApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/attribute/delete`,
    data: { id: id }
  })
}

export function ListAttributeFieldApi(modelUid: string) {
  return instance.post<attribute.listAttributeFieldData>({
    url: `${API_SERVICE.CMDB}/attribute/list/field`,
    data: { model_uid: modelUid }
  })
}

export function createAttributeGroupApi(data: attribute.CreateAttributeGroupReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/attribute/group/create`,
    data: data
  })
}
