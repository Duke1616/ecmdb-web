/** 权限语句：定义操作、资源、生效条件与业务数据访问范围。 */
export interface Statement {
  effect: "Allow" | "Deny"
  action: string[]
  resource: string[]
  condition?: Condition
  access_scope?: AccessScope
}

/** Condition 支持的比较操作符。 */
export type ConditionOperator =
  | "StringEquals"
  | "StringNotEquals"
  | "StringEqualsIgnoreCase"
  | "StringContains"
  | "ForAnyValue:StringEquals"
  | "ForAllValues:StringNotEquals"
  | "NumericEquals"
  | "NumericLessThan"
  | "NumericGreaterThan"
  | "Bool"
  | "DateLessThan"
  | "DateGreaterThan"
  | "IpAddress"
  | "NotIpAddress"

/** Predicate 的固定值或 EIAM 属性引用。 */
export interface ConditionOperand {
  type: "literal" | "ref"
  value: unknown
}

/** Condition 的叶子判断。 */
export interface ConditionPredicate {
  key: string
  operator: ConditionOperator
  values: ConditionOperand[]
}

/** 有界策略表达式：每个节点只能包含 all、any 或 predicate 之一。 */
export interface PolicyExpression {
  all?: PolicyExpression[]
  any?: PolicyExpression[]
  predicate?: ConditionPredicate
}

/** Condition 仅使用 EIAM 可验证的主体、请求、环境与认证属性。 */
export type Condition = PolicyExpression

/** AccessScope 仅使用需要业务数据源求值的记录属性。 */
export type AccessScope = PolicyExpression

/** 权限策略信息 */
export interface RetriePolicySummaryRes {
  policy: Policy
  services: ServiceSummary[]
}

export interface ServiceSummary {
  service_code: string
  service_name: string
  effect: string
  level: string
  granted_count: number
  total_count: number
  resource_scope: string
  condition: string
  access_scope?: string
  actions: ActionDetail[]
}

/** 权限操作明细 */
export interface ActionDetail {
  action: string // Go 字段 Code 对应的 json:"action"
  name: string
  effect: string
  group: string
  resource: string
  condition: string
  access_scope?: string
}

export interface Policy {
  id: number
  name: string
  code: string
  desc: string
  type: number // 策略类型: 1-系统预设, 2-自定义
  ctime: number // 创建时间
  assignment_count: number // 已关联的授权数量 (主体数)
  statement: Statement[]
}

/** 创建策略请求 */
export interface CreatePolicyRequest {
  name: string
  code: string
  desc: string
  type: number
  statement: Statement[]
}

/** 修改策略请求 */
export interface UpdatePolicyRequest {
  name: string
  code: string
  desc: string
  statement: Statement[]
}

/** 列表查询请求 */
export interface ListPolicyRequest {
  offset: number
  limit: number
  keyword?: string
  type?: number
}

/** 列表查询响应 */
export interface ListPolicyResponse {
  total: number
  policies: Policy[]
}

/** 用户关联策略列表请求 */
export interface ListUserPoliciesReq extends ListPolicyRequest {
  user_id: number
}

/** 角色关联策略列表请求 */
export interface ListRolePoliciesReq extends ListPolicyRequest {
  role_code: string
}

/** 用户组关联策略列表请求 */
export interface ListGroupPoliciesReq {
  group_code: string
  offset: number
  limit: number
  keyword?: string
  type?: number
}

import { AuthorizationSubType } from "@/api/iam/permission/type"

/** 绑定/解绑策略请求 */
export interface AttachPolicyRequest {
  sub_type: AuthorizationSubType
  sub_code: string
  policy_code: string
}

/** 主体项：用于批量绑定 */
export interface SubjectItem {
  /** 主体类型: user、role 或 group */
  type: AuthorizationSubType
  /** 主体标识（用户名或角色代码） */
  code: string
}

/** 批量绑定策略请求 */
export interface BatchAttachPolicyRequest {
  /** 主体列表，可同时包含 user、role 和 group */
  subjects: SubjectItem[]
  /** 策略代码列表 */
  policy_codes: string[]
}

/** 批量绑定策略响应 */
export interface BatchAttachPolicyResponse {
  /** 总处理数量 */
  total: number
  /** 新增绑定数量 */
  inserted: number
  /** 已存在而被忽略的数量 */
  ignored: number
}

/** 授权关联项：用于批量解绑 */
export interface AssignmentItem {
  sub_type: AuthorizationSubType
  sub_code: string
  policy_code: string
}

/** 批量解绑策略请求 */
export interface BatchDetachPolicyRequest {
  assignments: AssignmentItem[]
}

/** 批量删除策略请求 */
export interface BatchDeletePolicyRequest {
  codes: string[]
}
