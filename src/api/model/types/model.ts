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

export type listModelsResponseData = ApiResponseData<{
  mgs: Models[]
}>

export type UserInfoResponseData = { username: string; roles: string[] }
