import { defineStore } from "pinia"
import { ref } from "vue"

export const useWorkspaceMenuStore = defineStore("workspaceMenu", () => {
  // 当前活跃的菜单项
  const activeMenu = ref("overview")

  // 设置活跃菜单
  const setActiveMenu = (menu: string) => {
    activeMenu.value = menu
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
