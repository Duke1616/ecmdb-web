import { ref } from "vue"
import store from "@/store"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"
import { constantRoutes, defaultRoutes } from "@/router"
import { flatMultiLevelRoutes } from "@/router/helper"
import routeSettings from "@/config/route"
import { listUserRolePermissionApi } from "@/api/permission"
import { transformDynamicRoutes } from "@/router/helper"

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([])
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const roles = ref<string[]>([])

  /** 获取路由详情 */
  const getRoleMenu = async (retryCount = 3): Promise<void> => {
    try {
      const response = await listUserRolePermissionApi()

      if (!response || !response.data) {
        throw new Error("无效的菜单数据")
      }

      const { data } = response

      if (!data.menus || data.menus.length === 0) {
        dynamicRoutes.value = defaultRoutes
      } else {
        roles.value = data.role_codes
        dynamicRoutes.value = transformDynamicRoutes(data.menus)
      }
    } catch (error) {
      console.error(`获取菜单失败，重试剩余次数: ${retryCount}`, error)

      // 如果还有重试次数，则继续重试
      if (retryCount > 0) {
        return new Promise(
          (resolve) => setTimeout(() => resolve(getRoleMenu(retryCount - 1)), 100) // 1毫秒后重试
        )
      } else {
        dynamicRoutes.value = defaultRoutes
      }
    }
  }

  /** 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由） */
  const setRoutes = async () => {
    await getRoleMenu()
    _set(dynamicRoutes.value)
  }

  const _set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    dynamicRoutes.value = routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, dynamicRoutes, roles, setRoutes }
})

/** 在 setup 外使用 */
export function usePermissionStoreHook() {
  return usePermissionStore(store)
}
