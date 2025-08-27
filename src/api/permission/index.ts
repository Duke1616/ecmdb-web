import type * as permission from "./types/permission"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 更新角色 */
export function getRolePermissionApi(role_code: string) {
  return instance.post<permission.rolePermission>({
    url: `${API_SERVICE.CMDB}/permission/list`,
    data: { role_code: role_code }
  })
}

export function changeRoleMenuPermissionApi(menuIds: number[], roleCode: string) {
  return instance.post<boolean>({
    url: `${API_SERVICE.CMDB}/permission/change`,
    data: { menu_ids: menuIds, role_code: roleCode }
  })
}

export function listUserRolePermissionApi() {
  return instance.post<permission.userRolePermission>({
    url: `${API_SERVICE.CMDB}/permission/get_user_menu`
  })
}
