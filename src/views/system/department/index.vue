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
      <div class="department-panel">
        <!-- 固定操作按钮区域，防止被树形菜单挤压 -->
        <el-card class="department-actions-fixed">
          <div class="action-buttons">
            <el-button type="primary" @click="addDepartment">添加部门</el-button>
            <el-button type="primary" :disabled="!currentNodeKey" @click="addSubMenu">添加子部门</el-button>
            <el-button type="primary" @click="handleCheckedTreeExpand">
              {{ isExpand ? "全部收起" : "全部展开" }}
            </el-button>
          </div>
        </el-card>

        <!-- 搜索框独立区域 -->
        <div class="search-section">
          <el-input v-model="filterInput" size="default" placeholder="输入部门名称搜索" :suffix-icon="Search" />
        </div>

        <!-- 树形菜单区域优化高度计算 -->
        <el-card class="department-tree-container">
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
          />
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="department-details">
        <el-card>
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
import { Search, Edit, Delete, RefreshRight } from "@element-plus/icons-vue"
import DepartmentForm from "./form.vue"
import Tip from "./tip.vue"
import User from "./user.vue"
import { ElMessage, ElMessageBox, ElTree, TabsPaneContext } from "element-plus"
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
  background-color: #f5f7fa;
  overflow: hidden; /* 防止整个容器被撑开 */
}

/* 按钮样式 */
.action-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.refresh-btn {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}

.content {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
  position: relative; /* 确保定位上下文 */
}

.department-panel {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  min-height: 0; /* 重要：允许flex子项收缩 */
}

.department-actions-fixed {
  flex: 0 0 80px;
  height: 80px;
  min-height: 80px !important;
  max-height: 80px;

  :deep(.el-card__body) {
    padding: 12px;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;

    .el-button {
      flex: 1;
      min-width: 100px;
    }
  }
}

.search-section {
  flex: 0 0 40px;
  height: 40px;
  min-height: 40px !important;
  max-height: 40px;
  padding: 0 4px;
}

.department-tree-container {
  flex: 1;
  min-height: 0;
  height: calc(100% - 80px - 40px - 32px); /* 总高度减去按钮区域、搜索区域和gap */
  max-height: calc(100% - 80px - 40px - 32px);
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 12px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .el-tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    height: 100%;
    overscroll-behavior: contain; /* 阻止滚动事件冒泡到页面 */

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;

      &:hover {
        background: #a8a8a8;
      }
    }

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: 36px;
        padding: 0 8px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background-color: #f3f4f6;
        }
      }

      &.is-current > .el-tree-node__content {
        background-color: #e1f5fe;
        color: #0277bd;
      }
    }
  }
}

.department-details {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  min-height: 0; /* 重要：允许flex子项收缩 */

  :deep(.el-card) {
    height: 100%;

    .el-card__body {
      height: 100%;
      overflow-y: auto;
      overscroll-behavior: contain; /* 确保右侧区域滚动独立 */
    }
  }
}

.form-bottom {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;

  .el-form-item {
    margin-bottom: 0;

    .el-button {
      min-width: 80px;
    }
  }
}

@media (max-width: 1200px) {
  .department-panel {
    flex: 0 0 300px;
  }

  .department-actions-fixed .action-buttons .el-button {
    min-width: 80px;
    font-size: 12px;
  }
}

.department-actions-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;

  .action-btn {
    min-width: 100px;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    &.el-button--primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border: none;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        transform: translateY(-1px);
      }
    }

    &.el-button--danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);

      &:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
        transform: translateY(-1px);
      }
    }
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    gap: 16px;
  }

  .department-panel {
    flex: none;
    height: 400px;
  }

  .department-details {
    flex: 1;
  }

  .department-actions-bottom {
    flex-direction: column;
    gap: 8px;

    .action-btn {
      width: 100%;
      min-width: auto;
    }
  }
}
</style>
