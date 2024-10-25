export interface LoginRequestData {
  username: string
  password: string
}

export type LoginResponseData = {
  username: string
  access_token: string
  refresh_token: string
}

export type UserInfoResponseData = {
  id: number
  username: string
  roles: string[]
}
