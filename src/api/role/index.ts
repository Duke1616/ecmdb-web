import type * as role from "./types/role"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 角色列表 */
export function listRolesApi(data: role.Page) {
  return instance.post<role.roles>({
    url: `${API_SERVICE.CMDB}/role/list`,
    data: data
  })
}

/** 创建角色 */
export function createRoleApi(data: role.createOrUpdateRoleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/role/create`,
    data: data
  })
}

/** 更新角色 */
export function updateRoleApi(data: role.createOrUpdateRoleReq) {
  return instance.post<role.role[]>({
    url: `${API_SERVICE.CMDB}/role/update`,
    data: data
  })
}

/** 删除角色 */
export function deleteRoleApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/role/delete`,
    data: { id: id }
  })
}

export function listUserHaveRolesApi(data: role.userBindReq) {
  return instance.post<role.roles>({
    url: `${API_SERVICE.CMDB}/role/user/have`,
    data: data
  })
}

export function listUserDoesNotHaveRoles(data: role.userBindReq) {
  return instance.post<role.roles>({
    url: `${API_SERVICE.CMDB}/role/user/does_not_have`,
    data: data
  })
}
