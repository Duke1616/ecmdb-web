import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as dept from "./type"

/**
 * 获取部门树列表
 * @returns 部门树节点数组
 */
export function listDepartmentTreeApi() {
  return instance.get<dept.IDepartmentNode[]>({
    url: `${API_SERVICE.IAM}/department/list`
  })
}

/**
 * 新增部门
 * @param data 新增部门请求实体
 * @returns 新增的部门 ID
 */
export function createDepartmentApi(data: dept.ICreateDeptRequest) {
  return instance.post<number>({
    url: `${API_SERVICE.IAM}/department/create`,
    data
  })
}

/**
 * 修改部门
 * @param data 修改部门请求实体
 * @returns 提示消息
 */
export function updateDepartmentApi(data: dept.IUpdateDeptRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/department/update`,
    data
  })
}

/**
 * 删除部门
 * @param id 部门 ID
 * @returns 提示消息
 */
export function deleteDepartmentApi(id: number) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/department/delete/${id}`
  })
}

/**
 * 获取部门详情
 * @param id 部门 ID
 * @returns 部门详情
 */
export function getDepartmentDetailApi(id: number) {
  return instance.get<dept.IDepartment>({
    url: `${API_SERVICE.IAM}/department/detail/${id}`
  })
}

/**
 * 分配部门成员
 * @param data 分配请求实体
 * @returns 提示消息
 */
export function assignUsersToDeptApi(data: dept.IAssignUsersRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/department/assign`,
    data
  })
}

/**
 * 移除部门成员
 * @param data 移除请求实体
 * @returns 提示消息
 */
export function removeUsersFromDeptApi(data: dept.IRemoveUsersRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/department/remove`,
    data
  })
}

/**
 * 获取部门成员列表
 * @param data 分页及过滤请求实体
 * @returns 部门成员列表响应
 */
export function listDeptMembersApi(data: dept.IListMembersRequest) {
  return instance.post<dept.IListMembersResponse>({
    url: `${API_SERVICE.IAM}/department/members`,
    data
  })
}
