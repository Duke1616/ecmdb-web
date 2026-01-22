/**
 * 数据导入导出相关类型定义
 */

/** 生成预签名上传 URL 请求 */
export interface GenerateUploadURLReq {
  /** 文件名 */
  file_name: string
}

/** 生成预签名上传 URL 响应 */
export interface GenerateUploadURLRes {
  /** S3 文件键 */
  file_key: string
  /** 预签名上传 URL */
  upload_url: string
  /** HTTP 方法 */
  method: string
  /** 过期时间(秒) */
  expires_in: number
}

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

/** 导入数据请求 V2 (直接上传文件) */
export interface ImportV2Req {
  /** 模型 UID */
  model_uid: string
  /** 上传的文件 */
  file: File
}

/** 导出筛选条件 */
export interface ExportFilterCondition {
  /** 字段 UID */
  field_uid: string
  /** 操作符: eq, ne, contains, gt, lt 等 */
  operator: string
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
  resource_ids?: (string | number)[]
  /** 筛选条件组 (scope='all' 或 'current' 时可选) */
  filter_groups?: ExportFilterGroup[]
  /** 导出字段列表 (可选, 默认为全部字段) */
  fields?: string[]
  /** 文件名 (可选, 后端可默认生成) */
  file_name?: string
}
