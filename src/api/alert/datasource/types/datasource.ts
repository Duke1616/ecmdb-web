/** 数据源类型枚举 */
export enum DatasourceTypeEnum {
  PROMETHEUS = "PROMETHEUS",
  LOKI = "LOKI"
}

/** 数据源基础信息 */
export interface Datasource {
  id: number
  name: string
  enabled: boolean
  type: DatasourceTypeEnum
  description: string
  http: HTTP
  auth: Auth
  created_at?: string
  updated_at?: string
}

/** HTTP 配置 */
export interface HTTP {
  timeout: number
  dial_timeout: number
  tls: TLS
  url: string
  headers: Record<string, string>
}

/** TLS 配置 */
export interface TLS {
  skip_tls_verify: boolean
}

/** 认证配置 */
export interface Auth {
  basic_auth: boolean
  basic_auth_user: string
  basic_auth_password: string
}

/** 数据源类型信息 */
export interface DatasourceType {
  type: DatasourceTypeEnum
  name: string
  description: string
  icon: string
}

/** 查询数据源列表请求 */
export interface ListDatasourceReq {
  name?: string
  type?: DatasourceTypeEnum
  enabled?: boolean
  offset: number
  limit: number
}

/** 数据源列表响应 */
export interface DatasourceData {
  data_sources: Datasource[]
  total: number
}

/** 保存数据源请求 */
export interface SaveDatasourceReq {
  id?: number
  name: string
  enabled: boolean
  type: DatasourceTypeEnum
  description: string
  http: HTTP
  auth: Auth
}

/** 测试数据源连接请求 */
export interface TestDatasourceReq {
  type: DatasourceTypeEnum
  http: HTTP
  auth: Auth
}

/** 测试数据源连接响应 */
export interface TestDatasourceRes {
  success: boolean
  message: string
  latency?: number
  version?: string
}

/** 根据数据源类型获取数据源列表请求 */
export interface ListDataSourceByTypeReq {
  type: DatasourceTypeEnum
}
