import { ref, computed } from "vue"
import { useRoute } from "vue-router"

// 菜单状态管理
const workspaceMenuState = ref<Record<string, string>>({})

export function useWorkspaceMenu(workspaceId?: string | number) {
  const route = useRoute()

  // 获取当前工作空间的菜单状态
  const activeMenu = computed(() => {
    const key = workspaceId?.toString() || "default"
    return workspaceMenuState.value[key] || "overview"
  })

  // 设置菜单状态
  const setActiveMenu = (menu: string) => {
    const key = workspaceId?.toString() || "default"
    workspaceMenuState.value[key] = menu
  }

  // 导航到指定菜单
  const navigateToMenu = (menu: string) => {
    setActiveMenu(menu)
    // 这里可以根据需要添加路由跳转逻辑
  }

  // 从路由参数恢复菜单状态
  const restoreMenuFromRoute = () => {
    const menu = route.query.menu as string
    if (menu) {
      setActiveMenu(menu)
    }
  }

  return {
    activeMenu,
    setActiveMenu,
    navigateToMenu,
    restoreMenuFromRoute
  }
}
