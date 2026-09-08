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

/** 接入应用 (Application / OIDC & CAS Client) 实体 */
export interface Application {
  id: number
  tenant_id: number
  protocol?: "oidc" | "cas" | "saml"
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
export type OAuthClient = Application

/** 创建接入应用请求 */
export interface CreateApplicationReq {
  name: string
  protocol?: string
  client_id?: string
  logo?: string
  redirect_uris: string[]
  response_types?: string[]
  grant_types?: string[]
  scopes?: string[]
  is_public?: boolean
  auto_consent?: boolean
}
export type CreateOAuthClientReq = CreateApplicationReq

/** 更新接入应用请求 */
export interface UpdateApplicationReq {
  id: number
  name: string
  protocol?: string
  logo?: string
  redirect_uris: string[]
  response_types?: string[]
  grant_types?: string[]
  scopes?: string[]
  is_public?: boolean
  auto_consent?: boolean
}
export type UpdateOAuthClientReq = UpdateApplicationReq

/** 查询应用列表请求 */
export interface ListApplicationReq {
  keyword?: string
  offset: number
  limit: number
}
export type ListOAuthClientReq = ListApplicationReq

/** 查询应用列表响应 */
export interface ListApplicationResp {
  total: number
  applications?: Application[]
  clients: Application[] // 兼顾新旧响应字段
}
export type ListOAuthClientResp = ListApplicationResp

/** 重置密钥响应 */
export interface ResetSecretResp {
  client_secret: string
}

/** 待确认授权信息详情 */
export interface ConsentInfo {
  consent_id: string
  protocol?: "oidc" | "cas" | "saml"
  client_id: string
  client_name: string
  client_logo: string
  user_id: number
  username: string
  tenant_id: number
  redirect_uri: string
  scopes: string[]
  scope_descriptions: string[]
  state: string
  nonce: string
  code_challenge?: string
  code_challenge_method?: string
  created_at: number
}

/** SAML 2.0 IdP 描述符与公钥证书信息 */
export interface SamlDescriptorResp {
  entity_id: string
  sso_url: string
  metadata_url: string
  certificate_url: string
  certificate_pem: string
  certificate_fingerprint?: string
  certificate_subject?: string
  not_before?: string
  not_after?: string
  binding_types?: string[]
  name_id_format?: string
}
