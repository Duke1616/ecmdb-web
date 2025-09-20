// 告警规则类型定义

// 分页参数
export interface Page {
  offset?: number
  limit?: number
}

// 告警规则组（后端 GroupRule）
export interface GroupRule {
  id: number
  name: string
  description: string
}

// 告警规则列表请求
export interface ListRulesReq extends Page {
  group_id: number
}

// 告警规则响应
export interface RetrieveRules {
  total: number
  rules: Rule[]
}

// 告警规则组响应
export interface RetrieveRuleGroups {
  total: number
  rule_groups: GroupRule[]
}

// 告警规则
export interface Rule {
  id: number
  name: string
  enabled: boolean
  group_id: number
  external_labels: Record<string, string>
  datasource_type: string
  datasource_ids: number[]
  workspace_ids: number[]
  level: number
  eval_interval: number
  description: string
  prom_ql: string
  ctime: number
  utime: number
}

// 创建告警规则请求
export interface CreateRuleReq {
  name: string
  enabled: boolean
  group_id: number
  level: number
  external_labels: Record<string, string>
  datasource_type: string
  datasource_ids: number[]
  workspace_ids: number[]
  eval_interval: number
  description: string
  prom_ql: string
}

// 更新告警规则请求
export interface UpdateRuleReq extends Partial<CreateRuleReq> {
  id: number
}

// 告警规则查询参数
export interface RuleQueryParams {
  page?: number
  page_size?: number
  name?: string
  enabled?: boolean
  group_id?: number
  datasource_type?: string
  level?: number
}

// 告警规则响应（兼容性别名）
export interface RuleListResp extends RetrieveRules {
  page?: number
  page_size?: number
}

// 创建告警规则响应
export interface CreateRuleResp {
  rule: Rule
}

// 告警规则组（兼容性别名）
export interface RuleGroup extends GroupRule {
  ctime?: number
  utime?: number
}

// 创建告警规则组请求
export interface CreateRuleGroupReq {
  name: string
  description: string
}

// 更新告警规则组请求
export interface UpdateRuleGroupReq extends Partial<CreateRuleGroupReq> {
  id: number
}

// 告警规则组查询参数
export interface RuleGroupQueryParams extends Page {
  name?: string
}

// 告警规则组响应（兼容性别名）
export interface RuleGroupListResp extends RetrieveRuleGroups {
  page?: number
  page_size?: number
}

// 创建告警规则组响应
export interface CreateRuleGroupResp {
  group: RuleGroup
}

// 告警级别枚举
export enum AlertLevel {
  EMERGENCY = 1, // 紧急 - 系统不可用（如服务器宕机）
  CRITICAL = 2,  // 严重 - 核心功能故障
  ERROR = 3,     // 错误 - 数据库连接失败等
  WARNING = 4,   // 警告 - 磁盘空间不足等
  INFO = 5       // 提示 - 常规信息（如用户登录）
}

// 告警级别选项
export const ALERT_LEVEL_OPTIONS = [
  { value: AlertLevel.EMERGENCY, label: 'P0 紧急', color: '#F56C6C', description: '系统不可用（如服务器宕机）', priority: 'P0' },
  { value: AlertLevel.CRITICAL, label: 'P1 严重', color: '#F56C6C', description: '核心功能故障', priority: 'P1' },
  { value: AlertLevel.ERROR, label: 'P2 错误', color: '#F56C6C', description: '数据库连接失败等', priority: 'P2' },
  { value: AlertLevel.WARNING, label: 'P3 警告', color: '#E6A23C', description: '磁盘空间不足等', priority: 'P3' },
  { value: AlertLevel.INFO, label: 'P4 提示', color: '#409EFF', description: '常规信息（如用户登录）', priority: 'P4' }
]

// 检测频率选项（秒）
export const EVAL_INTERVAL_OPTIONS = [
  { value: 15, label: '15秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 300, label: '5分钟' },
  { value: 600, label: '10分钟' },
  { value: 1800, label: '30分钟' },
  { value: 3600, label: '1小时' }
]
