/**
 * Explore 模块类型定义
 * 包含查询范围和查询历史相关的类型
 */

// ============= Query Range 相关类型 =============

export type TimeUnix = number

export interface QueryRange {
  datasource_id: number
  query: string
  start_time: TimeUnix
  end_time: TimeUnix
  step: number
}

export interface RetrieveResult {
  metrics: Metric[]
}

export interface Metric {
  labels: Record<string, string>
  points: Point[]
}

export interface Point {
  timestamp: number
  value: number
}

// ============= Query History 相关类型 =============

/**
 * 时间范围
 */
export interface TimeRange {
  start: number // 开始时间(毫秒)
  end: number // 结束时间(毫秒)
}

/**
 * 添加查询历史请求
 */
export interface AddQueryHistoryReq {
  query: string // 查询语句
  datasource_id: number // 数据源 ID
  time_range: TimeRange // 时间范围
}

/**
 * 获取查询历史列表请求
 */
export interface ListQueryHistoryReq {
  limit?: number // 限制返回条数，默认 50
}

/**
 * 删除查询历史请求
 */
export interface DeleteQueryHistoryReq {
  timestamp: number // 记录时间戳
}

/**
 * 查询历史记录项
 */
export interface QueryHistoryItem {
  query: string // 查询语句
  datasource_id: number // 数据源 ID
  time_range: TimeRange // 时间范围
  timestamp: number // 记录时间戳(毫秒)
}

/**
 * 获取查询历史列表响应
 */
export interface ListQueryHistoryResp {
  items: QueryHistoryItem[] // 历史记录列表
}
