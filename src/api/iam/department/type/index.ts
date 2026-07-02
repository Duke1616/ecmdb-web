export interface IDepartment {
  id: number
  parent_id: number
  name: string
  sort: number
  leaders: string[]
  main_leader: string
  ctime: number
  utime: number
}

export interface IDepartmentNode extends IDepartment {
  children?: IDepartmentNode[]
}

export interface ICreateDeptRequest {
  parent_id: number
  name: string
  sort: number
  leaders: string[]
  main_leader: string
}

export interface IUpdateDeptRequest {
  id: number
  parent_id: number
  name: string
  sort: number
  leaders: string[]
  main_leader: string
}

export interface IAssignUsersRequest {
  dept_id: number
  user_ids: number[]
}

export interface IRemoveUsersRequest {
  dept_id: number
  user_ids: number[]
}

export interface IListMembersRequest {
  dept_id: number
  offset: number
  limit: number
  keyword: string
}

export interface IDeptUser {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
}

export interface IListMembersResponse {
  total: number
  members: IDeptUser[]
}
