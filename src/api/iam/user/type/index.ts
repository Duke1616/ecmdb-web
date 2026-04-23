/** 用户基本信息 */
export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  job_title: string
  phone: string
  source: string
  ctime: number
  is_member?: boolean
  is_system_space?: boolean
  utime: number
  last_login_at: number
  console_login: boolean
  mfa_bound: boolean
  identities: Identity[]
}

/** 身份认证信息 */
export interface Identity {
  provider: string
  ldap_info?: LdapInfo
  wechat_info?: WechatInfo
  feishu_info?: FeishuInfo
}

/** LDAP 详细信息 */
export interface LdapInfo {
  dn: string
}

/** 微信 详细信息 */
export interface WechatInfo {
  user_id: string
}

/** 飞书 详细信息 */
export interface FeishuInfo {
  open_id: string
  user_id: string
}

/** 租户/空间信息 */
export interface Tenant {
  id: number
  name: string
  code: string
  domain: string
}

/** 注册请求 */
export interface SignupRequest {
  username: string
  password: string
  confirm_password: string
  email: string
  nickname: string
  avatar: string
  job_title: string
}

/** LDAP 登录请求 */
export interface LoginLdapRequest {
  username: string
  password: string
}

/** 系统登录请求 */
export interface LoginSystemRequest {
  username: string
  password: string
}

/** 用户列表数据 */
export interface UserListData {
  total: number
  users: User[]
}

/** 用户详情数据 */
export interface UserData {
  user: User
  tenants: Tenant[]
}

/** 更新用户请求 */
export interface UpdateUserReq {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  job_title: string
}

/** 修改密码请求 */
export interface UpdatePasswordRequest {
  old_password: string
  new_password: string
  confirm_password: string
}

/** 用户列表请求 */
export interface ListUserRequest {
  offset: number
  limit: number
  keyword?: string
}

/** 角色关联用户列表请求 */
export interface ListRoleUsersReq extends ListUserRequest {
  role_code: string
}

/** 搜索 LDAP 用户请求 */
export interface SearchLdapUserReq {
  keywords: string
  offset: number
  limit: number
}

/** LDAP 列表用户信息 */
export interface LdapSyncUser extends User {
  is_synced: boolean
}

/** 同步 LDAP 用户请求 */
export interface SyncLdapUserReq {
  users: LdapSyncUser[]
}

/** LDAP 用户列表响应 */
export interface LdapUserListData {
  total: number
  users: LdapSyncUser[]
}

/** 绑定身份请求 */
export interface BindIdentityRequest {
  user_id: number
  provider: string
  ldap_info?: LdapInfo
  wechat_info?: WechatInfo
  feishu_info?: FeishuInfo
}

/** 解绑身份请求 */
export interface UnbindIdentityRequest {
  user_id: number
  provider: string
}

/** 批量治理身份请求 */
export interface ManageIdentitiesRequest {
  user_id: number
  ldap_info?: LdapInfo
  wechat_info?: WechatInfo
  feishu_info?: FeishuInfo
}
