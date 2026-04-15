import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as permission from "./type"

/** 查询当前用户的授权菜单 (用于前端渲染) */
export function getAuthorizedMenusApi() {
  return instance.get<permission.Menu[]>({
    url: `${API_SERVICE.IAM}/permission/menus`
  })
}

/** 获取全量权限资产清单 (Manifest) */
export function getPermissionManifestApi() {
  return instance.get<permission.PermissionManifest>({
    url: `${API_SERVICE.IAM}/permission/manifest`
  })
}

/** 获取全量授权关系列表 (Admin) */
export function listAuthorizationsApi(data: permission.AuthorizationQueryReq) {
  return instance.post<permission.AuthorizationResp>({
    url: `${API_SERVICE.IAM}/permission/authorizations`,
    data
  })
}

/** 搜索授权主体 (用户/角色) */
export function searchSubjectsApi(data: permission.SearchSubjectsReq) {
  return instance.post<permission.SearchSubjectsResp>({
    url: `${API_SERVICE.IAM}/permission/subjects/search`,
    data
  })
}
