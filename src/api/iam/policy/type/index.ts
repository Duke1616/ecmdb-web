/** 权限语句：定义 Action, Resource 和 Condition */
export interface Statement {
  effect: "Allow" | "Deny"
  action: string[]
  resource: string[]
  condition?: Condition[]
}

/** 策略触发条件：基于 Operator 的结构化判定 */
export interface Condition {
  operator: string // 匹配操作符：StringEquals, NumericGreater 等
  key: string // 匹配关键字：iam:UserId, sdk:ClientIp 等
  value: any // 匹配目标值：可以是单个值或数组
}

/** 权限策略信息 */
export interface Policy {
  id: number
  name: string
  code: string
  desc: string
  type: number // 策略类型: 1-系统预设, 2-自定义
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
}

/** 列表查询响应 */
export interface ListPolicyResponse {
  total: number
  policies: Policy[]
}

/** 绑定/解绑策略请求 */
export interface AttachPolicyRequest {
  role_code: string
  poly_code: string
}

/** 主体项：用于批量绑定 */
export interface SubjectItem {
  /** 主体类型: user 或 role */
  type: string
  /** 主体标识（用户名或角色代码） */
  code: string
}

/** 批量绑定策略请求 */
export interface BatchAttachPolicyRequest {
  /** 主体列表，可同时包含 user 和 role */
  subjects: SubjectItem[]
  /** 策略代码列表 */
  policy_codes: string[]
}

/** 批量绑定策略响应 */
export interface BatchAttachPolicyResponse {
  /** 总绑定数量 */
  total: number
}
