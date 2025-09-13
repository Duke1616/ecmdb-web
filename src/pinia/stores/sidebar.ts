import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"

export const useSidebarStore = defineStore("sidebar", () => {
  const currentPlatform = ref<string>("")
  const filteredRoutes = ref<RouteRecordRaw[]>([])
  // 标记是否来自 navigation 页面跳转
  const isFromNavigation = ref<boolean>(false)

  /** 检查路由是否属于指定平台 */
  const hasPlatformNavigation = (platform: string, route: RouteRecordRaw): boolean => {
    const routePlatforms = route.meta?.platforms
    if (!routePlatforms || routePlatforms.length === 0) {
      return true // 没有平台限制的路由始终显示
    }
    if (!platform) {
      return true // 没有指定平台时显示所有路由
    }
    return routePlatforms.includes(platform)
  }

  /** 过滤平台路由并扁平化显示 */
  const filterPlatformRoutes = (routes: RouteRecordRaw[], platform: string): RouteRecordRaw[] => {
    const res: RouteRecordRaw[] = []

    routes.forEach((route) => {
      if (!hasPlatformNavigation(platform, route)) return

      // 没有子路由，直接添加
      if (!route.children?.length) {
        res.push(route)
        return
      }

      // 递归过滤子路由
      const filteredChildren = filterPlatformRoutes(route.children, platform)
      if (!filteredChildren.length) return

      // 如果是 navigation 页面（platform 为空）或者不是来自 navigation 跳转，不进行扁平化
      if (!platform || !isFromNavigation.value) {
        res.push({ ...route, children: filteredChildren })
        return
      }

      // 判断是否为平台目录（需要扁平化）
      const isPlatformRoot = route.meta?.platforms?.includes(platform)

      if (isPlatformRoot) {
        // 平台目录：扁平化子路由
        const visibleChildren = filteredChildren
          .filter((child) => !child.meta?.hidden)
          .map((child) => {
            // 如果子路由路径已经是绝对路径，直接使用
            if (child.path.startsWith("/")) {
              return child
            }
            // 否则拼接父路由路径
            const parentPath = route.path.endsWith("/") ? route.path.slice(0, -1) : route.path
            return {
              ...child,
              path: `${parentPath}/${child.path}`
            }
          })
        res.push(...visibleChildren)
      } else {
        // 普通目录：保留结构
        res.push({ ...route, children: filteredChildren })
      }
    })

    return res
  }

  /** 设置平台过滤 */
  const setPlatformFilter = (platform: string, allRoutes: RouteRecordRaw[], fromNavigation: boolean = false): void => {
    currentPlatform.value = platform
    // 只有在 fromNavigation 为 true 时才更新 isFromNavigation，避免被后续调用重置
    if (fromNavigation) {
      isFromNavigation.value = true
    }
    const noHiddenRoutes = allRoutes.filter((item) => !item.meta?.hidden)
    filteredRoutes.value = filterPlatformRoutes(noHiddenRoutes, platform)
  }

  /** 重置平台过滤 */
  const resetPlatformFilter = (): void => {
    currentPlatform.value = ""
    filteredRoutes.value = []
  }

  return {
    currentPlatform,
    filteredRoutes,
    isFromNavigation,
    setPlatformFilter,
    resetPlatformFilter
  }
})

/** 在 setup 外使用 */
export function useSidebarStoreHook() {
  return useSidebarStore(store)
}
