export interface endpoint {
  id: number
  path: string
  method: string
  is_audit: boolean
  is_auth: boolean
  is_permission: boolean
  desc: string
  resource: string
}

export interface endpoints {
  endpoints: endpoint[]
  total: number
}

export interface Page {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}
