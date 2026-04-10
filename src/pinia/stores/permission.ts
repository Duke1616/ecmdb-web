import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"
import { constantRoutes, defaultRoutes } from "@/router"
import { flatMultiLevelRoutes } from "@/router/helper"
import { routerConfig } from "@/router/config"
import { getAuthorizedMenusApi } from "@/api/iam/permission"
import { transformDynamicRoutes } from "@/router/helper"

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([])
  const dynamicRoutes = ref<RouteRecordRaw[]>([])

  /** 获取路由详情 */
  const getRoleMenu = async (): Promise<void> => {
    try {
      const response = await getAuthorizedMenusApi()

      if (!response || !response.data) {
        throw new Error("无效的菜单数据")
      }

      const { data: menus } = response

      if (!menus || menus.length === 0) {
        dynamicRoutes.value = defaultRoutes
      } else {
        dynamicRoutes.value = transformDynamicRoutes(menus)
      }
    } catch (error) {
      console.error("获取菜单失败", error)
      // 当获取菜单失败时，使用默认路由，不抛出错误
      dynamicRoutes.value = defaultRoutes
      // 不抛出错误，让流程继续
    }
  }

  /** 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由） */
  const setRoutes = async () => {
    await getRoleMenu()
    _set(dynamicRoutes.value)
  }

  const _set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    dynamicRoutes.value = routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, dynamicRoutes, setRoutes }
})

/** 在 setup 外使用 */
export function usePermissionStoreHook() {
  return usePermissionStore(store)
}
