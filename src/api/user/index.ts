import type * as user from "./types/user"
import instance from "@/utils/hy_service"

/** 根据模版列表 */
export function listUsersApi(data: user.Page) {
  return instance.post<user.users>({
    url: "user/list",
    data: data
  })
}
