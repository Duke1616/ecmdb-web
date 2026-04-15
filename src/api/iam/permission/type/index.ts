/** 菜单元数据 */
export interface Meta {
  title: string
  icon: string
  is_hidden: boolean
  is_keepalive: boolean
  is_affix: boolean
  platforms: string[]
}

/** 菜单项 (授权可见) */
export interface Menu {
  id: number
  parent_id: number
  name: string
  path: string
  component: string
  redirect: string
  meta: Meta
  children?: Menu[]
}

/** 功能能力项 (Action) 详情 */
export interface ActionDetail {
  id: number
  service: string
  group: string
  code: string
  name: string
}

/** 功能分组 */
export interface PermissionGroup {
  name: string
  actions: string[]
}

/** 服务权限条目 */
export interface ServicePermissionEntry {
  code: string
  name: string
  entries: PermissionGroup[]
}

/** 权限清单 (归一化后的新结构) */
export interface PermissionManifest {
  actions: ActionDetail[]
  services: ServicePermissionEntry[]
}

/** 授权主体类型枚举 */
export enum AuthorizationSubType {
  USER = "user",
  ROLE = "role"
}

/** 授权目标类型枚举 */
export enum AuthorizationObjType {
  ROLE = "role",
  SYSTEM_POLICY = "system_policy",
  CUSTOM_POLICY = "custom_policy"
}

/** 授权条目查询请求 */
export interface AuthorizationQueryReq {
  offset: number
  limit: number
  keyword?: string
  sub_type?: AuthorizationSubType
  obj_type?: AuthorizationObjType
}

/** 授权关系条目详情 */
export interface Authorization {
  id: number
  subject: string
  target: string
  sub_type: AuthorizationSubType
  obj_type: AuthorizationObjType
  subject_name: string
  target_name: string
  note: string
  scope: string
  ctime: number
}

/** 授权查询响应 */
export interface AuthorizationResp {
  total: number
  authorizations: Authorization[]
}

/** 搜索主体请求 */
export interface SearchSubjectsReq {
  keyword: string
  sub_type: string // user | role
  offset: number
  limit: number
}

/** 搜索主体响应项 */
export interface Subject {
  type: string
  id: string
  name: string
  desc: string
}

/** 搜索主体响应 */
export interface SearchSubjectsResp {
  total: number
  subjects: Subject[]
}
