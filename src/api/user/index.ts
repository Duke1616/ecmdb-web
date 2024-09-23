import type * as user from "./types/user"
import instance from "@/utils/hy_service"

/** 查询用户列表 */
export function listUsersApi(data: user.Page) {
  return instance.post<user.users>({
    url: "user/list",
    data: data
  })
}

/** 模糊匹配用户 */
export function listUsersByUsernameRegexApi(data: user.listUserByUsernameRegexReq) {
  return instance.post<user.users>({
    url: "user/find/regex/username",
    data: data
  })
}

/** 查看部门组用户 */
export function listUsersByDepartmentApi(data: user.listUserByDepartmentReq) {
  return instance.post<user.users>({
    url: "user/find/department_id",
    data: data
  })
}

/** 用户绑定角色 */
export function bindRoleCodesAPi(data: user.bindRoleCodesReq) {
  return instance.post<number>({
    url: "user/role/bind",
    data: data
  })
}

/** 获取用户详情 */
export function getUserInfoApi() {
  return instance.post<user.user>({
    url: "user/info"
  })
}

/** 创建用户 */
export function createUserApi(data: user.createOrUpdateUserReq) {
  return instance.post<number>({
    url: "user/create",
    data: data
  })
}

/** 更新用户 */
export function updateUserApi(data: user.createOrUpdateUserReq) {
  return instance.post<user.user[]>({
    url: "user/update",
    data: data
  })
}

/** 根据部门聚合查询 */
export function pipelineUserByDepartmentApi() {
  return instance.post<user.userDepartmentCombination[]>({
    url: "user/pipeline/department_id"
  })
}

/** 查询多个用户详情 */
export function findByUsernamesApi(uns: string[]) {
  return instance.post<user.users>({
    url: "user/find/usernames",
    data: { usernames: uns }
  })
}

/** 查询单个用户详情 */
export function findByUsernameApi(username: string) {
  return instance.post<user.user>({
    url: "user/find/username",
    data: { username: username }
  })
}
