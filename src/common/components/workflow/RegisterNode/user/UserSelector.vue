<template>
  <el-dialog
    v-model="visible"
    title="选择审批人员"
    :width="dialogWidth"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    class="approval-dialog"
    @close="handleClose"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="approval-header">
        <div class="header-icon">
          <el-icon size="20" color="#3b82f6">
            <UserFilled />
          </el-icon>
        </div>
        <div class="header-content">
          <h3 class="header-title">选择审批人员</h3>
          <p class="header-subtitle">从组织架构中选择需要参与审批的人员</p>
        </div>
      </div>
    </template>

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
        <div class="user-list">
          <div v-for="node in getSelectedNodes()" :key="node.id" class="user-card">
            <div class="user-avatar">
              <el-avatar :size="24" :style="{ backgroundColor: generateUserColor(node.name) }">
                {{ node.display_name?.charAt(0) || node.name?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="user-details">
              <span class="user-name">{{ node.display_name || node.name }}</span>
              <span class="user-dept">{{ node.department_name || "未知部门" }}</span>
            </div>
            <button class="remove-btn" @click="removeUserFromPreview(node)" title="移除">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="approval-footer">
        <el-button @click="handleCancel" class="footer-btn footer-btn-cancel" size="large"> 取消 </el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          class="footer-btn footer-btn-confirm"
          size="large"
          :disabled="selectedUsersCount === 0"
        >
          确认选择 ({{ selectedUsersCount }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from "vue"
import { ElTree } from "element-plus"
import { UserFilled, Search, Close } from "@element-plus/icons-vue"
import { userDepartmentCombination } from "@/api/user/types/user"
import { pipelineUserByDepartmentApi } from "@/api/user"

interface Props {
  modelValue: boolean
  defaultCheckedKeys?: number[]
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "confirm", users: Array<{ name: string; display_name: string; id: number }>): void
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
const visible = ref(false)
const filterInput = ref("")
const treeData = ref<userDepartmentCombination[]>([])
const checkedKeys = ref<string[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

// 计算属性
const selectedUsersCount = computed(() => getSelectedNodes().length)

// 响应式对话框宽度
const dialogWidth = computed(() => {
  if (window.innerWidth >= 1920) return "800px"
  if (window.innerWidth >= 1600) return "720px"
  if (window.innerWidth >= 1200) return "600px"
  return "90vw" // 小屏幕使用视口宽度
})

// 树形控件配置
const defaultProps = {
  children: "children",
  label: "display_name",
  disabled: (data: any) => data.type === "department" // 部门节点不可勾选
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    console.log("modelValue 变化:", newVal)
    visible.value = newVal
    if (newVal) {
      listDepartmentTreeData()
    }
  }
)

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

// 监听 visible 变化，同步到父组件
watch(visible, (newVal) => {
  emits("update:modelValue", newVal)
})

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

// 处理取消
const handleCancel = () => {
  visible.value = false
}

// 处理关闭
const handleClose = () => {
  visible.value = false
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
    visible.value = false
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
</script>

<style lang="scss" scoped>
/* 审批人员选择弹窗样式 */
.approval-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    margin: 5vh auto;
    max-height: 90vh !important;

    /* 响应式宽度和高度适配 */
    @media (max-width: 1199px) {
      width: 90vw !important;
      max-width: 90vw !important;
      height: 75vh !important;
      max-height: 75vh !important;
      margin: 2vh auto;
    }

    @media (min-width: 1200px) and (max-width: 1599px) {
      width: 600px !important;
      max-width: 600px !important;
      /* 保持默认高度，不需要滚动 */
    }

    @media (min-width: 1600px) and (max-width: 1919px) {
      width: 720px !important;
      max-width: 720px !important;
      /* 保持默认高度，不需要滚动 */
    }

    @media (min-width: 1920px) {
      width: 800px !important;
      max-width: 800px !important;
      /* 保持默认高度，不需要滚动 */
    }
  }

  :deep(.el-dialog__header) {
    padding: 0;
    border-bottom: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    /* 移除 max-height 限制，让对话框本身控制高度 */
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: none;
  }
}

.approval-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 16px 20px 14px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  }

  .header-content {
    flex: 1;

    .header-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
    }

    .header-subtitle {
      margin: 0;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
      line-height: 1.3;
    }
  }

  /* 小屏幕：减少高度 */
  @media (max-width: 1199px) {
    padding: 12px 16px 10px;
    gap: 10px;

    .header-icon {
      width: 28px;
      height: 28px;
    }

    .header-content {
      .header-title {
        font-size: 15px;
        margin: 0 0 3px 0;
      }

      .header-subtitle {
        font-size: 10px;
      }
    }
  }

  /* 大屏幕适配 */
  @media (min-width: 1200px) {
    padding: 20px 24px 18px;
    gap: 16px;

    .header-icon {
      width: 36px;
      height: 36px;
    }

    .header-content {
      .header-title {
        font-size: 18px;
        margin: 0 0 6px 0;
      }

      .header-subtitle {
        font-size: 12px;
        line-height: 1.4;
      }
    }
  }

  @media (min-width: 1600px) {
    padding: 24px 28px 20px;
    gap: 20px;

    .header-icon {
      width: 40px;
      height: 40px;
    }

    .header-content {
      .header-title {
        font-size: 20px;
        margin: 0 0 8px 0;
      }

      .header-subtitle {
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }

  @media (min-width: 1920px) {
    padding: 28px 32px 24px;
    gap: 24px;

    .header-icon {
      width: 44px;
      height: 44px;
    }

    .header-content {
      .header-title {
        font-size: 22px;
        margin: 0 0 10px 0;
      }

      .header-subtitle {
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }
}

.search-section {
  padding: 0px 20px 4px;
  border-bottom: 1px solid #e2e8f0;

  .search-container {
    .search-input {
      :deep(.el-input__wrapper) {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 6px 10px;
        height: 32px;
        transition: all 0.3s ease;

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 11px;
        color: #1e293b;
        font-weight: 500;
      }

      :deep(.el-input__prefix) {
        color: #64748b;
      }
    }
  }

  /* 小屏幕：减少高度和间距 */
  @media (max-width: 1199px) {
    padding: 0px 16px 1px;

    .search-container .search-input :deep(.el-input__wrapper) {
      height: 24px;
      padding: 2px 6px;
    }

    .search-container .search-input :deep(.el-input__inner) {
      font-size: 10px;
    }
  }

  /* 大屏幕适配 */
  @media (min-width: 1200px) {
    padding: 0px 24px 6px;

    .search-container .search-input :deep(.el-input__wrapper) {
      height: 36px;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .search-container .search-input :deep(.el-input__inner) {
      font-size: 12px;
    }
  }

  @media (min-width: 1600px) {
    padding: 0px 28px 8px;

    .search-container .search-input :deep(.el-input__wrapper) {
      height: 40px;
      padding: 10px 14px;
      border-radius: 8px;
    }

    .search-container .search-input :deep(.el-input__inner) {
      font-size: 13px;
    }
  }

  @media (min-width: 1920px) {
    padding: 0px 32px 10px;

    .search-container .search-input :deep(.el-input__wrapper) {
      height: 44px;
      padding: 12px 16px;
      border-radius: 10px;
    }

    .search-container .search-input :deep(.el-input__inner) {
      font-size: 14px;
    }
  }
}

/* 主要内容区域 */
.content-wrapper {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 0;

  /* 小屏幕：上下布局，减少高度和间距，合理分配空间 */
  @media (max-width: 1199px) {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    height: calc(75vh - 200px); /* 减去头部、搜索、底部的高度 */
  }

  /* 中等屏幕及以上：保持舒适布局，不需要固定高度 */
  @media (min-width: 1200px) {
    flex-direction: row;
    height: auto;
  }
}

/* 左侧：组织架构面板 */
.org-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 右侧：已选择人员面板 */
.selection-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0; /* 防止头部被压缩 */

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .selection-count {
    font-size: 12px;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 500;
  }

  /* 小屏幕：减少高度和字体大小 */
  @media (max-width: 1199px) {
    padding: 6px 10px;

    .panel-title {
      font-size: 13px;
    }

    .selection-count {
      font-size: 9px;
      padding: 1px 6px;
    }
  }

  /* 中等屏幕及以上：保持舒适设置 */
  @media (min-width: 1200px) {
    padding: 16px 20px;

    .panel-title {
      font-size: 16px;
    }

    .selection-count {
      font-size: 12px;
      padding: 4px 12px;
    }
  }
}

/* 内容区域通用样式 */
.content-area {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;

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

  /* 小屏幕：根据对话框高度调整内容区域高度 */
  @media (max-width: 1199px) {
    max-height: 180px;
    padding: 8px;
  }

  /* 中等屏幕 */
  @media (min-width: 1200px) and (max-width: 1599px) {
    max-height: 250px;
    padding: 12px;
  }

  /* 大屏幕 */
  @media (min-width: 1600px) and (max-width: 1919px) {
    max-height: 300px;
    padding: 14px;
  }

  /* 超大屏幕 */
  @media (min-width: 1920px) {
    max-height: 350px;
    padding: 16px;
  }
}

/* 树形包装器 */
.tree-wrapper {
  @extend .content-area;
  flex: 1; /* 占用剩余空间 */
  min-height: 0; /* 允许收缩 */

  .org-tree {
    :deep(.el-tree-node) {
      .el-tree-node__content {
        padding: 8px 0;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(59, 130, 246, 0.05);
        }
      }

      .el-tree-node__label {
        font-size: 13px;
        color: #374151;
        font-weight: 500;
      }

      .el-checkbox {
        margin-right: 8px;
      }
    }

    /* 小屏幕：减少树节点间距 */
    @media (max-width: 1199px) {
      :deep(.el-tree-node) {
        .el-tree-node__content {
          padding: 3px 0;
        }

        .el-tree-node__label {
          font-size: 11px;
        }
      }
    }

    /* 中等屏幕及以上：保持舒适设置 */
    @media (min-width: 1200px) {
      :deep(.el-tree-node) {
        .el-tree-node__content {
          padding: 8px 0;
        }

        .el-tree-node__label {
          font-size: 13px;
        }
      }
    }
  }
}

/* 用户列表 */
.user-list {
  @extend .content-area;
  flex: 1; /* 占用剩余空间 */
  min-height: 0; /* 允许收缩 */
  display: flex;
  flex-direction: column;
  gap: 12px;

  .user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;

    &:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      transform: translateY(-1px);
    }

    .user-avatar {
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      .user-dept {
        font-size: 12px;
        color: #64748b;
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

  /* 小屏幕：减少用户卡片间距和高度 */
  @media (max-width: 1199px) {
    gap: 6px;

    .user-card {
      padding: 6px;
      gap: 6px;

      .user-avatar {
        :deep(.el-avatar) {
          width: 18px !important;
          height: 18px !important;
        }
      }

      .user-details {
        .user-name {
          font-size: 12px;
        }

        .user-dept {
          font-size: 10px;
        }
      }

      .remove-btn {
        width: 20px;
        height: 20px;

        .el-icon {
          font-size: 10px;
        }
      }
    }
  }

  /* 中等屏幕及以上：保持舒适设置 */
  @media (min-width: 1200px) {
    gap: 12px;

    .user-card {
      padding: 12px;
      gap: 12px;

      .user-avatar {
        :deep(.el-avatar) {
          width: 24px !important;
          height: 24px !important;
        }
      }

      .user-details {
        .user-name {
          font-size: 14px;
        }

        .user-dept {
          font-size: 12px;
        }
      }

      .remove-btn {
        width: 28px;
        height: 28px;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
}

.approval-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  .footer-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 12px;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    min-width: 90px;

    &:hover {
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  /* 小屏幕：减少高度和字体大小 */
  @media (max-width: 1199px) {
    padding: 8px 12px;
    gap: 6px;

    .footer-btn {
      padding: 4px 12px;
      font-size: 10px;
      min-width: 70px;
      border-width: 1px;
    }
  }

  .footer-btn-cancel {
    background: white;
    color: #64748b;
    border-color: #e2e8f0;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }
  }

  .footer-btn-confirm {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-color: #3b82f6;

    &:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      border-color: #1d4ed8;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  /* 大屏幕适配 */
  @media (min-width: 1200px) {
    padding: 14px 24px;
    gap: 10px;

    .footer-btn {
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      min-width: 100px;
    }
  }

  @media (min-width: 1600px) {
    padding: 16px 28px;
    gap: 12px;

    .footer-btn {
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      min-width: 110px;
    }
  }

  @media (min-width: 1920px) {
    padding: 18px 32px;
    gap: 14px;

    .footer-btn {
      padding: 14px 22px;
      border-radius: 12px;
      font-size: 15px;
      min-width: 120px;
    }
  }
}
</style>
