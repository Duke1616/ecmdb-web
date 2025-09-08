<template>
  <div class="role-manager">
    <!-- 主内容区域 -->
    <div class="manager-content">
      <!-- 头部区域 -->
      <div class="manager-header">
        <div class="header-left">
          <h2 class="manager-title">角色管理</h2>
          <p class="manager-subtitle">管理系统角色和权限分配</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handleAddRole"> 新增角色 </el-button>
          <el-button type="danger" :icon="Delete" class="action-btn danger" @click="handleBatchDelete">
            批量删除
          </el-button>
          <el-tooltip content="刷新数据">
            <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
          </el-tooltip>
        </div>
      </div>

      <div class="content-card">
        <!-- 表格区域 -->
        <div class="table-container">
          <DataTable
            :data="rolesData"
            :columns="tableColumns"
            :actions="tableActions"
            :show-selection="true"
            :show-pagination="true"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            :page-sizes="paginationData.pageSizes"
            :pagination-layout="paginationData.layout"
            :table-props="{}"
            @action="handleTableAction"
            @selection-change="handleSelectionChange"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          >
            <!-- 角色名称插槽 -->
            <template #roleName="{ row }">
              <div class="role-name">
                <el-icon class="role-icon"><User /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>

            <!-- 角色编码插槽 -->
            <template #roleCode="{ row }">
              <el-tag type="info" effect="plain" class="code-tag">{{ row.code }}</el-tag>
            </template>

            <!-- 角色状态插槽 -->
            <template #roleStatus="{ row }">
              <el-tag v-if="row.status === true" type="success" effect="dark" class="status-tag">
                <el-icon><Check /></el-icon>
                启用
              </el-tag>
              <el-tag v-if="row.status === false" type="danger" effect="dark" class="status-tag">
                <el-icon><Close /></el-icon>
                禁用
              </el-tag>
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      class="role-dialog"
      :show-close="false"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <createOrUpdate ref="apiRef" @list-roles="listRolesData" @close="handleCloseDialog" />
    </el-dialog>

    <!-- 菜单权限分配对话框 -->
    <el-dialog
      v-model="dialogPermission"
      width="60%"
      class="permission-dialog"
      :show-close="false"
      :close-on-click-modal="false"
      @closed="closeMenePermission"
    >
      <MenuPermission ref="menuRef" @confirm="handleMenuPermissionConfirm" @cancel="closeMenePermission" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listRolesApi } from "@/api/role"
import { changeRoleMenuPermissionApi } from "@/api/permission"
import { role } from "@/api/role/types/role"
import { CirclePlus, RefreshRight, Delete, User, Check, Close, Edit, Menu } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import createOrUpdate from "./createOrUpdate.vue"
import MenuPermission from "./menu.vue"
import DataTable from "@@/components/DataTable/index.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogPermission = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof createOrUpdate>>()
const menuRef = ref<InstanceType<typeof MenuPermission>>()
const roleCode = ref<string>("")
const rolesData = ref<role[]>([])

const tableColumns = [
  {
    prop: "name",
    label: "角色名称",
    minWidth: 120,
    slot: "roleName"
  },
  {
    prop: "code",
    label: "角色编码",
    minWidth: 120,
    slot: "roleCode"
  },
  {
    prop: "status",
    label: "角色状态",
    width: 100,
    slot: "roleStatus"
  },
  {
    prop: "description",
    label: "描述",
    minWidth: 200,
    showOverflowTooltip: true
  }
]

const tableActions = [
  {
    key: "edit",
    label: "修改",
    type: "primary" as const,
    icon: Edit
  },
  {
    key: "menu",
    label: "菜单权限",
    type: "success" as const,
    icon: Menu
  },
  {
    key: "delete",
    label: "删除",
    type: "danger" as const,
    icon: Delete
  }
]

const handleAddRole = () => {
  dialogVisible.value = true
}

const handleBatchDelete = () => {
  // 批量删除逻辑
}

const handleRefresh = () => {
  listRolesData()
}

const handleCloseDialog = () => {
  dialogVisible.value = false
}

const closeMenePermission = () => {
  dialogPermission.value = false
}

const handleUpdate = (row: role) => {
  isEditMode.value = true
  dialogVisible.value = true

  nextTick(() => {
    apiRef.value?.setFrom(row)
  })
}

const handleMenuPermissionConfirm = async (selectedMenus: any[]) => {
  try {
    console.log("确认分配菜单权限:", selectedMenus)

    const selectedMenuIds = selectedMenus.map((menu) => menu.id)
    const { data } = await changeRoleMenuPermissionApi(selectedMenuIds, roleCode.value)

    if (data) {
      ElMessage.success("菜单权限分配成功")
      closeMenePermission()
      listRolesData()
    }
  } catch (error) {
    console.error("保存菜单权限失败:", error)
    ElMessage.error("菜单权限分配失败")
  }
}

const handleMenuPermission = (row: role) => {
  dialogPermission.value = true
  roleCode.value = row.code

  nextTick(() => {
    menuRef.value?.getMenuPermissionData(roleCode.value)
  })
}

const handleDeleteSingle = async (row: role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    ElMessage.success("删除成功")
    listRolesData()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

const handleTableAction = (key: string, row: role) => {
  switch (key) {
    case "edit":
      handleUpdate(row)
      break
    case "menu":
      handleMenuPermission(row)
      break
    case "delete":
      handleDeleteSingle(row)
      break
  }
}

const handleSelectionChange = (selection: any[]) => {
  console.log("选中的行:", selection)
}

const resetForm = () => {
  apiRef.value?.resetForm()
  isEditMode.value = false
}

const listRolesData = () => {
  listRolesApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      rolesData.value = data.roles
    })
    .catch(() => {
      rolesData.value = []
    })
    .finally(() => {})
}

watch([() => paginationData.currentPage, () => paginationData.pageSize], listRolesData, { immediate: true })
</script>

<style lang="scss" scoped>
/* 角色管理器容器 */
.role-manager {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用视口高度确保全屏布局 */
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden; /* 防止整体页面滚动 */
}

/* 头部区域 */
.manager-header {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 确保头部不会被压缩 */
  min-height: 70px;
  margin-bottom: 20px; /* 调整边距 */

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .manager-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    .manager-subtitle {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 400;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    height: 36px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.danger {
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    }
  }

  .refresh-btn {
    width: 36px;
    height: 36px;
    transition: all 0.3s ease;

    &:hover {
      transform: rotate(180deg) translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
}

/* 主内容区域 */
.manager-content {
  flex: 1; /* 占据剩余空间 */
  padding: 20px 24px 24px 24px; /* 调整内边距 */
  display: flex; /* 添加flex布局 */
  flex-direction: column; /* 垂直布局 */
  min-height: 0; /* 允许flex收缩 */
  overflow: hidden; /* 防止内容区域滚动 */
}

.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1; /* 占据剩余空间 */
  min-height: 0; /* 允许flex收缩 */
}

/* 表格容器 */
.table-container {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex收缩 */
  overflow: hidden; /* 防止容器滚动 */
}

/* 对话框样式 */
.role-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }
}

.permission-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .role-manager {
    height: 100vh; /* 移动端也使用全屏高度 */
  }

  .manager-header {
    margin-bottom: 16px; /* 移动端调整边距 */
    padding: 16px 20px;

    .header-left {
      .manager-title {
        font-size: 16px;
      }

      .manager-subtitle {
        font-size: 12px;
      }
    }

    .header-right {
      gap: 8px;

      .action-btn {
        height: 32px;
        font-size: 12px;
        padding: 0 12px;
      }

      .refresh-btn {
        width: 32px;
        height: 32px;
      }
    }
  }

  .manager-content {
    padding: 16px 16px 16px 16px; /* 移动端调整内边距 */
  }

  .table-container {
    padding: 16px 0; /* 移动端调整表格容器内边距 */
  }
}
</style>
