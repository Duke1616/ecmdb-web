import { defineStore } from "pinia"
import { ref } from "vue"

export const useWorkspaceMenuStore = defineStore("workspaceMenu", () => {
  // 当前活跃的菜单项
  const activeMenu = ref("overview")
  const deprecatedMenuMap: Record<string, string> = {
    escalation: "noise-aggregate",
    "ticket-config": "noise-aggregate"
  }

  // 设置活跃菜单
  const setActiveMenu = (menu: string) => {
    activeMenu.value = deprecatedMenuMap[menu] || menu
  }

  // 重置菜单状态
  const resetMenu = () => {
    activeMenu.value = "overview"
  }

  return {
    activeMenu,
    setActiveMenu,
    resetMenu
  }
})
