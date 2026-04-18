/** 角色类型枚举 */
export enum RoleType {
  SYSTEM = 1, // 系统预设全局角色
  CUSTOM = 2 // 租户私有自定义角色
}

/** 策略语句 */
export interface Statement {
  effect: string
  action: string[]
  resource: string[]
}

/** 内联策略 */
export interface InlinePolicy {
  name: string
  code: string
  statement: Statement[]
}

/** 角色信息主体 */
export interface Role {
  id: number
  code: string
  name: string
  desc: string
  type: RoleType
  inline_policies: InlinePolicy[]
}

/** 创建角色请求 */
export interface CreateRoleReq {
  name: string
  code: string
  desc?: string
}

/** 更新角色请求 */
export interface UpdateRoleReq {
  id: number
  name: string
  code: string
  desc?: string
}

/** 角色列表请求 */
export interface ListRoleReq {
  offset: number
  limit: number
  keyword?: string
  type?: number
}

/** 用户关联角色列表请求 */
export interface ListUserRolesReq extends ListRoleReq {
  user_id: number
}

/** 角色列表响应 */
export interface ListRoleRes {
  total: number
  roles: Role[]
}

/** 角色详情 (Alias for Role) */
export type RoleDetail = Role
