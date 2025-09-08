<template>
  <div class="permission-manager">
    <!-- 顶部标题栏 -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-group">
          <h1 class="main-title">菜单权限分配</h1>
          <p class="subtitle">为角色分配相应的菜单访问权限</p>
        </div>
        <div class="stats-group">
          <div class="stat-item">
            <div class="stat-number">{{ selectedMenusCount }}</div>
            <div class="stat-label">已选择</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ menuTreeData.length }}</div>
            <div class="stat-label">总菜单</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="filterInput"
          size="large"
          placeholder="搜索菜单名称或路径..."
          :prefix-icon="Search"
          class="search-input"
          clearable
        />
        <div class="search-actions">
          <el-button @click="toggleExpandAll" class="action-btn" :class="{ active: isAllExpanded }">
            <el-icon><ArrowDown v-if="isAllExpanded" /><ArrowUp v-else /></el-icon>
            {{ isAllExpanded ? "收起全部" : "展开全部" }}
          </el-button>
          <el-button @click="toggleSelectAll" class="action-btn" :class="{ active: isAllSelected }">
            <el-icon><Check v-if="isAllSelected" /><Close v-else /></el-icon>
            {{ isAllSelected ? "取消全选" : "全选全部" }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-section">
      <!-- 左侧：菜单树 -->
      <div class="menu-tree-panel">
        <div class="panel-header">
          <div class="header-info">
            <el-icon class="header-icon"><Menu /></el-icon>
            <div class="header-text">
              <h3>菜单列表</h3>
              <span>选择需要分配的菜单权限</span>
            </div>
          </div>
          <div class="header-badge">
            <span class="badge-text">已选 {{ checkedKeys.length }} 项</span>
          </div>
        </div>

        <div class="tree-container">
          <el-tree
            ref="treeRef"
            :data="menuTreeData"
            show-checkbox
            check-strictly
            default-expand-all
            node-key="id"
            :highlight-current="true"
            :default-checked-keys="checkedKeys"
            :props="defaultProps"
            :filter-node-method="filterNode"
            class="menu-tree"
            @check="handleCheck"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <div class="node-content">
                  <el-icon class="node-icon">
                    <Menu />
                  </el-icon>
                  <div class="node-title">{{ data.meta?.title || data.name || "" }}</div>
                  <el-tag :type="getMenuTypeTagType(data.type)" size="small" class="menu-type-tag">
                    {{ getMenuTypeText(data.type) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：已选择菜单 -->
      <div class="selected-panel">
        <div class="panel-header">
          <div class="header-info">
            <el-icon class="header-icon"><Check /></el-icon>
            <div class="header-text">
              <h3>已选择菜单</h3>
              <span>当前已选择的菜单权限</span>
            </div>
          </div>
          <div class="header-badge">
            <span class="badge-text">{{ selectedMenusCount }} 项</span>
          </div>
        </div>

        <div class="selected-container">
          <div v-if="selectedMenusCount === 0" class="empty-state">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <p class="empty-text">暂无选择的菜单</p>
            <p class="empty-hint">请在左侧选择需要分配的菜单权限</p>
          </div>
          <div v-else class="selected-tree-container">
            <el-tree
              ref="selectedTreeRef"
              :data="getSelectedMenuTree()"
              :props="defaultProps"
              :expand-on-click-node="false"
              :check-on-click-node="false"
              :default-expand-all="true"
              class="selected-menu-tree"
            >
              <template #default="{ data }">
                <div class="tree-node">
                  <div class="node-content">
                    <el-icon class="node-icon">
                      <Menu />
                    </el-icon>
                    <div class="node-title">{{ data.meta?.title || data.name || "" }}</div>
                    <el-tag :type="getMenuTypeTagType(data.type)" size="small" class="menu-type-tag">
                      {{ getMenuTypeText(data.type) }}
                    </el-tag>
                  </div>
                  <button class="remove-btn" @click="removeMenu(data)" title="移除">
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="footer-section">
      <div class="footer-actions">
        <el-button @click="handleCancel" class="cancel-btn" size="large">
          <el-icon><Close /></el-icon>
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          class="confirm-btn"
          size="large"
          :disabled="selectedMenusCount === 0"
        >
          <el-icon><Check /></el-icon>
          确认分配 ({{ selectedMenusCount }})
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue"
import { Search, Close, Menu, Check, ArrowDown, ArrowUp, DocumentRemove } from "@element-plus/icons-vue"
import { ElTree } from "element-plus"
import type { menu } from "@/api/menu/types/menu"
import { changeRoleMenuPermissionApi, getRolePermissionApi } from "@/api/permission"
import { rolePermission } from "@/api/permission/types/permission"
import { ElMessage } from "element-plus"

interface Props {
  defaultSelectedMenus?: number[]
  roleCode?: string
}

interface Emits {
  (e: "confirm", menus: Array<{ id: number; name: string; path: string; meta: any }>): void
  (e: "cancel"): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

// 响应式数据
const filterInput = ref("")
const menuTreeData = ref<menu[]>([]) // 菜单树数据
const selectedMenuTreeData = ref<menu[]>([]) // 已选择菜单的树形数据
const checkedKeys = ref<number[]>([]) // 已选择的菜单ID
const menuPermissionData = ref<rolePermission>()
const treeRef = ref<InstanceType<typeof ElTree>>()
const selectedTreeRef = ref<InstanceType<typeof ElTree>>()

// 按钮状态
const isAllExpanded = ref(true) // 是否全部展开
const isAllSelected = ref(false) // 是否全部选中

// 计算属性
const selectedMenusCount = computed(() => getSelectedMenus().length)

// 菜单类型处理方法
const getMenuTypeText = (type: number) => {
  switch (type) {
    case 1:
      return "目录"
    case 2:
      return "菜单"
    case 3:
      return "按钮"
    default:
      return "未知"
  }
}

const getMenuTypeTagType = (type: number) => {
  switch (type) {
    case 1:
      return "primary"
    case 2:
      return "success"
    case 3:
      return "warning"
    default:
      return "info"
  }
}

// 树形控件配置
const defaultProps = {
  children: "children",
  label: (data: any) => data.meta?.title || data.name || "",
  disabled: () => false // 所有节点都可选择
}

// 加载菜单数据
const loadMenusData = async (roleCode?: string) => {
  try {
    if (roleCode) {
      const { data } = await getRolePermissionApi(roleCode)
      menuPermissionData.value = data
      menuTreeData.value = data.menus || []
      checkedKeys.value = data.authz_ids || []

      // 树数据加载完成后，同步 checkedKeys 状态
      setTimeout(() => {
        if (treeRef.value) {
          // 如果有默认选中项，设置到树形控件
          if (checkedKeys.value.length > 0) {
            checkedKeys.value.forEach((key) => {
              treeRef.value?.setChecked(key, true, false)
            })

            // 初始化右侧已选择菜单的树形数据
            const checkedNodes = treeRef.value.getCheckedNodes() as menu[]
            selectedMenuTreeData.value = buildSelectedMenuTree(checkedNodes)
          } else {
            selectedMenuTreeData.value = []
          }

          // 初始化按钮状态
          const allNodes = getAllMenuNodes(menuTreeData.value)
          isAllSelected.value = checkedKeys.value.length === allNodes.length && allNodes.length > 0
          isAllExpanded.value = true // 默认全部展开
        }
      }, 100)
    }
  } catch (error) {
    console.error("获取菜单数据失败:", error)
    menuTreeData.value = []
    selectedMenuTreeData.value = []
    checkedKeys.value = []
  }
}

// 过滤节点方法
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return (typeof data.meta.title === "string" && data.meta.title.includes(value)) || data.path.includes(value)
}

// 监听搜索关键词变化，过滤树节点
watch(filterInput, (val: string) => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

// 监听 defaultSelectedMenus 变化
watch(
  () => props.defaultSelectedMenus,
  (newMenus) => {
    if (newMenus && Array.isArray(newMenus) && newMenus.length > 0) {
      checkedKeys.value = [...newMenus]
    } else {
      checkedKeys.value = []
    }
  },
  { immediate: true }
)

// 监听 roleCode 变化
watch(
  () => props.roleCode,
  (newRoleCode) => {
    if (newRoleCode) {
      loadMenusData(newRoleCode)
    }
  },
  { immediate: true }
)

// 获取已选择的节点信息
const getSelectedMenus = (): menu[] => {
  if (!treeRef.value) return []
  const nodes = treeRef.value.getCheckedNodes() as menu[]
  return nodes
}

// 获取已选择菜单的树形结构
const getSelectedMenuTree = () => {
  const selectedMenus = getSelectedMenus()
  console.log("已选择的菜单:", selectedMenus)

  if (selectedMenus.length === 0) return []

  // 直接返回选中的菜单，保持原有的层级关系
  // 如果选中的菜单有父子关系，就保持树形结构
  // 如果没有父子关系，就平铺显示
  const buildTree = (menus: menu[], parentId: number | null | undefined = null): menu[] => {
    const filtered = menus.filter((menu) => {
      if (parentId === null) {
        // 查找根级菜单：pid为0、null、undefined或空值，或者没有父级菜单在选中列表中
        const isRoot = menu.pid === 0 || menu.pid === null || menu.pid === undefined || !menu.pid
        const hasParentInSelected = menus.some((m) => m.id === menu.pid)
        return isRoot || !hasParentInSelected
      }
      return menu.pid === parentId
    })
    console.log(`查找父级ID为 ${parentId} 的菜单:`, filtered)

    return filtered.map((menu) => ({
      ...menu,
      children: buildTree(menus, menu.id)
    }))
  }

  const tree = buildTree(selectedMenus)
  console.log("构建的树形结构:", tree)
  return tree
}

// 构建已选择菜单的树形数据
const buildSelectedMenuTree = (selectedMenus: menu[]): menu[] => {
  if (!selectedMenus.length) return []

  // 创建菜单映射，便于查找
  const menuMap = new Map<number, menu>()
  const allMenus = getAllMenuNodes(menuTreeData.value)
  allMenus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // 构建树形结构
  const rootMenus: menu[] = []
  const processedMenus = new Set<number>()

  // 首先添加所有选中的菜单
  selectedMenus.forEach((menu) => {
    if (menuMap.has(menu.id)) {
      const menuCopy = menuMap.get(menu.id)!
      if (!processedMenus.has(menu.id)) {
        rootMenus.push(menuCopy)
        processedMenus.add(menu.id)
      }
    }
  })

  // 然后添加必要的父级菜单以保持层级关系
  const addParentMenus = (menus: menu[]) => {
    menus.forEach((menu) => {
      if (menu.pid && menu.pid !== 0 && menuMap.has(menu.pid)) {
        const parentMenu = menuMap.get(menu.pid)!
        if (!processedMenus.has(menu.pid)) {
          // 找到父菜单在树中的位置并插入
          const parentInTree = findMenuInTree(rootMenus, menu.pid)
          if (parentInTree) {
            parentInTree.children = parentInTree.children || []
            parentInTree.children.push(parentMenu)
          } else {
            rootMenus.unshift(parentMenu)
          }
          processedMenus.add(menu.pid)
          addParentMenus([parentMenu])
        }
      }
    })
  }

  addParentMenus(selectedMenus)

  return rootMenus
}

// 在树中查找菜单
const findMenuInTree = (tree: menu[], menuId: number): menu | null => {
  for (const menu of tree) {
    if (menu.id === menuId) return menu
    if (menu.children) {
      const found = findMenuInTree(menu.children, menuId)
      if (found) return found
    }
  }
  return null
}

// 处理勾选变化
const handleCheck = () => {
  if (treeRef.value) {
    const checkedNodes = treeRef.value.getCheckedNodes()
    checkedKeys.value = checkedNodes.map((node) => node.id)

    // 更新全选状态
    const allNodes = getAllMenuNodes(menuTreeData.value)
    isAllSelected.value = checkedNodes.length === allNodes.length && allNodes.length > 0

    // 更新右侧已选择菜单的树形数据
    selectedMenuTreeData.value = buildSelectedMenuTree(checkedNodes as menu[])
  }
}

// 移除菜单
const removeMenu = (menu: menu) => {
  if (!treeRef.value) return

  try {
    // 直接取消选中该菜单节点
    treeRef.value.setChecked(menu, false, false)

    // 重新获取更新后的状态并同步
    const updatedCheckedKeys = treeRef.value.getCheckedKeys() as number[]
    checkedKeys.value = updatedCheckedKeys

    // 更新右侧已选择菜单的树形数据
    const checkedNodes = treeRef.value.getCheckedNodes() as menu[]
    selectedMenuTreeData.value = buildSelectedMenuTree(checkedNodes)
  } catch (error) {
    console.error("删除菜单失败:", error)
  }
}

// 全选/取消全选
const toggleTreeChecked = (value: boolean) => {
  if (!treeRef.value) return

  if (value) {
    // 全选所有菜单
    const allNodes = getAllMenuNodes(menuTreeData.value)
    allNodes.forEach((node) => {
      treeRef.value?.setChecked(node, true, false)
    })
  } else {
    // 取消全选
    treeRef.value.setCheckedKeys([])
  }

  // 更新 checkedKeys
  const updatedCheckedKeys = treeRef.value.getCheckedKeys() as number[]
  checkedKeys.value = updatedCheckedKeys

  // 更新右侧已选择菜单的树形数据
  const checkedNodes = treeRef.value.getCheckedNodes() as menu[]
  selectedMenuTreeData.value = buildSelectedMenuTree(checkedNodes)
}

// 获取所有菜单节点（扁平化）
const getAllMenuNodes = (menus: menu[]): menu[] => {
  const result: menu[] = []
  const traverse = (nodes: menu[]) => {
    nodes.forEach((node) => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(menus)
  return result
}

// 展开/收起所有节点
const expandAllNodes = (expanded: boolean) => {
  if (!treeRef.value) return

  Object.values(treeRef.value.store.nodesMap).forEach((v: any) => (v.expanded = expanded))
}

// 切换展开/收起状态
const toggleExpandAll = () => {
  isAllExpanded.value = !isAllExpanded.value
  expandAllNodes(isAllExpanded.value)
}

// 切换全选/取消全选状态
const toggleSelectAll = () => {
  isAllSelected.value = !isAllSelected.value
  toggleTreeChecked(isAllSelected.value)
}

// 处理取消
const handleCancel = () => {
  emits("cancel")
}

// 确认时返回菜单数据
const handleConfirm = () => {
  const selectedMenus = getSelectedMenus()
  emits("confirm", selectedMenus)
}

// 提交权限（保留原有功能）
const submitAddPermission = async (roleCode: string) => {
  try {
    const { data } = await changeRoleMenuPermissionApi(checkedKeys.value, roleCode)
    if (data) {
      ElMessage.success("权限更新成功")
      return true
    }
    ElMessage.error("权限更新失败")
    return false
  } catch (error) {
    console.error("权限更新失败:", error)
    ElMessage.error("权限更新失败")
    return false
  }
}

// 获取菜单权限数据（保留原有功能）
const getMenuPermissionData = (roleCode: string) => {
  return loadMenusData(roleCode)
}

defineExpose({
  getMenuPermissionData,
  toggleTreeChecked,
  expandAllNodes,
  toggleExpandAll,
  toggleSelectAll,
  submitAddPermission,
  handleCancel,
  handleConfirm
})
</script>

<style lang="scss" scoped>
/* 权限管理器主容器 */
.permission-manager {
  height: 70vh;
  max-height: 600px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
}

/* 顶部标题栏 */
.header-section {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-group {
      .main-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: #64748b;
        font-weight: 400;
      }
    }

    .stats-group {
      display: flex;
      gap: 32px;

      .stat-item {
        text-align: center;

        .stat-number {
          font-size: 18px;
          font-weight: 700;
          color: #3b82f6;
          line-height: 1;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
      }
    }
  }
}

/* 搜索栏 */
.search-section {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 24px;
  flex-shrink: 0;

  .search-container {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      flex: 1;
      max-width: 300px;

      :deep(.el-input__wrapper) {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 12px;
        height: 36px;
        transition: all 0.3s ease;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

        &:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          background: white;
        }
      }

      :deep(.el-input__inner) {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
      }

      :deep(.el-input__prefix) {
        color: #64748b;
        font-size: 14px;
      }
    }

    .search-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;

        &.active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

          &:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
        }
      }
    }
  }
}

/* 主要内容区域 */
.content-section {
  display: flex;
  flex: 1;
  gap: 20px;
  padding: 16px 24px;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
}

/* 左侧菜单树面板 */
.menu-tree-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }

      .header-text {
        h3 {
          margin: 0 0 2px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }

        span {
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }
      }
    }

    .header-badge {
      .badge-text {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
      }
    }
  }

  .tree-container {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
    max-height: 300px;

    .menu-tree {
      :deep(.el-tree-node) {
        .el-tree-node__content {
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 4px;
          border: 1px solid transparent;
        }

        .el-tree-node__label {
          width: 100%;
        }

        .el-checkbox {
          margin-right: 12px;
        }
      }

      .tree-node {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 4px 0;

        .node-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;

          .node-icon {
            color: #3b82f6;
            flex-shrink: 0;
            font-size: 16px;
          }

          .node-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.3;
            flex: 1;
            min-width: 0;
          }
        }
      }
    }
  }
}

/* 右侧已选择面板 */
.selected-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
      }

      .header-text {
        h3 {
          margin: 0 0 2px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }

        span {
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }
      }
    }

    .header-badge {
      .badge-text {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(34, 197, 94, 0.3);
      }
    }
  }

  .selected-container {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
    max-height: 300px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 150px;
      text-align: center;

      .empty-icon {
        font-size: 36px;
        color: #cbd5e1;
        margin-bottom: 12px;
      }

      .empty-text {
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        margin: 0 0 6px 0;
      }

      .empty-hint {
        font-size: 12px;
        color: #94a3b8;
        margin: 0;
      }
    }

    .selected-tree-container {
      .selected-menu-tree {
        :deep(.el-tree-node) {
          .el-tree-node__content {
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 4px;
            border: 1px solid transparent;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);
            border-color: rgba(34, 197, 94, 0.1);
          }

          .el-tree-node__label {
            width: 100%;
          }
        }

        .tree-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 2px 0;

          .node-content {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;

            .node-icon {
              color: #22c55e;
              flex-shrink: 0;
              font-size: 14px;
            }

            .node-title {
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              line-height: 1.3;
              flex: 1;
              min-width: 0;
            }
          }

          .remove-btn {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin-left: 6px;

            .el-icon {
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}

/* 菜单类型样式 */
.menu-type-tag {
  margin-left: 8px;
  font-size: 10px;
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* 底部操作栏 */
.footer-section {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;

    .cancel-btn,
    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid transparent;
      min-width: 120px;
      justify-content: center;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }

    .cancel-btn {
      background: white;
      color: #64748b;
      border-color: #e2e8f0;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section {
    padding: 12px 16px;

    .header-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;

      .stats-group {
        gap: 24px;
      }
    }
  }

  .search-section {
    padding: 12px 16px;

    .search-container {
      flex-direction: column;
      gap: 12px;

      .search-input {
        max-width: none;
      }

      .search-actions {
        width: 100%;
        justify-content: center;
      }
    }
  }

  .content-section {
    padding: 12px 16px;
  }

  .footer-section {
    padding: 12px 16px;
  }
}
</style>
