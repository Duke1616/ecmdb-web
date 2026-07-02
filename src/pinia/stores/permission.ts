import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"
import { constantRoutes, defaultRoutes } from "@/router"
import { flatMultiLevelRoutes, transformDynamicRoutes } from "@/router/helper"
import { routerConfig } from "@/router/config"
import { getAuthorizedMenusApi } from "@/api/iam/permission"

export const usePermissionStore = defineStore("permission", () => {
  /** 全部可见路由（常驻 + 动态） */
  const routes = ref<RouteRecordRaw[]>([])
  /** 当前用户拥有的动态路由 */
  const dynamicRoutes = ref<RouteRecordRaw[]>([])

  /**
   * 拉取并解析授权菜单
   * @description 失败时回退至 defaultRoutes 以保证基础 UI 可用
   */
  const getRoleMenu = async (): Promise<void> => {
    try {
      const { data: menus } = await getAuthorizedMenusApi()

      if (!menus || menus.length === 0) {
        dynamicRoutes.value = defaultRoutes
      } else {
        dynamicRoutes.value = transformDynamicRoutes(menus)
      }
    } catch (error) {
      console.error("[PermissionStore] 鉴权菜单解析失败:", error)
      dynamicRoutes.value = defaultRoutes
    }
  }

  /**
   * 组装最终路由表
   * @description 包含常驻路由与过滤后的动态路由，并按配置执行层级平铺
   */
  const setRoutes = async () => {
    await getRoleMenu()

    // 1. 合并静态与动态
    const accessedRoutes = constantRoutes.concat(dynamicRoutes.value)

    // 2. 注入全局路由表
    routes.value = accessedRoutes

    // 3. 执行降级处理（可选，通过 config 开启）
    const isFlat = routerConfig.thirdLevelRouteCache
    dynamicRoutes.value = isFlat ? flatMultiLevelRoutes(dynamicRoutes.value) : dynamicRoutes.value
  }

  return {
    routes,
    dynamicRoutes,
    setRoutes
  }
})

/**
 * Setup 外使用的 Hook
 */
export function usePermissionStoreHook() {
  return usePermissionStore(store)
}
