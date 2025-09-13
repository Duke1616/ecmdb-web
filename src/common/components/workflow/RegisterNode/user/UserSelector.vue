<template>
  <div class="user-selector-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="filterInput"
          size="large"
          placeholder="输入用户名或展示名称进行搜索..."
          :prefix-icon="Search"
          class="search-input"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧：组织架构 -->
      <div class="org-panel">
        <div class="panel-header">
          <h4 class="panel-title">组织架构</h4>
          <span class="selection-count">已选择 {{ checkedKeys.length }} 人</span>
        </div>
        <div class="tree-wrapper">
          <el-tree
            ref="treeRef"
            :data="treeData"
            show-checkbox
            check-strictly
            default-expand-all
            node-key="uniqueId"
            :highlight-current="true"
            :default-checked-keys="checkedKeys"
            :props="defaultProps"
            :filter-node-method="filterNode"
            class="org-tree"
            @check="handleCheck"
          />
        </div>
      </div>

      <!-- 右侧：已选择人员 -->
      <div class="selection-panel">
        <div class="panel-header">
          <h4 class="panel-title">已选择人员</h4>
          <span class="selection-count">{{ selectedUsersCount }} 人</span>
        </div>
        <div class="selected-user-list-wrapper">
          <div class="user-list">
            <div v-for="node in getSelectedNodes()" :key="node.id" class="user-card">
              <div class="user-avatar">
                <el-avatar :size="24" :style="{ backgroundColor: generateUserColor(node.name) }">
                  {{ node.display_name?.charAt(0) || node.name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="user-info">
                <span class="user-name">{{ node.display_name || node.name }}</span>
                <span class="user-department">{{ node.department_name || "未知部门" }}</span>
              </div>
              <button class="remove-btn" @click="removeUserFromPreview(node)" title="移除">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from "vue"
import { ElTree } from "element-plus"
import { Search, Close } from "@element-plus/icons-vue"
import { userDepartmentCombination } from "@/api/user/types/user"
import { pipelineUserByDepartmentApi } from "@/api/user"

interface Props {
  defaultCheckedKeys?: number[]
}

interface Emits {
  (e: "confirm", users: Array<{ name: string; display_name: string; id: number }>): void
  (e: "cancel"): void
}

const addUniqueId = (nodes: any[]): any[] => {
  return nodes.map((node) => {
    const uniqueId = `${node.type}_${node.id}` // 保证唯一
    const newNode = {
      ...node,
      uniqueId,
      children: node.children ? addUniqueId(node.children) : []
    }
    return newNode
  })
}

// 扩展的用户节点接口，包含部门信息
interface UserNodeWithDepartment {
  id: number
  type: string
  display_name: string
  name: string
  disabled: boolean
  sort: number
  children: any[]
  department_name?: string
  avatar?: string
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

// 响应式数据
const filterInput = ref("")
const treeData = ref<userDepartmentCombination[]>([])
const checkedKeys = ref<string[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

// 计算属性
const selectedUsersCount = computed(() => getSelectedNodes().length)

// 树形控件配置
const defaultProps = {
  children: "children",
  label: "display_name",
  disabled: (data: any) => data.type === "department" // 部门节点不可勾选
}

// 监听 defaultCheckedKeys 变化
watch(
  () => props.defaultCheckedKeys,
  (newKeys) => {
    if (newKeys && Array.isArray(newKeys) && newKeys.length > 0) {
      // 将数字ID转换为uniqueId格式
      checkedKeys.value = newKeys.map((id) => `person_${id}`)
    } else {
      checkedKeys.value = []
    }
  },
  { immediate: true }
)

// 监听 filterInput 变化，过滤树节点
watch(filterInput, (val: string) => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

// 初始化时设置默认选中项
onMounted(() => {
  if (props.defaultCheckedKeys && Array.isArray(props.defaultCheckedKeys) && props.defaultCheckedKeys.length > 0) {
    // 将数字ID转换为uniqueId格式
    checkedKeys.value = props.defaultCheckedKeys.map((id) => `person_${id}`)
  } else {
    checkedKeys.value = []
  }

  // 添加窗口大小变化监听器
  window.addEventListener("resize", handleResize)

  // 初始化数据
  listDepartmentTreeData()
})

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})

// 处理窗口大小变化
const handleResize = () => {
  // 触发响应式更新
  // computed 会自动重新计算 dialogWidth
}

// 过滤节点方法
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return (typeof data.display_name === "string" && data.display_name.includes(value)) || data.name.includes(value)
}

// 获取部门用户树数据
const listDepartmentTreeData = () => {
  pipelineUserByDepartmentApi()
    .then(({ data }) => {
      treeData.value = addUniqueId(data)

      // 树数据加载完成后，同步 checkedKeys 状态
      setTimeout(() => {
        if (treeRef.value) {
          // 如果有默认选中项，设置到树形控件
          if (
            props.defaultCheckedKeys &&
            Array.isArray(props.defaultCheckedKeys) &&
            props.defaultCheckedKeys.length > 0
          ) {
            props.defaultCheckedKeys.forEach((key) => {
              treeRef.value?.setChecked(key, true, false)
            })

            // 更新 checkedKeys
            const updatedCheckedKeys = treeRef.value.getCheckedKeys() as string[]
            checkedKeys.value = updatedCheckedKeys
          }
        }
      }, 100)
    })
    .catch((error) => {
      console.error("获取部门用户树数据失败:", error)
      treeData.value = []
    })
}

// 获取已选择的节点信息
const getSelectedNodes = (): UserNodeWithDepartment[] => {
  if (!treeRef.value) return []
  const nodes = treeRef.value.getCheckedNodes()

  // 过滤掉部门节点，只保留人员节点（type === 'person'）
  const userNodes = nodes.filter((node) => node.type === "person")

  // 去重，确保每个用户ID只出现一次
  const uniqueUserNodes = userNodes.filter((node, index, self) => index === self.findIndex((n) => n.id === node.id))

  // 为每个人员节点添加部门信息
  return uniqueUserNodes.map((userNode) => {
    const departmentName = getDepartmentName(userNode)
    return {
      ...userNode,
      department_name: departmentName
    } as UserNodeWithDepartment
  })
}

// 获取人员所属的部门名称
const getDepartmentName = (userNode: any): string => {
  if (!treeData.value || !treeData.value.length) return "未知部门"

  // 递归查找人员所属的部门
  const findDepartment = (nodes: any[]): string | null => {
    for (const node of nodes) {
      if (node.type === "department") {
        // 检查这个部门下是否包含该人员
        if (node.children && node.children.some((child: any) => child.id === userNode.id)) {
          return node.display_name
        }
        // 递归查找子部门
        if (node.children) {
          const result = findDepartment(node.children)
          if (result) return result
        }
      }
    }
    return null
  }

  const departmentName = findDepartment(treeData.value)
  return departmentName || "未知部门"
}

// 处理勾选变化
const handleCheck = () => {
  if (treeRef.value) {
    const checkedNodes = treeRef.value.getCheckedNodes()
    // 只保留人员节点
    const userNodes = checkedNodes.filter((node) => node.type === "person")
    checkedKeys.value = userNodes.map((node) => node.uniqueId)
  }
}

// 确认时返回用户数据
const handleConfirm = () => {
  if (treeRef.value) {
    const nodes = treeRef.value.getCheckedNodes().filter((node) => node.type === "person")
    const selectedUsers = nodes.map((node) => ({
      id: node.id, // 原始 id
      name: node.name,
      display_name: node.display_name
    }))
    emits("confirm", selectedUsers)
  }
}

// 生成用户头像颜色
const generateUserColor = (username: string): string => {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#84cc16",
    "#f97316",
    "#6366f1"
  ]
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}

// 从预览区域移除用户（通过节点对象）
const removeUserFromPreview = (node: UserNodeWithDepartment) => {
  // 调用通用的移除函数
  removeUser(node.id)
}

// 移除用户
const removeUser = (userId: number) => {
  if (!treeRef.value) return

  // 获取树形控件的当前状态
  const currentCheckedNodes = treeRef.value.getCheckedNodes()

  // 获取要删除的用户节点信息，确保删除的是正确的用户
  const userNodeToDelete = currentCheckedNodes.find((node) => node.id === userId && node.type === "person")

  if (userNodeToDelete) {
    // 使用节点的完整信息来删除，避免ID冲突
    try {
      // 直接删除用户节点
      treeRef.value.setChecked(userNodeToDelete, false, false)

      // 重新获取更新后的状态并同步
      const updatedCheckedKeys = treeRef.value.getCheckedKeys() as string[]
      checkedKeys.value = updatedCheckedKeys
    } catch (error) {
      console.error("删除用户失败:", error)
    }
  }
}

// 暴露方法给父组件
defineExpose({
  handleConfirm
})
</script>

<style lang="scss" scoped>
/* 用户选择器容器 */
.user-selector-container {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
  height: 60vh;
}

.search-section {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
  flex-shrink: 0;

  .search-container {
    display: flex;
    align-items: center;

    .search-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0 12px;
        height: 40px;
        transition: all 0.2s ease;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
          background: #ffffff;
        }

        &.is-focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        color: #111827;
        font-weight: 400;

        &::placeholder {
          color: #6b7280;
          font-weight: 400;
        }
      }

      :deep(.el-input__prefix) {
        color: #6b7280;
        font-size: 16px;
      }
    }
  }
}

/* 主要内容区域 */
.content-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 1199px) {
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 1200px) {
    flex-direction: row;
  }
}

/* 左侧：组织架构面板 */
.org-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .selection-count {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  }

  .tree-wrapper {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;

      &:hover {
        background: #94a3b8;
      }
    }
  }
}

/* 右侧：已选择人员面板 */
.selection-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .selection-count {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  }

  .selected-user-list-wrapper {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;

      &:hover {
        background: #94a3b8;
      }
    }
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
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

/* 用户卡片样式 */
.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;
  margin-bottom: 12px;

  &:hover {
    background: #f3f4f6;
  }

  &.selected {
    background: #eff6ff;
  }

  .user-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 12px;
  }

  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-left: 8px;
    margin-right: 8px;
    text-align: left;

    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
      text-align: left;
    }

    .user-department {
      font-size: 11px;
      color: #6b7280;
      font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
      background: transparent;
      padding: 0;
      border-radius: 0;
      text-align: left;
    }
  }

  .remove-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
      transform: scale(1.1);
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

/* 树形控件样式 */
.org-tree {
  :deep(.el-tree-node) {
    .el-tree-node__content {
      padding: 8px 0;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: #f1f5f9;
      }
    }

    .el-tree-node__label {
      font-size: 13px;
      color: #374151;
    }

    .el-tree-node__expand-icon {
      color: #6b7280;
    }
  }
}
</style>
