/** EIAM 自身作为 OIDC 客户端（SSO 开关开启时）使用的类型定义 */

/** 当前 Session 状态检查响应（探查 Cookie 是否有效） */
export interface SessionCheckResponse {
  user: {
    id: number
    username: string
    nickname: string
    avatar: string
  }
  current_tenant_id: number
}

/** 接入应用 (OAuth2 / OIDC Client) 实体 */
export interface OAuthClient {
  id: number
  tenant_id: number
  client_id: string
  client_secret?: string
  name: string
  logo?: string
  redirect_uris: string[]
  response_types?: string[]
  grant_types?: string[]
  scopes?: string[]
  is_public: boolean
  auto_consent: boolean
  ctime: string
  utime: string
}

/** 创建接入应用请求 */
export interface CreateOAuthClientReq {
  name: string
  client_id?: string
  logo?: string
  redirect_uris: string[]
  response_types?: string[]
  grant_types?: string[]
  scopes?: string[]
  is_public?: boolean
  auto_consent?: boolean
}

/** 更新接入应用请求 */
export interface UpdateOAuthClientReq {
  id: number
  name: string
  logo?: string
  redirect_uris: string[]
  response_types?: string[]
  grant_types?: string[]
  scopes?: string[]
  is_public?: boolean
  auto_consent?: boolean
}

/** 查询应用列表请求 */
export interface ListOAuthClientReq {
  keyword?: string
  offset: number
  limit: number
}

/** 查询应用列表响应 */
export interface ListOAuthClientResp {
  total: number
  clients: OAuthClient[]
}

/** 重置密钥响应 */
export interface ResetSecretResp {
  client_secret: string
}
