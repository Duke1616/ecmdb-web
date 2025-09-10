<template>
  <div class="role-manager">
    <!-- 头部区域 -->
    <ManagerHeader
      title="角色管理"
      subtitle="管理系统角色和权限分配"
      add-button-text="新增角色"
      @add="handleAddRole"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" class="action-btn" @click="handleAddRole"> 新增角色 </el-button>
        <el-button type="danger" :icon="Delete" class="action-btn danger" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="rolesData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 角色名称插槽 -->
      <template #roleName="{ row }">
        <div class="role-name">
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

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 新增/编辑角色对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑角色' : '新增角色'"
      :subtitle="isEditMode ? '修改角色信息' : '创建新的角色'"
      width="500px"
      @closed="resetForm"
      @confirm="handleFormConfirm"
      @cancel="handleCloseDialog"
    >
      <Form ref="apiRef" @list-roles="listRolesData" @close="handleCloseDialog" />
    </FormDialog>

    <!-- 菜单权限分配对话框 -->
    <FormDialog
      v-model="dialogPermission"
      title="菜单权限分配"
      subtitle="为角色分配相应的菜单访问权限"
      header-icon="Menu"
      confirm-text="确认分配"
      :show-footer-info="false"
      @closed="closeMenePermission"
      @confirm="handlePermissionConfirm"
      @cancel="closeMenePermission"
    >
      <MenuPermission ref="menuRef" @confirm="handleMenuPermissionConfirm" @cancel="closeMenePermission" />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listRolesApi } from "@/api/role"
import { changeRoleMenuPermissionApi } from "@/api/permission"
import { role } from "@/api/role/types/role"
import { Delete, Check, Close, Edit, Menu, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import Form from "./form.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import MenuPermission from "./menu.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { FormDialog } from "@@/components/Dialogs"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogPermission = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof Form>>()
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
    width: 120,
    slot: "roleStatus"
  },
  {
    prop: "description",
    label: "描述",
    minWidth: 200,
    showOverflowTooltip: true
  }
]

// 操作按钮配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit },
  { name: "菜单权限", code: "menu", type: "success", icon: Menu },
  { name: "删除", code: "delete", type: "danger", icon: Delete }
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

const handleFormConfirm = () => {
  apiRef.value?.submitForm()
}

const handlePermissionConfirm = () => {
  menuRef.value?.handleConfirm()
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

const handleOperateEvent = (operateItem: role, actionName: string) => {
  switch (actionName) {
    case "edit":
      handleUpdate(operateItem)
      break
    case "menu":
      handleMenuPermission(operateItem)
      break
    case "delete":
      handleDeleteSingle(operateItem)
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
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
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

  &.danger {
    background: #ef4444;
    border-color: #ef4444;

    &:hover {
      background: #dc2626;
      border-color: #dc2626;
    }
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

/* 角色名称样式 */
.role-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .role-icon {
    color: #3b82f6;
  }
}

/* 标签样式 */
.code-tag,
.status-tag {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .role-manager {
    padding: 16px;
  }

  .manager-header {
    padding: 16px 20px;
    margin-bottom: 16px;

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
}
</style>
