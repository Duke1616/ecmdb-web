export interface LoginRequestData {
  username: string
  password: string
}

export type LoginResponseData = ApiResponseData<{
  access_token: string
  refresh_token: string
}>
