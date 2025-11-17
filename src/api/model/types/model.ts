export interface listModelsReq {}

export interface Models {
  group_id: number
  group_name: string
  models: Model[]
}

export interface Model {
  id: number
  name: string
  uid: string
  total: number
  icon: string
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
  mgs: Models[]
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
