import { ref, computed } from "vue"
import type { menu } from "@/api/menu/types/menu"
import { getRolePermissionApi, changeRoleMenuPermissionApi } from "@/api/permission"
import { ElMessage } from "element-plus"

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
   * NOTE: 扁平化菜单树数据，为矩阵视图准备数据
   * 将树形菜单数据转换为扁平列表，同时保留层级信息和树形符号
   * 支持根据 selectedPlatforms 过滤菜单
   */
  const flatMenuList = computed(() => {
    const result: Array<menu & { level: number; treePrefix: string; actions?: menu[] }> = []

    const flatten = (menus: menu[], level: number = 0, parentPath: number[] = []) => {
      menus.forEach((menuItem, index) => {
        const isLastChild = index === menus.length - 1

        // 生成树形前缀符号
        let prefix = ""
        parentPath.forEach((_, idx) => {
          if (idx < parentPath.length - 1) {
            prefix += "┃   "
          }
        })
        if (level > 0) {
          prefix += isLastChild ? "┗ " : "┣ "
        }

        // 只显示目录和菜单（type 1, 2），按钮（type 3）作为操作权限
        if (menuItem.type === 1 || menuItem.type === 2) {
          // NOTE: 平台过滤逻辑
          // 如果选择了平台，只显示包含任一选中平台的菜单
          if (selectedPlatforms.value.length > 0) {
            const menuPlatforms = menuItem.meta?.platforms || []
            const hasMatchingPlatform = menuPlatforms.some((p) => selectedPlatforms.value.includes(p))
            if (!hasMatchingPlatform) {
              // 不匹配，跳过该菜单及其子菜单
              return
            }
          }

          // 收集该菜单下的所有按钮
          const actions = menuItem.children?.filter((child) => child.type === 3) || []

          // NOTE: 不包含 children 字段，避免 el-table 显示展开箭头
          const { children: _children, ...menuWithoutChildren } = menuItem

          result.push({
            ...menuWithoutChildren,
            level,
            treePrefix: prefix,
            actions: actions.length > 0 ? actions : undefined
          } as any)

          // 递归处理子菜单（只处理非按钮类型）
          const childMenus = menuItem.children?.filter((child) => child.type !== 3) || []
          if (childMenus.length > 0) {
            flatten(childMenus, level + 1, [...parentPath, index])
          }
        }
      })
    }

    flatten(menuTreeData.value)
    return result
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
