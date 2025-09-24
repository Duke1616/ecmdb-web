import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  CreateTemplateReq,
  CreateTemplateResp,
  UpdateTemplateReq,
  UpdateTemplateResp,
  ListTemplatesReq,
  ListTemplatesResp,
  DeleteTemplateResp,
  GetTemplateDetailResp
} from "./types"

// 创建模板
export const createTemplateApi = (data: CreateTemplateReq) => {
  return instance.post<CreateTemplateResp>({
    url: `${API_SERVICE.ALERT}/template/create`,
    data
  })
}

// 更新模板
export const updateTemplateApi = (data: UpdateTemplateReq) => {
  return instance.put<UpdateTemplateResp>({
    url: `${API_SERVICE.ALERT}/template/update`,
    data
  })
}

// 获取模板列表
export const listTemplatesApi = (data: ListTemplatesReq) => {
  return instance.post<ListTemplatesResp>({
    url: `${API_SERVICE.ALERT}/template/list`,
    data
  })
}

// 获取模板详情
export const getTemplateDetailApi = (id: number) => {
  return instance.get<GetTemplateDetailResp>({
    url: `${API_SERVICE.ALERT}/template/detail/${id}`
  })
}

// 删除模板
export const deleteTemplateApi = (id: number) => {
  return instance.delete<DeleteTemplateResp>({
    url: `${API_SERVICE.ALERT}/template/delete/${id}`
  })
}
