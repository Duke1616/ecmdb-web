export interface listModelsReq {}

export interface ModelGroup {
  group_id: number
  group_name: string
  model_uids: string[]
}

export interface Model {
  id: number
  group_id: number
  name: string
  uid: string
  icon: string
  resource_count: number
  builtin?: boolean
}

export interface CreateModelReq {
  name: string
  icon: string
  group_id?: number
  uid: string
}

export interface CreateModelGroupReq {
  name: string
}

export type listModelsResponseData = {
  total: number
  groups: ModelGroup[]
  models: Model[]
}

export type retrieveModelsListResp = {
  total: number
  models: Model[]
}

export type node = {
  id: string
  text: string
}

export type line = {
  from: string
  to: string
  text: string
}

export type modelGraph = {
  id: string
  nodes: node[]
  lines: line[]
}

export type UserInfoResponseData = { username: string; roles: string[] }
