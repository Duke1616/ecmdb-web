import instanceRefersh from "@@/utils/refersh_service"
import { localCache } from "@@/utils/cache"

/** 获取用户详情 */
export function refreshAccessTokenApi() {
  return instanceRefersh
    .requestHader({
      url: "user/refresh",
      method: "post"
    })
    .then((response) => {
      console.log(response.headers["x-access-token"], "x-access-token")
      console.log(response.headers["x-refresh-token"], "x-refresh-token")
      if (response.headers && response.headers["x-access-token"]) {
        localCache.setCache("access_token", response.headers["x-access-token"])
        localCache.setCache("refresh_token", response.headers["x-refresh-token"])
      }

      return response
    })
}
