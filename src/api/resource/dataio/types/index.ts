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
