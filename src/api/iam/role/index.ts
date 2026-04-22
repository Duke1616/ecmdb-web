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

/** 获取用户关联的角色列表 (管理侧) */
export function listUserRolesApi(data: role.ListUserRolesReq) {
  return instance.post<role.ListRoleRes>({
    url: `${API_SERVICE.IAM}/role/list/attached/user`,
    data
  })
}

/** 批量分配角色给用户 */
export function batchAssignRoleApi(data: role.BatchAssignRoleReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/role/batch_assign`,
    data
  })
}

/** 分析角色的内联策略 */
export function analyzeRoleInlinePoliciesApi(data: role.RoleAnalysisReq) {
  return instance.post<role.RoleAnalysisRes>({
    url: `${API_SERVICE.IAM}/role/analysis/inline`,
    data
  })
}
/** 获取角色的继承父角色列表 */
export function getParentRolesApi(data: role.GetParentRolesReq) {
  return instance.post<role.RoleInheritanceInfo[]>({
    url: `${API_SERVICE.IAM}/role/parents`,
    data
  })
}

/** 为当前角色添加父角色 */
export function addParentRoleApi(data: role.RoleInheritanceReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/role/add_parent`,
    data
  })
}

/** 为当前角色移除父角色 */
export function removeParentRoleApi(data: role.RoleInheritanceReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/role/remove_parent`,
    data
  })
}
