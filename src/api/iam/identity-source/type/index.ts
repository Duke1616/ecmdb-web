/** 身份源类型枚举 */
export enum IdentitySourceType {
  LDAP = "ldap",
  OIDC = "oidc",
  LOCAL = "local",
  PASSKEY = "passkey"
}

/** OIDC 提供商类型枚举 */
export enum OIDCProviderType {
  GENERIC = "generic",
  FEISHU = "feishu",
  WECHAT = "wechat"
}

/** 属性映射配置 */
export interface MappingVO {
  username: string
  email: string
}

/** OIDC 配置视图对象 */
export interface OIDCVO {
  issuer: string
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  user_info_url: string
  user_id_field: string
  provider_type: OIDCProviderType
  auth_url?: string
  token_url?: string
  jit_enabled: boolean // 是否允许即时开户
  mapping: MappingVO
}

export interface LocalVO {
  min_length: number
  require_digit: boolean
  require_upper: boolean
  require_lower: boolean
  require_symbol: boolean
  max_failed_attempts: number
  lockout_duration: number
}

export interface PasskeyVO {
  rp_id: string
  rp_name: string
  rp_origins: string[]
  attestation_preference: string
  user_verification: string
}

/** LDAP 配置视图对象 */
export interface LDAPVO {
  url: string
  base_dn: string
  bind_dn: string
  bind_password?: string

  // 属性映射
  username_attribute: string
  mail_attribute: string
  display_name_attribute: string
  title_attribute: string

  // 过滤条件
  user_filter: string
  sync_user_filter: string
}

/** 身份源响应视图对象 */
export interface IdentitySourceVO {
  id: number | string
  name: string
  type: IdentitySourceType
  enabled: boolean
  ctime: number
  utime: number

  // 根据 Type 返回对应的配置
  ldap?: LDAPVO
  oidc?: OIDCVO
  local?: LocalVO
  passkey?: PasskeyVO
}

/** 保存身份源请求 */
export interface SaveIdentitySourceReq {
  id?: number | string
  name: string
  type: IdentitySourceType
  enabled: boolean

  // 配置项
  ldap?: LDAPVO
  oidc?: OIDCVO
  local?: LocalVO
  passkey?: PasskeyVO
}

/** 身份源列表响应数据 */
export type IdentitySourceListData = IdentitySourceVO[]
