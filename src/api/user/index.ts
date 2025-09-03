import type * as user from "./types/user"
import type * as ldap from "./types/ldap"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 查询用户列表 */
export function listUsersApi(data: user.Page) {
  return instance.post<user.users>({
    url: `${API_SERVICE.CMDB}/user/list`,
    data: data
  })
}

/** 模糊匹配用户 */
export function listUsersByKeywordApi(data: user.listUserByKeywordReq) {
  return instance.post<user.users>({
    url: `${API_SERVICE.CMDB}/user/find/by_keyword`,
    data: data
  })
}

/** 查看部门组用户 */
export function listUsersByDepartmentApi(data: user.listUserByDepartmentReq) {
  return instance.post<user.users>({
    url: `${API_SERVICE.CMDB}/user/find/department_id`,
    data: data
  })
}

/** 用户绑定角色 */
export function bindRoleCodesAPi(data: user.bindRoleCodesReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/user/role/bind`,
    data: data
  })
}

/** 获取用户详情 */
export function getUserInfoApi() {
  return instance.post<user.user>({
    url: `${API_SERVICE.CMDB}/user/info`
  })
}

/** 创建用户 */
export function createUserApi(data: user.createOrUpdateUserReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/user/create`,
    data: data
  })
}

/** 更新用户 */
export function updateUserApi(data: user.createOrUpdateUserReq) {
  return instance.post<user.user[]>({
    url: `${API_SERVICE.CMDB}/user/update`,
    data: data
  })
}

/** 根据部门聚合查询 */
export function pipelineUserByDepartmentApi() {
  return instance.post<user.userDepartmentCombination[]>({
    url: `${API_SERVICE.CMDB}/user/pipeline/department_id`
  })
}

/** 查询多个用户详情 */
export function findByUsernamesApi(uns: string[]) {
  return instance.post<user.users>({
    url: `${API_SERVICE.CMDB}/user/find/usernames`,
    data: { usernames: uns }
  })
}

/** 查询多个用户详情 */
export function findByIdsApi(ids: number[]) {
  return instance.post<user.users>({
    url: `${API_SERVICE.CMDB}/user/find/by_ids`,
    data: { ids: ids }
  })
}

/** 查询单个用户详情 */
export function findByUsernameApi(username: string) {
  return instance.post<user.user>({
    url: `${API_SERVICE.CMDB}/user/find/username`,
    data: { username: username }
  })
}

/** 查询单个用户详情 */
export function findByUserIdApi(id: number) {
  return instance.post<user.user>({
    url: `${API_SERVICE.CMDB}/user/find/id`,
    data: { id: id }
  })
}
/** 查询Ldap用户 */
export function searchLdapUserApi(data: user.serachLdapUserReq) {
  return instance.post<ldap.users>({
    url: `${API_SERVICE.CMDB}/user/ldap/search`,
    data: data
  })
}

/** 刷新 Cache 缓存 */
export function refreshCacheLdapApi() {
  return instance.post<string>({
    url: `${API_SERVICE.CMDB}/user/ldap/refresh_cache`
  })
}

/** 同步 LDAP 用户 */
export function syncLdapUserApi(data: user.createOrUpdateUserReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/user/ldap/sync`,
    data: data
  })
}
