import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as permission from "./type"

/** 查询当前用户的授权菜单 (用于前端渲染) */
export function getAuthorizedMenusApi() {
  return instance.get<permission.Menu[]>({
    url: `${API_SERVICE.IAM}/permission/menus`
  })
}
