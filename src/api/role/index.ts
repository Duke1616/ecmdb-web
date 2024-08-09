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
