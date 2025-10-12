/**
 * 消息升级相关API接口
 */

import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  CreateConfigReq,
  CreateConfigResp,
  UpdateConfigReq,
  GetConfigResp,
  ListConfigsReq,
  ListConfigsResp,
  UpdateConfigStatusReq,
  ListEnabledConfigsReq,
  ListEnabledConfigsResp,
  CreateStepReq,
  CreateStepResp,
  UpdateStepReq,
  GetStepResp,
  ListStepsByConfigIDReq,
  ListStepsByConfigIDResp,
  CreateStepTemplateReq,
  CreateStepTemplateResp,
  UpdateStepTemplateReq,
  GetStepTemplateResp,
  ListStepTemplatesReq,
  ListStepTemplatesResp
} from "./types"

// 升级配置管理API
export const createConfigApi = (data: CreateConfigReq) => {
  return instance.post<CreateConfigResp>({
    url: `${API_SERVICE.ALERT}/escalation/config/create`,
    data
  })
}

export const updateConfigApi = (data: UpdateConfigReq) => {
  return instance.put<CreateConfigResp>({
    url: `${API_SERVICE.ALERT}/escalation/config/update`,
    data
  })
}

export const getConfigApi = (id: number) => {
  return instance.get<GetConfigResp>({
    url: `${API_SERVICE.ALERT}/escalation/config/detail/${id}`
  })
}

export const listConfigsApi = (data: ListConfigsReq) => {
  return instance.post<ListConfigsResp>({
    url: `${API_SERVICE.ALERT}/escalation/config/list`,
    data
  })
}

export const deleteConfigApi = (id: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/escalation/config/${id}`
  })
}

export const updateConfigStatusApi = (data: UpdateConfigStatusReq) => {
  return instance.post({
    url: `${API_SERVICE.ALERT}/escalation/config/status`,
    data
  })
}

export const listEnabledConfigsApi = (data: ListEnabledConfigsReq) => {
  return instance.post<ListEnabledConfigsResp>({
    url: `${API_SERVICE.ALERT}/escalation/config/enabled`,
    data
  })
}

// 升级步骤管理API
export const createStepApi = (data: CreateStepReq) => {
  return instance.post<CreateStepResp>({
    url: `${API_SERVICE.ALERT}/escalation/step/create`,
    data
  })
}

export const updateStepApi = (data: UpdateStepReq) => {
  return instance.put<CreateStepResp>({
    url: `${API_SERVICE.ALERT}/escalation/step/update`,
    data
  })
}

export const getStepApi = (id: number) => {
  return instance.get<GetStepResp>({
    url: `${API_SERVICE.ALERT}/escalation/step/detail/${id}`
  })
}

export const listStepsByConfigIDApi = (data: ListStepsByConfigIDReq) => {
  return instance.post<ListStepsByConfigIDResp>({
    url: `${API_SERVICE.ALERT}/escalation/step/list`,
    data
  })
}

export const deleteStepApi = (id: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/escalation/step/${id}`
  })
}

export const deleteStepsByConfigIDApi = (configId: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/escalation/step/config/${configId}`
  })
}

// 升级步骤模板管理API
export const createStepTemplateApi = (data: CreateStepTemplateReq) => {
  return instance.post<CreateStepTemplateResp>({
    url: `${API_SERVICE.ALERT}/escalation/step_template/create`,
    data
  })
}

export const updateStepTemplateApi = (data: UpdateStepTemplateReq) => {
  return instance.put<CreateStepTemplateResp>({
    url: `${API_SERVICE.ALERT}/escalation/step_template/update`,
    data
  })
}

export const getStepTemplateApi = (id: number) => {
  return instance.get<GetStepTemplateResp>({
    url: `${API_SERVICE.ALERT}/escalation/step_template/detail/${id}`
  })
}

export const listStepTemplatesApi = (data: ListStepTemplatesReq) => {
  return instance.post<ListStepTemplatesResp>({
    url: `${API_SERVICE.ALERT}/escalation/step_template/list`,
    data
  })
}

export const deleteStepTemplateApi = (id: number) => {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/escalation/step_template/${id}`
  })
}
