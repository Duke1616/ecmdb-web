import type * as menu from "./types/menu"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建菜单 */
export function createMenuApi(data: menu.createOrUpdateMenuReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/menu/create`,
    data: data
  })
}

/** 更新菜单 */
export function updateMenuApi(data: menu.createOrUpdateMenuReq) {
  return instance.post<menu.menu[]>({
    url: `${API_SERVICE.CMDB}/menu/update`,
    data: data
  })
}

/** 删除菜单 */
export function deleteMenuApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/menu/delete`,
    data: { id: id }
  })
}

/** 查看列表树 */
export function listMenuTreeApi() {
  return instance.post<menu.menu[]>({
    url: `${API_SERVICE.CMDB}/menu/list/tree`
  })
}

/** 删除菜单 */
export function listMenusByPlatformApi(platform: string) {
  return instance.post<menu.menu[]>({
    url: `${API_SERVICE.CMDB}/menu/list/tree/by_platform`,
    data: { platform: platform }
  })
}
