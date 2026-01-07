/**
 * 查询历史记录相关类型定义
 */

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
