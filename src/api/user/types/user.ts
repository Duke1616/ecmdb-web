export interface Page {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface users {
  total: number
  users: user[]
}

export interface user {
  id: number
  username: string
  title: string
  email: string
  display_name: string
  create_type: number
  role_codes: string[]
}

export interface bindRoleCodesReq {
  id: number
  role_codes: string[]
}
