<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="部门管理" subtitle="管理系统部门和人员组织架构" @refresh="handleRefresh">
      <template #actions>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <div class="content">
      <!-- 左侧面板 - 只在有数据时显示 -->
      <div class="department-panel">
        <el-card class="department-card">
          <!-- 操作按钮区域 -->
          <div class="card-header">
            <div class="header-top">
              <h3 class="card-title">部门列表</h3>
              <span class="department-count">{{ departmentCount }} 个部门</span>
            </div>

            <div class="header-actions">
              <el-input
                v-model="filterInput"
                placeholder="搜索部门..."
                :prefix-icon="Search"
                class="search-input"
                clearable
              />
              <div class="action-buttons">
                <el-button size="small" type="primary" @click="addDepartment" :icon="Plus"> 添加部门 </el-button>
                <el-button
                  size="small"
                  :disabled="!currentNodeKey"
                  @click="handleCreateSubDepartment"
                  :icon="FolderAdd"
                >
                  添加子部门
                </el-button>
                <el-button size="small" @click="handleToggleExpand" :icon="isExpand ? FolderOpened : Folder">
                  {{ isExpand ? "收起" : "展开" }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 树形菜单区域 -->
          <div class="tree-container">
            <el-scrollbar class="tree-scrollbar">
              <!-- 当有数据时显示树形结构 -->
              <el-tree
                v-if="departmentCount > 0"
                ref="treeRef"
                :data="treeData"
                show-checkbox
                node-key="id"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
                :current-node-key="currentNodeKey || undefined"
                :props="defaultProps"
                :filter-node-method="filterNode"
                class="department-tree"
              />
              <!-- 当没有数据时显示空状态 -->
              <div v-else class="empty-tree-state">
                <el-icon class="empty-icon" size="48">
                  <FolderOpened />
                </el-icon>
                <p class="empty-text">暂无部门数据</p>
                <p class="empty-hint">点击上方"添加部门"按钮创建第一个部门</p>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="department-details">
        <div v-if="empty" class="department-content-wrapper">
          <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="department-tabs">
            <template #default="{ activeTab }">
              <DepartmentForm
                v-if="activeTab === 'detail'"
                ref="departmentUpdateRef"
                :departmentData="treeData"
                @listDepartmentTreeData="refreshDepartmentData"
              />
              <User v-if="activeTab === 'user'" ref="userRef" :departmentId="currentNodeKey || 0" />
            </template>
          </CustomTabs>
          <div v-if="activeName === 'detail'" class="department-actions-footer">
            <el-button type="primary" @click="handleUpdate">
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
        <div v-else class="department-empty">
          <Tip :empty="empty" />
        </div>
      </div>
    </div>

    <!-- 添加部门对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="添加部门"
      subtitle="创建新的部门"
      height="80vh"
      header-icon="Plus"
      confirm-text="确认"
      cancel-text="取消"
      @confirm="handleCreate"
      @cancel="handleCloseDialog"
      @closed="handleCloseDialog"
    >
      <div class="form-content">
        <DepartmentForm
          ref="departmentCreateRef"
          :departmentData="treeData"
          @listDepartmentTreeData="refreshDepartmentData"
          @closed="handleCloseDialog"
        />
      </div>
    </FormDialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watch, computed } from "vue"
import { Search, Edit, Delete, RefreshRight, Plus, FolderAdd, FolderOpened, Folder } from "@element-plus/icons-vue"
import DepartmentForm from "./form.vue"
import Tip from "./tip.vue"
import User from "./user.vue"
import { ElMessage, ElMessageBox, ElTree, ElScrollbar } from "element-plus"
import { deleteDepartmentApi, listDepartmentTreeApi } from "@/api/department"
import { department } from "@/api/department/types/department"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import PageContainer from "@/common/components/PageContainer/index.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"

const filterInput = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

// 状态管理
const empty = ref<boolean>(false)
const treeRef = ref<InstanceType<typeof ElTree>>() as any
const departmentCreateRef = ref<InstanceType<typeof DepartmentForm>>()
const departmentUpdateRef = ref<InstanceType<typeof DepartmentForm>>()
const userRef = ref<InstanceType<typeof User>>()

// 部门操作
const handleUpdate = () => {
  departmentUpdateRef.value?.submitUpdateForm()
}

const handleDelete = () => {
  if (!currentNodeKey.value) return

  const node = findDepartmentById(treeData.value, currentNodeKey.value)
  if (!node) return

  ElMessageBox({
    title: "删除确认",
    message: `确定要删除部门 "${node.name}" 吗？`,
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDepartmentApi(currentNodeKey.value!).then(() => {
      ElMessage.success("删除成功")
      isExpand.value = false

      // 清空当前选中状态，显示空状态
      currentNodeKey.value = null
      empty.value = false

      refreshDepartmentData()
    })
  })
}

const handleCreate = () => {
  departmentCreateRef.value?.submitCreateForm()
}

const handleCreateSubDepartment = () => {
  if (!currentNodeKey.value) {
    ElMessage.warning("请先选择一个部门")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    departmentCreateRef.value?.resetForm()
    departmentCreateRef.value?.setFromForPid(currentNodeKey.value!)
  })
}

const handleCloseDialog = (id?: number) => {
  dialogVisible.value = false
  if (id) {
    currentNodeKey.value = id
  }
}

const handleRefresh = () => {
  refreshDepartmentData()
  ElMessage.success("数据已刷新")
}

// 当前选中的部门节点
const currentNodeKey = ref<number | null>(null)

// 处理部门节点点击
const handleNodeClick = async (node: department) => {
  activeName.value = "detail"

  if (currentNodeKey.value === node.id) {
    // 取消选中
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 选中节点
    currentNodeKey.value = node.id
    empty.value = true

    await nextTick()
    loadDepartmentData(node)
  }
}

// 加载部门数据到表单
const loadDepartmentData = (node: department) => {
  if (!node) return

  // 设置部门数据到更新表单
  departmentUpdateRef.value?.setDepartmentData(node)
}

interface Tree {
  [key: string]: any
}

// 搜索过滤
const filterNode = (value: string, data: Tree) => {
  if (!value) return true
  return typeof data.name === "string" && data.name.includes(value)
}

// 部门树数据
const treeData = ref<department[]>([])

// 安全的部门数量计算
const departmentCount = computed(() => {
  return treeData.value?.length || 0
})

// 刷新部门数据
const refreshDepartmentData = async () => {
  try {
    const { data } = await listDepartmentTreeApi()
    // 确保 data 是数组，防止 null 或 undefined
    treeData.value = Array.isArray(data) ? data : []

    await nextTick()

    // 如果之前有选中的节点，重新选中并加载数据
    if (currentNodeKey.value && treeRef.value) {
      treeRef.value.setCurrentKey(currentNodeKey.value)
      const node = findDepartmentById(data, currentNodeKey.value)
      if (node) {
        loadDepartmentData(node)
      } else {
        // 如果节点不存在（被删除了），清空选中状态
        currentNodeKey.value = null
        empty.value = false
      }
    }
  } catch (error) {
    console.error("加载部门数据失败:", error)
    treeData.value = []
  }
}

// 查找部门节点
const findDepartmentById = (departments: department[], id: number): department | null => {
  for (const department of departments) {
    if (department.id === id) return department
    if (department.children?.length > 0) {
      const found = findDepartmentById(department.children, id)
      if (found) return found
    }
  }
  return null
}

// 展开/收起所有节点
const toggleAllNodes = (expanded: boolean) => {
  const nodes = treeRef.value?.store?.nodesMap
  if (!nodes) return

  const toggleRecursive = (departmentList: department[]) => {
    for (const department of departmentList) {
      if (nodes[department.id]) {
        nodes[department.id].expanded = expanded
      }
      if (department.children?.length > 0) {
        toggleRecursive(department.children)
      }
    }
  }

  toggleRecursive(treeData.value)
}

// 展开/收起状态
const isExpand = ref(false)

// 切换展开/收起
const handleToggleExpand = () => {
  isExpand.value = !isExpand.value
  toggleAllNodes(isExpand.value)
}

// 添加部门
const addDepartment = () => {
  dialogVisible.value = true
  nextTick(() => {
    departmentCreateRef.value?.resetForm()
  })
}

// 标签页管理
const activeName = ref("detail")

// 标签页配置
const tabs = [
  { name: "detail", label: "详情信息" },
  { name: "user", label: "用户列表" }
]

const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "user") {
    userRef.value?.listUsersData()
  }
}

// 搜索防抖
let searchTimer: NodeJS.Timeout | null = null
watch(filterInput, (val: string) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    treeRef.value?.filter(val)
  }, 300)
})

// 组件挂载时加载数据
onMounted(() => {
  refreshDepartmentData()
})
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex: 1;
  gap: calc(0.8rem + 0.2vw);
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 7.5rem);
  max-height: calc(100vh - 7.5rem);
  position: relative;
}

.department-panel {
  flex: 0 0 calc(19rem + 2vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.department-card {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: calc(0.4rem + 0.1vw);
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
}

.card-header {
  flex-shrink: 0;
  padding: calc(0.8rem + 0.2vw);
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: calc(0.6rem + 0.1vw);

    .card-title {
      margin: 0;
      font-size: calc(0.8rem + 0.1vw);
      font-weight: 600;
      color: #374151;
    }

    .department-count {
      background: #f3f4f6;
      color: #6b7280;
      padding: calc(0.1rem + 0.05vw) calc(0.4rem + 0.1vw);
      border-radius: calc(0.2rem + 0.05vw);
      font-size: calc(0.6rem + 0.1vw);
    }
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: calc(0.6rem + 0.1vw);

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: calc(0.3rem + 0.1vw);
        border: 1px solid #d1d5db;
        background: white;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      }

      :deep(.el-input__inner) {
        height: calc(1.6rem + 0.2vw);
        font-size: calc(0.7rem + 0.1vw);
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: calc(0.2rem + 0.05vw);
      width: 100%;

      .el-button {
        border-radius: calc(0.3rem + 0.1vw);
        font-size: calc(0.6rem + 0.1vw);
        padding: calc(0.3rem + 0.1vw) calc(0.4rem + 0.1vw);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.el-button--small {
          height: calc(1.4rem + 0.2vw);
          min-width: 0;
        }

        &:first-child {
          border-top-right-radius: calc(0.3rem + 0.1vw);
          border-bottom-right-radius: calc(0.3rem + 0.1vw);
        }

        &:last-child {
          border-top-left-radius: calc(0.3rem + 0.1vw);
          border-bottom-left-radius: calc(0.3rem + 0.1vw);
        }
      }
    }
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  padding: calc(0.6rem + 0.2vw);

  .tree-scrollbar {
    height: 100%;
  }

  .department-tree {
    height: 100%;

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: calc(1.8rem + 0.3vw);
        padding: 0 calc(0.6rem + 0.2vw);
        border-radius: calc(0.3rem + 0.1vw);
        margin-bottom: calc(0.1rem + 0.05vw);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;

        &:hover {
          background: #f9fafb;
        }
      }

      &.is-current > .el-tree-node__content {
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 500;
      }

      .el-tree-node__expand-icon {
        color: #9ca3af;
        font-size: calc(0.7rem + 0.1vw);
        margin-right: calc(0.4rem + 0.1vw);
      }

      .el-tree-node__label {
        font-size: calc(0.7rem + 0.1vw);
        color: #374151;
        font-weight: 500;
      }

      .el-checkbox {
        margin-right: calc(0.4rem + 0.1vw);
      }
    }
  }

  .empty-tree-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    padding: calc(1rem + 0.2vw);
    text-align: center;

    .empty-icon {
      color: #d1d5db;
      margin-bottom: calc(0.8rem + 0.2vw);
    }

    .empty-text {
      margin: 0 0 calc(0.4rem + 0.1vw) 0;
      font-size: calc(0.8rem + 0.1vw);
      font-weight: 500;
      color: #6b7280;
    }

    .empty-hint {
      margin: 0;
      font-size: calc(0.7rem + 0.1vw);
      color: #9ca3af;
      line-height: 1.4;
    }
  }
}

.department-details {
  flex: 1;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 部门内容包装器 - 参考 DataTable 布局 */
.department-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
}

/* 部门空状态 */
.department-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 部门操作底部 - 固定底部按钮 */
.department-actions-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: calc(0.8rem + 0.2vw);
  padding: calc(1rem + 0.3vw) calc(1.2rem + 0.3vw);
  margin-top: auto;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 calc(0.6rem + 0.1vw) calc(0.6rem + 0.1vw);

  .el-button {
    height: calc(2rem + 0.3vw);
    padding: 0 calc(1.2rem + 0.3vw);
    border-radius: calc(0.4rem + 0.1vw);
    font-size: calc(0.7rem + 0.1vw);
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(calc(-0.1rem + 0.05vw));
      box-shadow: 0 calc(0.2rem + 0.1vw) calc(0.6rem + 0.2vw) rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: calc(0.3rem + 0.1vw);
      font-size: calc(0.8rem + 0.1vw);
    }

    /* 修改按钮样式 */
    &[type="primary"] {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      }
    }

    /* 删除按钮样式 */
    &[type="danger"] {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
      }
    }
  }
}

.form-content {
  height: 60vh;
  overflow-y: auto;
  padding: calc(0.8rem + 0.2vw);
}

.custom-tabs {
  border-radius: 0;
}

// 部门标签页样式 - 参考 order 页面
.department-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>
