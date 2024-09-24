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

export interface feishuInfo {
  user_id?: number
}

export interface listUserByUsernameRegexReq {
  username: string
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface listUserByDepartmentReq {
  department_id: number
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface user {
  id: number
  username: string
  title: string
  email: string
  display_name: string
  create_type: number
  role_codes: string[]
  feishu_info: feishuInfo
}

export interface createOrUpdateUserReq {
  id?: number
  department_id?: number
  username: string
  display_name: string
  title?: string
  email?: string
  role_codes?: string[]
  feishu_info: feishuInfo
}

export interface bindRoleCodesReq {
  id: number
  role_codes: string[]
}

export interface userDepartmentCombination {
  id: number
  type: string
  display_name: string
  disabled: boolean
  name: string
  sort: number
  children: userDepartmentCombination[]
}

export interface findByUsernamesReq {
  usernames: string[]
}
