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
  condition?: Condition[]
}

/** 触发条件 */
export interface Condition {
  operator: string
  key: string
  value: any
}

/** 内联策略 */
export interface InlinePolicy {
  name: string
  code: string
  statement: Statement[]
  services?: ServiceSummary[]
}

/** 服务摘要分析 (内联策略版) */
export interface ServiceSummary {
  service_code: string
  service_name: string
  effect: string
  level: string
  granted_count: number
  total_count: number
  resource_scope: string
  condition: string
  actions: ActionDetail[]
}

/** 操作明细 */
export interface ActionDetail {
  action: string
  name: string
  effect: string
  group: string
  resource: string
  condition: string
}

/** 角色信息主体 */
export interface Role {
  id: number
  code: string
  name: string
  desc: string
  type: RoleType
  ctime: number
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

/** 批量分配角色请求 */
export interface BatchAssignRoleReq {
  usernames: string[]
  role_code: string
}

/** 角色策略分析请求 */
export interface RoleAnalysisReq {
  role_code: string
}

/** 角色策略分析响应 */
export interface RoleAnalysisRes {
  inline_policies: InlinePolicy[]
}

/** 角色继承关系请求 (添加/移除父角色) */
export interface RoleInheritanceReq {
  role_code: string
  parent_role_code: string
}

/** 角色继承详情信息 */
export interface RoleInheritanceInfo {
  code: string
  is_direct: boolean // 是否为直接继承 (第一层)
  is_immutable: boolean // 是否不可变 (不允许手动移除)
}

/** 获取父角色列表请求 */
export interface GetParentRolesReq {
  role_code: string
}

/** 角色继承项 (含元数据) */
export interface InheritanceItem extends Role {
  is_direct: boolean
  is_immutable: boolean
}
