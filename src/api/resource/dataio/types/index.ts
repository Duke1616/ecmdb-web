/** 导入数据请求 */
export interface ImportReq {
  /** 模型 UID */
  model_uid: string
  /** S3 文件键 */
  file_key: string
}

/** 导入数据响应 */
export interface ImportRes {
  /** 导入成功的数据条数 */
  imported_count: number
}

/** 导出操作符枚举 */
export enum ExportOperator {
  /** 等于 */
  EQ = "eq",
  /** 不等于 */
  NE = "ne",
  /** 包含 */
  CONTAINS = "contains",
  /** 大于 */
  GT = "gt",
  /** 小于 */
  LT = "lt"
}

/** 导出筛选条件 */
export interface ExportFilterCondition {
  /** 字段 UID */
  field_uid: string
  /** 操作符 */
  operator: ExportOperator
  /** 筛选值 */
  value: string | number | boolean
}

/** 导出筛选条件组 (组内 AND) */
export interface ExportFilterGroup {
  filters: ExportFilterCondition[]
}

/** 导出范围枚举 */
export enum ExportScope {
  /** 全部数据 */
  ALL = "all",
  /** 当前页数据 */
  CURRENT = "current",
  /** 已选数据 */
  SELECTED = "selected"
}

/** 导出数据请求 */
export interface ExportReq {
  /** 模型 UID */
  model_uid: string
  /** 导出范围 */
  scope: ExportScope
  /** 资源 ID 列表 (scope='selected' 时必填) */
  resource_ids?: number[]
  /** 筛选条件组 (scope='all' 或 'current' 时可选) */
  filter_groups?: ExportFilterGroup[]
  /** 导出字段列表 (可选, 默认为全部字段) */
  fields?: string[]
  /** 文件名 (可选, 后端可默认生成) */
  file_name?: string
}
