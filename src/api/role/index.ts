import type * as role from "./types/role"
import instance from "@/utils/hy_service"

/** 角色列表 */
export function listRolesApi(data: role.Page) {
  return instance.post<role.roles>({
    url: "role/list",
    data: data
  })
}

/** 创建角色 */
export function createRoleApi(data: role.createOrUpdateRoleReq) {
  return instance.post<number>({
    url: "role/create",
    data: data
  })
}

/** 更新角色 */
export function updateRoleApi(data: role.createOrUpdateRoleReq) {
  return instance.post<role.role[]>({
    url: "role/update",
    data: data
  })
}

/** 更新角色 */
export function getRolePermissionApi(role_code: string) {
  return instance.post<role.rolePermission>({
    url: "role/permission",
    data: { role_code: role_code }
  })
}

export function addRoleMenuPermissionApi(menuIds: number[], roleCode: string) {
  return instance.post<boolean>({
    url: "role/permission/add",
    data: { menu_ids: menuIds, role_code: roleCode }
  })
}

export function listUserHaveRolesApi(data: role.userBindReq) {
  return instance.post<role.roles>({
    url: "role/user/have",
    data: data
  })
}

export function listUserDoesNotHaveRoles(data: role.userBindReq) {
  return instance.post<role.roles>({
    url: "role/user/does_not_have",
    data: data
  })
}

export function listUserRolePermission(userId: number) {
  return instance.post<role.userRolePermission>({
    url: "role/user/get_permission_menu",
    data: { user_id: userId }
  })
}
