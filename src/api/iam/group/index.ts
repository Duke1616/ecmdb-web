import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as group from "./type"

/** 创建用户组 */
export function createGroupApi(data: group.CreateGroupRequest) {
  return instance.post<number>({
    url: `${API_SERVICE.IAM}/group/create`,
    data
  })
}

/** 更新用户组信息 */
export function updateGroupApi(data: group.UpdateGroupRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/group/update`,
    data
  })
}

/** 删除用户组 */
export function deleteGroupApi(id: number | string) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/group/delete/${id}`
  })
}

/** 获取用户组列表 */
export function listGroupsApi(data: group.ListGroupRequest) {
  return instance.post<group.ListGroupsResponse>({
    url: `${API_SERVICE.IAM}/group/list`,
    data
  })
}

/** 获取用户所属用户组列表 */
export function listUserGroupsApi(data: group.ListUserGroupsRequest) {
  return instance.post<group.ListGroupsResponse>({
    url: `${API_SERVICE.IAM}/group/list/attached/user`,
    data
  })
}

/** 获取绑定指定角色的用户组列表 */
export function listRoleGroupsApi(data: group.ListRoleGroupsRequest) {
  return instance.post<group.ListGroupsResponse>({
    url: `${API_SERVICE.IAM}/group/list/attached/role`,
    data
  })
}

/** 获取用户组详情 */
export function groupDetailApi(code: string) {
  return instance.get<group.Group>({
    url: `${API_SERVICE.IAM}/group/detail/${code}`
  })
}

/** 分配组成员 */
export function assignGroupMembersApi(data: group.AssignMembersRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/group/members/assign`,
    data
  })
}

/** 移除组成员 */
export function removeGroupMembersApi(data: group.RemoveMembersRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/group/members/remove`,
    data
  })
}

/** 获取组成员列表 */
export function listGroupMembersApi(data: group.ListMembersRequest) {
  return instance.post<group.ListMembersResponse>({
    url: `${API_SERVICE.IAM}/group/members`,
    data
  })
}

/** 用户组分配角色 */
export function assignGroupRoleApi(data: group.AssignRoleRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/group/role/assign`,
    data
  })
}

/** 用户组解绑角色 */
export function removeGroupRoleApi(data: group.RemoveRoleRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/group/role/remove`,
    data
  })
}

/** 查看用户组角色 */
export function listGroupRolesApi(code: string) {
  return instance.get<group.Role[]>({
    url: `${API_SERVICE.IAM}/group/roles/${code}`
  })
}
