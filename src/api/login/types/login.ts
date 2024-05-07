export interface LoginRequestData {
  username: string
  password: string
}

export type LoginResponseData = { token: string }

export type UserInfoResponseData = { username: string; roles: string[] }
