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
  icon: string
}

export interface CreateModelReq {
  name: string
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

export type UserInfoResponseData = { username: string; roles: string[] }
