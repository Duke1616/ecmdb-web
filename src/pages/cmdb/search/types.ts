/**
 * 全局搜索模块公用类型定义
 */

/** 租户过滤类型：全部 | 组织 | 个人 */
export type TenantFilterType = "all" | "organization" | "personal"

/** 解析后的表格动态列属性定义 */
export interface IResolvedFieldItem {
  field_uid: string
  field_name: string
  field_type: string
  secure?: boolean
  isMatched?: boolean
}
