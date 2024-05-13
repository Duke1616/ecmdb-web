import type * as Login from "./types/login"

import instance from "@/utils/hy_service"

/** 登录并返回 Token */
export function loginApi(data: Login.LoginRequestData) {
  return instance.request<Login.LoginResponseData>({
    url: "user/ldap/login",
    method: "post",
    data
  })
  // .then((response) => {
  //   response.data.token = response.headers["x-refresh-token"]
  //   return response // 返回原始的响应对象
  // })
}

/** 获取用户详情 */
export function getUserInfoApi() {
  return instance.post<Login.UserInfoResponseData>({
    url: "user/info"
  })
}
