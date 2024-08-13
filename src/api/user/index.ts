import type * as user from "./types/user"
import instance from "@/utils/hy_service"

/** 查询用户列表 */
export function listUsersApi(data: user.Page) {
  return instance.post<user.users>({
    url: "user/list",
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
