import type * as menu from "../../menu/types/menu"

export interface userRolePermission {
  menus: menu.menu[]
}

export interface rolePermission {
  authz_ids: number[]
  menus: menu.menu[]
}
