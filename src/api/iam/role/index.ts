import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as role from "./type"

/** 创建角色 */
export function createRoleApi(data: role.CreateRoleReq) {
  return instance.post<role.Role>({
    url: `${API_SERVICE.IAM}/role/create`,
    data
  })
}

/** 获取角色详情 */
export function roleDetailApi(code: string) {
  return instance.get<role.RoleDetail>({
    url: `${API_SERVICE.IAM}/role/detail/${code}`
  })
}

/** 修改角色 */
export function updateRoleApi(data: role.UpdateRoleReq) {
  return instance.post<role.Role>({
    url: `${API_SERVICE.IAM}/role/update`,
    data
  })
}

/** 查询角色列表 */
export function listRolesApi(data: role.ListRoleReq) {
  return instance.post<role.ListRoleRes>({
    url: `${API_SERVICE.IAM}/role/list`,
    data
  })
}

/** 删除角色 */
export function deleteRoleApi(id: number) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/role/delete/${id}`
  })
}
