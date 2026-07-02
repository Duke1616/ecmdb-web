export interface CreateGroupRequest {
  name: string
  code: string
  desc?: string
}

export interface UpdateGroupRequest {
  id: number
  name?: string
  desc?: string
}

export interface ListGroupRequest {
  offset: number
  limit: number
  keyword?: string
}

export interface ListUserGroupsRequest extends ListGroupRequest {
  user_id?: number
  username?: string
}

export interface ListRoleGroupsRequest extends ListGroupRequest {
  role_code: string
}

export interface AssignMembersRequest {
  group_code: string
  usernames: string[]
}

export interface RemoveMembersRequest {
  group_code: string
  usernames: string[]
}

export interface ListMembersRequest {
  group_code: string
  offset: number
  limit: number
  keyword?: string
}

export interface AssignRoleRequest {
  group_code: string
  role_code: string
}

export interface RemoveRoleRequest {
  group_code: string
  role_code: string
}

export interface Group {
  id: number
  name: string
  code: string
  desc: string
  ctime: number
  utime: number
}

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  job_title?: string
  status?: string
  ctime?: number
  utime?: number
}

export interface ListGroupsResponse {
  total: number
  groups: Group[]
}

export interface ListMembersResponse {
  total: number
  members: User[]
}

export interface Role {
  id: number
  name: string
  code: string
  desc: string
}

export type GroupUser = User

export type GroupRole = Role
