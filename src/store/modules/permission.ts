import { ref } from "vue"
import store from "@/store"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"
import { constantRoutes } from "@/router"
import { flatMultiLevelRoutes } from "@/router/helper"
import routeSettings from "@/config/route"
import { listUserRolePermissionApi } from "@/api/permission"
import { transformDynamicRoutes } from "@/router/helper"

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([])
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const roles = ref<string[]>([])

  /** 获取路由详情 */
  const getRoleMenu = async (userId: number) => {
    // 获取角色拥有的菜单
    const { data } = await listUserRolePermissionApi(userId)

    roles.value = data.role_codes
    // 转换动态路由
    dynamicRoutes.value = transformDynamicRoutes(data.menus?.length ? data.menus : [])
  }

  /** 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由） */
  const setRoutes = async (userId: number) => {
    await getRoleMenu(userId)
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
