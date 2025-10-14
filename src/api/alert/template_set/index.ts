import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  CreateTemplateSetReq,
  CreateTemplateSetResp,
  UpdateTemplateSetReq,
  GetTemplateSetReq,
  GetTemplateSetResp,
  DeleteTemplateSetReq,
  ListTemplateSetReq,
  RetrieveTemplateSets,
  ListTemplateSetsByIDsReq,
  CountItemsReq,
  CountItemsResp,
  AddItemReq,
  AddItemResp,
  AddItemsReq,
  ListItemsReq,
  ListItemsResp,
  DeleteItemsReq,
  DeleteAllItemsReq,
  ResolveTemplateReq,
  ResolveTemplateResp
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
export const getTemplateSetApi = (data: GetTemplateSetReq) => {
  return instance.post<GetTemplateSetResp>({
    url: `${API_SERVICE.ALERT}/template/set/get`,
    data
  })
}

// 删除模板集合
export const deleteTemplateSetApi = (data: DeleteTemplateSetReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/delete`,
    data
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

// 统计条目数量
export const countItemsApi = (data: CountItemsReq) => {
  return instance.post<CountItemsResp>({
    url: `${API_SERVICE.ALERT}/template/set/items/count`,
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

// 批量新增条目
export const addItemsApi = (data: AddItemsReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/items/add-batch`,
    data
  })
}

// 列出条目
export const listItemsApi = (data: ListItemsReq) => {
  return instance.post<ListItemsResp>({
    url: `${API_SERVICE.ALERT}/template/set/items/list`,
    data
  })
}

// 删除指定条目
export const deleteItemsApi = (data: DeleteItemsReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/items/delete`,
    data
  })
}

// 清空所有条目
export const deleteAllItemsApi = (data: DeleteAllItemsReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/template/set/items/delete-all`,
    data
  })
}

// 解析模板
export const resolveTemplateApi = (data: ResolveTemplateReq) => {
  return instance.post<ResolveTemplateResp>({
    url: `${API_SERVICE.ALERT}/template/set/resolve`,
    data
  })
}
