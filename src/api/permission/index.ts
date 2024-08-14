import type * as permission from "./types/permission"
import instance from "@/utils/hy_service"

/** 更新角色 */
export function getRolePermissionApi(role_code: string) {
  return instance.post<permission.rolePermission>({
    url: "permission/list",
    data: { role_code: role_code }
  })
}

export function addRoleMenuPermissionApi(menuIds: number[], roleCode: string) {
  return instance.post<boolean>({
    url: "permission/add",
    data: { menu_ids: menuIds, role_code: roleCode }
  })
}

export function listUserRolePermissionApi(userId: number) {
  return instance.post<permission.userRolePermission>({
    url: "permission/get_user_menu",
    data: { user_id: userId }
  })
}
