import { ref, computed } from "vue"
import type { menu } from "@/api/menu/types/menu"
import { MenuType } from "@/api/menu/types/menu"
import { getRolePermissionApi, changeRoleMenuPermissionApi } from "@/api/permission"
import { ElMessage } from "element-plus"

/**
 * NOTE: 扁平化后的菜单项类型
 */
type FlatMenuItem = Omit<menu, "children"> & {
  level: number
  actions?: menu[]
}

/**
 * NOTE: 辅助函数 - 判断菜单是否匹配选中的平台
 */
const matchesPlatform = (menuItem: menu, selectedPlatforms: string[]): boolean => {
  if (selectedPlatforms.length === 0) return true
  const menuPlatforms = menuItem.meta?.platforms || []
  return menuPlatforms.some((p) => selectedPlatforms.includes(p))
}

/**
 * NOTE: 辅助函数 - 分离按钮：有子按钮 vs 普通按钮
 */
const separateButtons = (buttons: menu[]) => {
  const buttonsWithChildren: menu[] = []
  const simpleButtons: menu[] = []

  buttons.forEach((btn) => {
    if (btn.children && btn.children.length > 0) {
      buttonsWithChildren.push(btn)
    } else {
      simpleButtons.push(btn)
    }
  })

  return { buttonsWithChildren, simpleButtons }
}

/**
 * NOTE: 辅助函数 - 扁平化菜单树
 * 分离职责：只负责将树形结构转为扁平列表
 */
const flattenMenuTree = (menus: menu[], level: number = 0, result: FlatMenuItem[] = []): FlatMenuItem[] => {
  menus.forEach((menuItem) => {
    // 处理目录和菜单
    if (menuItem.type === MenuType.DIRECTORY || menuItem.type === MenuType.MENU) {
      const directButtons = menuItem.children?.filter((child) => child.type === MenuType.BUTTON) || []
      const { buttonsWithChildren, simpleButtons } = separateButtons(directButtons)

      const { children: _children, ...menuWithoutChildren } = menuItem

      result.push({
        ...menuWithoutChildren,
        level,
        actions: simpleButtons.length > 0 ? simpleButtons : undefined
      })

      const childMenus = menuItem.children?.filter((child) => child.type !== MenuType.BUTTON) || []
      const allChildren = [...childMenus, ...buttonsWithChildren]

      if (allChildren.length > 0) {
        flattenMenuTree(allChildren, level + 1, result)
      }
    }

    // 处理带有子按钮的按钮
    if (menuItem.type === MenuType.BUTTON && menuItem.children && menuItem.children.length > 0) {
      const subButtons = menuItem.children.filter((child) => child.type === MenuType.BUTTON)
      const { children: _children, ...buttonWithoutChildren } = menuItem

      result.push({
        ...buttonWithoutChildren,
        level,
        actions: subButtons.length > 0 ? subButtons : undefined
      })
    }
  })

  return result
}

/**
 * 矩阵权限管理 Composable
 * NOTE: 用于矩阵视图的权限数据转换和管理
 */
export const useMatrixPermission = () => {
  // 响应式数据
  const menuTreeData = ref<menu[]>([])
  const checkedKeys = ref<number[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const selectedPlatforms = ref<string[]>([])

  /**
   * NOTE: 扁平化菜单列表（应用平台过滤）
   * 职责：组合菜单数据和平台过滤逻辑
   */
  const flatMenuList = computed(() => {
    // 先过滤平台
    const filteredMenus =
      selectedPlatforms.value.length > 0
        ? menuTreeData.value.filter((menu) => matchesPlatform(menu, selectedPlatforms.value))
        : menuTreeData.value

    // 再扁平化
    return flattenMenuTree(filteredMenus)
  })

  /**
   * 加载角色权限数据
   */
  const loadPermissionData = async (roleCode: string) => {
    loading.value = true
    try {
      const { data } = await getRolePermissionApi(roleCode)
      menuTreeData.value = data.menus || []
      checkedKeys.value = data.authz_ids || []
    } catch (error) {
      console.error("加载权限数据失败:", error)
      menuTreeData.value = []
      checkedKeys.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理矩阵中的复选框变化
   */
  const handleCheck = (menuItem: menu, checked: boolean) => {
    if (checked) {
      // 勾选：添加到 checkedKeys
      if (!checkedKeys.value.includes(menuItem.id)) {
        checkedKeys.value.push(menuItem.id)
      }
    } else {
      // 取消勾选：从 checkedKeys 移除
      checkedKeys.value = checkedKeys.value.filter((id) => id !== menuItem.id)
    }
  }

  /**
   * 全选/取消全选
   * NOTE: 只作用于当前过滤后的菜单项
   */
  const toggleSelectAll = () => {
    // NOTE: 使用 flatMenuList 获取当前过滤后的所有菜单ID
    const filteredIds: number[] = []
    flatMenuList.value.forEach((menu) => {
      filteredIds.push(menu.id)
      // 包含该菜单的所有操作按钮
      if (menu.actions) {
        menu.actions.forEach((action) => filteredIds.push(action.id))
      }
    })

    // 判断当前过滤后的菜单是否全部选中
    const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => checkedKeys.value.includes(id))

    if (isAllFilteredSelected) {
      // 取消全选：移除所有过滤后的ID
      checkedKeys.value = checkedKeys.value.filter((id) => !filteredIds.includes(id))
    } else {
      // 全选：添加所有过滤后的ID
      filteredIds.forEach((id) => {
        if (!checkedKeys.value.includes(id)) {
          checkedKeys.value.push(id)
        }
      })
    }
  }

  /**
   * 保存权限配置
   */
  const savePermission = async (roleCode: string) => {
    saving.value = true
    try {
      const { data } = await changeRoleMenuPermissionApi(checkedKeys.value, roleCode)
      if (data) {
        ElMessage.success("权限保存成功")
        return true
      }
      ElMessage.error("权限保存失败")
      return false
    } catch (error) {
      console.error("保存权限失败:", error)
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 重置权限为初始状态
   */
  const resetPermission = async (roleCode: string) => {
    await loadPermissionData(roleCode)
  }

  return {
    menuTreeData,
    checkedKeys,
    loading,
    saving,
    selectedPlatforms,
    flatMenuList,
    loadPermissionData,
    handleCheck,
    toggleSelectAll,
    savePermission,
    resetPermission
  }
}
