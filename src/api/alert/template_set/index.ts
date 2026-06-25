import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  CreateTemplateSetReq,
  CreateTemplateSetResp,
  UpdateTemplateSetReq,
  GetTemplateSetResp,
  ListTemplateSetReq,
  RetrieveTemplateSets,
  ListTemplateSetsByIDsReq,
  AddItemReq,
  AddItemResp,
  ClearTemplatesReq
} from "./types"

// 创建模板集合
export const createTemplateSetApi = (data: CreateTemplateSetReq) => {
  return instance.post<CreateTemplateSetResp>({
    url: `${API_SERVICE.ALERT}/template/set/create`,
    data
  })
}

// 更新模板集合
export const updateTemplateSetApi = (data: UpdateTemplateSetReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/update`,
    data
  })
}

// 获取模板集合
export const getTemplateSetApi = (id: number) => {
  return instance.get<GetTemplateSetResp>({
    url: `${API_SERVICE.ALERT}/template/set/detail/${id}`
  })
}

export function deleteTemplateSetApi(id: number) {
  return instance.delete<void>({
    url: `${API_SERVICE.ALERT}/template/set/delete/${id}`
  })
}

// 列表模板集合
export const listTemplateSetsApi = (data: ListTemplateSetReq) => {
  return instance.post<RetrieveTemplateSets>({
    url: `${API_SERVICE.ALERT}/template/set/list`,
    data
  })
}

// 根据ID列表获取模板集合
export const listTemplateSetsByIDsApi = (data: ListTemplateSetsByIDsReq) => {
  return instance.post<RetrieveTemplateSets>({
    url: `${API_SERVICE.ALERT}/template/set/list/by_ids`,
    data
  })
}

// 新增条目
export const addItemApi = (data: AddItemReq) => {
  return instance.post<AddItemResp>({
    url: `${API_SERVICE.ALERT}/template/set/items/add`,
    data
  })
}

// 清空模板。channel 为空时清空全部渠道
export const clearTemplatesApi = (data: ClearTemplatesReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/clear`,
    data
  })
}
