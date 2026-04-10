import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { type RouteRecordRaw } from "vue-router"

export const useSidebarStore = defineStore("sidebar", () => {
  /** 当前选中的平台标识 */
  const currentPlatform = ref<string>("")
  /** 经过平台过滤后的展示路由 */
  const filteredRoutes = ref<RouteRecordRaw[]>([])
  /** 标记是否来自于首页导航页面的筛选 */
  const isFromNavigation = ref<boolean>(false)

  /**
   * 检查路由是否属于指定平台
   * @param platform 平台 ID
   * @param route 路由对象
   */
  const belongsToPlatform = (platform: string, route: RouteRecordRaw): boolean => {
    const platforms = route.meta?.platforms
    // 1. 若路由未定义平台，则视为公共路由，始终可见
    if (!platforms || platforms.length === 0) return true
    // 2. 若未指定搜索平台，则显示所有
    if (!platform) return true

    return platforms.includes(platform)
  }

  /**
   * 递归过滤并按需平铺平台路由
   * @param routes 原始路由数组
   * @param platform 目标平台 ID
   */
  const filterAndFlattenRoutes = (routes: RouteRecordRaw[], platform: string): RouteRecordRaw[] => {
    const result: RouteRecordRaw[] = []

    routes.forEach((route) => {
      // 1. 基础权限过滤
      if (!belongsToPlatform(platform, route)) return

      // 2. 无子路由情况
      if (!route.children || route.children.length === 0) {
        result.push(route)
        return
      }

      // 3. 递归处理子路由
      const filteredChildren = filterAndFlattenRoutes(route.children, platform)
      if (filteredChildren.length === 0) return

      // 4. 判断是否需要执行“首页导航平铺”逻辑
      // 逻辑：只有指定了平台、且来自导航页、且当前节点属于该平台标识时，才提取子节点
      const shouldFlatten = platform && isFromNavigation.value && route.meta?.platforms?.includes(platform)

      if (shouldFlatten) {
        // 平台层级打平：将子路由提升至父级同层展示
        const normalizedChildren = filteredChildren
          .filter((child) => !child.meta?.hidden)
          .map((child) => {
            const path = child.path.startsWith("/") ? child.path : `${route.path.replace(/\/$/, "")}/${child.path}`

            return { ...child, path }
          })
        result.push(...normalizedChildren)
      } else {
        // 保持原始嵌套结构
        result.push({ ...route, children: filteredChildren })
      }
    })

    return result
  }

  /**
   * 设置平台过滤状态
   * @param platform 平台 ID
   * @param allRoutes 需要过滤的总路由表
   * @param fromNavigation 是否来自导航页跳转
   */
  const setPlatformFilter = (platform: string, allRoutes: RouteRecordRaw[], fromNavigation = false): void => {
    currentPlatform.value = platform
    if (fromNavigation) {
      isFromNavigation.value = true
    }

    // 排除隐藏路由后执行过滤
    const visibleRawRoutes = allRoutes.filter((r) => !r.meta?.hidden)
    filteredRoutes.value = filterAndFlattenRoutes(visibleRawRoutes, platform)
  }

  /**
   * 重置过滤器
   */
  const resetPlatformFilter = (): void => {
    currentPlatform.value = ""
    filteredRoutes.value = []
    isFromNavigation.value = false
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
