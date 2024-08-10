import type * as menu from "../../menu/types/menu"

export interface createOrUpdateRoleReq {
  id?: number
  name: string
  desc: string
  code: string
  status: boolean
}

export interface role {
  id: number
  name: string
  desc: string
  code: string
  status: boolean
}

export interface roles {
  roles: role[]
  total: number
}

export interface Page {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface rolePermission {
  authz_ids: number[]
  menus: menu.menu[]
}
