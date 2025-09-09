<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <ManagerHeader title="部门管理" subtitle="管理系统部门和人员组织架构" @refresh="handleRefresh">
      <template #actions>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <div class="content">
      <!-- 左侧面板 -->
      <div class="department-panel">
        <el-card class="department-card">
          <!-- 操作按钮区域 -->
          <div class="card-header">
            <div class="header-top">
              <h3 class="card-title">部门列表</h3>
              <span class="department-count">{{ treeData.length }} 个部门</span>
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
                <el-button size="small" :disabled="!currentNodeKey" @click="addSubMenu" :icon="FolderAdd">
                  添加子部门
                </el-button>
                <el-button size="small" @click="handleCheckedTreeExpand" :icon="isExpand ? FolderOpened : Folder">
                  {{ isExpand ? "收起" : "展开" }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 树形菜单区域 -->
          <div class="tree-container">
            <el-scrollbar class="tree-scrollbar">
              <el-tree
                ref="treeRef"
                :data="treeData"
                show-checkbox
                node-key="id"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
                :current-node-key="currentNodeKey"
                :props="defaultProps"
                :filter-node-method="filterNode"
                class="department-tree"
              />
            </el-scrollbar>
          </div>
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="department-details">
        <el-card class="details-card">
          <div v-if="empty">
            <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
              <el-tab-pane lazy label="详情信息" name="detail">
                <DepartmentForm
                  ref="departmentUpdateRef"
                  :departmentData="treeData"
                  @listDepartmentTreeData="listDepartmentTreeData"
                />
              </el-tab-pane>
              <el-tab-pane lazy label="用户列表" name="user">
                <User ref="userRef" :departmentId="currentNodeKey" />
              </el-tab-pane>
            </el-tabs>
            <div class="department-actions-bottom">
              <el-button type="primary" size="large" @click="handleUpdate" class="action-btn">
                <el-icon><Edit /></el-icon>
                修改
              </el-button>
              <el-button type="danger" size="large" @click="handleDelete" class="action-btn">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
          <div>
            <Tip :empty="empty" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加部门 dialog 展示 -->
    <div>
      <el-dialog v-model="dialogVisible" title="添加部门" @closed="resetForm">
        <DepartmentForm
          style="max-height: 60vh; overflow-y: auto"
          ref="departmentCreateRef"
          :departmentData="treeData"
          @listDepartmentTreeData="listDepartmentTreeData"
          @closed="onClosed"
        />
        <template #footer>
          <el-button @click="resetForm">取消</el-button>
          <el-button type="primary" @click="handlerCreate">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, nextTick, onMounted, ref, watch } from "vue"
import { Search, Edit, Delete, RefreshRight, Plus, FolderAdd, FolderOpened, Folder } from "@element-plus/icons-vue"
import DepartmentForm from "./form.vue"
import Tip from "./tip.vue"
import User from "./user.vue"
import { ElMessage, ElMessageBox, ElTree, TabsPaneContext, ElScrollbar } from "element-plus"
import { deleteDepartmentApi, listDepartmentTreeApi } from "@/api/department"
import { department } from "@/api/department/types/department"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"

const filterInput = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

const empty = ref<boolean>(false)
const treeRef = ref<InstanceType<typeof ElTree>>() as any
const departmentCreateRef = ref<InstanceType<typeof DepartmentForm>>()
const departmentUpdateRef = ref<InstanceType<typeof DepartmentForm>>()
const userRef = ref<InstanceType<typeof User>>()
const handleUpdate = () => {
  departmentUpdateRef.value?.submitUpdateForm()
}

const addDepartment = async () => {
  dialogVisible.value = true
  await nextTick(() => {
    departmentCreateRef.value?.resetForm()
  })
}

const handleRefresh = () => {
  listDepartmentTreeData()
  ElMessage.success("数据已刷新")
}

const handlerCreate = () => {
  departmentCreateRef.value?.submitCreateForm()
}

const onClosed = (id: number) => {
  // 关闭弹窗
  dialogVisible.value = false

  // 避免触发 update 获取逻辑
  currentNodeKey.value = id
  empty.value = true
}

const resetForm = () => {
  dialogVisible.value = false
}

const currentNodeKey = ref<any>(null)
const handleNodeClick = async (node: department) => {
  activeName.value = "detail"
  if (currentNodeKey.value === node.id) {
    // 如果点击的节点已经是当前高亮节点，则取消高亮
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 否则设置当前点击的节点为高亮
    currentNodeKey.value = node.id
    empty.value = true

    await nextTick(() => {
      updateDepartmentData(node)
    })
  }
}

const updateDepartmentData = (node: department | null) => {
  if (node === null) {
    return
  }

  departmentUpdateRef.value?.setDepartmentData(node)
}

interface Tree {
  [key: string]: any
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true

  // 确保data.label存在且是字符串
  return typeof data.meta.title === "string" && data.meta.title.includes(value)
}

/** 查询模版列表 */
const treeData = ref<department[]>([])
const listDepartmentTreeData = () => {
  listDepartmentTreeApi()
    .then(async ({ data }) => {
      if (data.length === 0) {
        return
      }

      treeData.value = data

      await nextTick(() => {
        if (currentNodeKey.value) {
          treeRef.value!.setCurrentKey(currentNodeKey.value)
          const node = findDepartmentById(data, currentNodeKey.value)
          updateDepartmentData(node)
          return
        }
      })
    })
    .catch(() => {
      treeData.value = []
    })
    .finally(() => {})
}

const handleDelete = () => {
  const node = findDepartmentById(treeData.value, currentNodeKey.value)
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除部门: "),
      h("i", { style: "color: red" }, `${node?.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDepartmentApi(currentNodeKey.value).then(() => {
      ElMessage.success("删除成功")
      isExpand.value = false
      listDepartmentTreeData()

      if (treeData.value.length === 1) {
        empty.value = false
        currentNodeKey.value = null
      }
    })
  })
}

const findDepartmentById = (departments: department[], id: number): department | null => {
  for (const department of departments) {
    if (department.id === id) {
      return department
    }

    if (department.children.length > 0) {
      const found = findDepartmentById(department.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

const recursionFn = (arr: department[]) => {
  const nodes = treeRef.value?.store?.nodesMap
  if (arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.children?.length > 0) {
        nodes[arr[i].id].expanded = isExpand.value
        recursionFn(arr[i]?.children)
      }
    }
  }
}

const isExpand = ref(false)
const handleCheckedTreeExpand = () => {
  isExpand.value = !isExpand.value
  const treeList = treeData.value
  recursionFn(treeList)
}

const addSubMenu = async () => {
  dialogVisible.value = true
  await nextTick()
  departmentCreateRef.value?.resetForm()

  // 插入特性数据
  departmentCreateRef.value?.setFromForPid(currentNodeKey.value)
}

const activeName = ref("detail")
const handleClick = (tab: TabsPaneContext) => {
  if (tab.paneName === "detail") {
    console.log("detail")
  } else if (tab.paneName === "user") {
    userRef.value?.listUsersData()
  }
}

onMounted(() => {
  listDepartmentTreeData()
})

watch(filterInput, (val: string) => {
  treeRef.value!.filter(val)
})
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  overflow: hidden;
}

.content {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
  position: relative;
}

.department-panel {
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.department-card {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;

  :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .department-count {
      background: #f3f4f6;
      color: #6b7280;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 6px;
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
        height: 32px;
        font-size: 14px;
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      width: 100%;

      .el-button {
        border-radius: 6px;
        font-size: 12px;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.el-button--small {
          height: 28px;
          min-width: 0;
        }

        &:first-child {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        &:last-child {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
        }
      }
    }
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  padding: 8px;

  .tree-scrollbar {
    height: 100%;
  }

  .department-tree {
    height: 100%;

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: 32px;
        padding: 0 8px;
        border-radius: 4px;
        margin-bottom: 1px;
        transition: background-color 0.2s;

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
        font-size: 12px;
      }
    }
  }
}

.department-details {
  flex: 1;
  overflow: hidden;
  height: 100%;

  .details-card {
    height: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;

    :deep(.el-card__body) {
      height: 100%;
      overflow-y: auto;
    }
  }
}

@media (max-width: 1200px) {
  .department-panel {
    flex: 0 0 320px;
  }
}

.department-actions-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;

  .el-button {
    border-radius: 6px;
    font-weight: 500;

    .el-icon {
      margin-right: 4px;
    }
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    gap: 12px;
  }

  .department-panel {
    flex: none;
    height: 400px;
  }

  .card-header .header-actions .action-buttons {
    grid-template-columns: 1fr;
    gap: 4px;

    .el-button {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
