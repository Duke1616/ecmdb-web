import type * as menu from "./types/menu"
import instance from "@/utils/hy_service"

/** 创建菜单 */
export function createMenuApi(data: menu.createOrUpdateMenuReq) {
  return instance.post<number>({
    url: "menu/create",
    data: data
  })
}

/** 更新菜单 */
export function updateMenuApi(data: menu.createOrUpdateMenuReq) {
  return instance.post<menu.menu[]>({
    url: "menu/update",
    data: data
  })
}

/** 删除菜单 */
export function deleteMenuApi(id: number) {
  return instance.post<number>({
    url: "menu/delete",
    data: { id: id }
  })
}

/** 查看列表树 */
export function listMenuTreeApi() {
  return instance.post<menu.menu[]>({
    url: "menu/list/tree"
  })
}
