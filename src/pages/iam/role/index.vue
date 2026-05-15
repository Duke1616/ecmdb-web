<template>
  <ProGovernanceLayout
    title="角色治理"
    subtitle="系统权限体系的核心载体，支持自定义与系统预设角色治理"
    search-placeholder="搜索角色名称或标识码..."
    v-model:keyword="query.keyword"
    :selection-count="selectedRows.length"
    :primary-action="{ capability: IAM_CAPABILITIES.Role.Add, label: '初始化角色' }"
    :danger-action="{ capability: IAM_CAPABILITIES.Role.BatchDelete, label: '批量删除' }"
    @search="handleRefresh"
    @refresh="handleRefresh"
    @primary-action="handleCreate"
    @danger-action="handleBatchDelete"
  >
    <!-- 治理列表 -->
    <DataTable ref="tableRef" v-bind="tableProps" :columns="tableColumns">
      <!-- 角色核心资产: 使用统一的资产单元组件 -->
      <template #role_info="{ row }">
        <AssetIdentityCell
          :title="row.name"
          :sub-title="row.code"
          :link-to="
            hasPermission(IAM_CAPABILITIES.Role.Detail) ? { name: 'RoleDetail', query: { code: row.code } } : undefined
          "
          centered
        />
      </template>

      <!-- 角色来源/类型: 极简指示器 -->
      <template #type="{ row }">
        <div class="type-indicator" :class="row.type === 1 ? 'is-system' : 'is-custom'">
          <span class="dot" />
          {{ row.type === 1 ? "系统预设" : "自定义角色" }}
        </div>
      </template>

      <!-- 角色职责描述: 降噪备注风格 -->
      <template #desc="{ row }">
        <span class="column-text">{{ row.desc || "--" }}</span>
      </template>

      <!-- 操作权限: 使用优化后的 OperateBtn -->
      <template #actions="{ row }">
        <OperateBtn :items="roleOperateItems" :operate-item="row" :max-length="3" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 角色表单弹窗 -->
    <FormDialog
      v-model="formVisible"
      :title="currentEditCode ? '治理角色资产' : '初始化角色定义'"
      :header-icon="Lock"
      width="640px"
      :confirm-loading="submitting"
      @confirm="handleConfirm"
      @cancel="formVisible = false"
    >
      <RoleForm
        :key="currentEditCode || 'new'"
        ref="roleFormRef"
        :code="currentEditCode!"
        :is-edit="!!currentEditCode"
        @success="handleFormSuccess"
      />
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Lock, Edit, Delete } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import RoleForm from "./components/RoleForm.vue"
import { useRoleList } from "./composables/useRoleList"
import type { Column } from "@@/components/DataTable/types"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Role } from "@/api/iam/role/type"

const { hasPermission } = usePermission()

const {
  roles,
  total,
  currentPage,
  pageSize,
  query,
  loading,
  formVisible,
  currentEditCode,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleBatchDelete,
  selectedRows,
  handleSelectionChange,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useRoleList()

const roleFormRef = ref<InstanceType<typeof RoleForm>>()
const tableRef = ref<InstanceType<typeof DataTable>>()
const submitting = ref(false)

/**
 * 打包表格通用属性，实现模板瘦身
 */
const tableProps = computed(() => ({
  loading: loading.value,
  data: roles.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  showPagination: true,
  showSelection: true,
  selectable: () => hasPermission(IAM_CAPABILITIES.Role.BatchDelete),
  tableProps: !hasPermission(IAM_CAPABILITIES.Role.BatchDelete) ? { class: "selection-disabled" } : {},
  onSelectionChange: handleSelectionChange,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

/**
 * 角色操作配置项
 */
const roleOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: IAM_CAPABILITIES.Role.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: IAM_CAPABILITIES.Role.Delete }
]

const handleOperate = (row: Role, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "delete") handleDelete(row)
}

const tableColumns: Column[] = [
  { label: "角色核心资产", prop: "name", slot: "role_info", minWidth: 200, align: "center" },
  { label: "角色来源/类型", prop: "type", slot: "type", width: 160, align: "center" },
  { label: "职责描述说明", prop: "desc", slot: "desc", minWidth: 400, align: "center" }
]

const handleConfirm = async () => {
  if (!roleFormRef.value) return
  submitting.value = true
  try {
    await roleFormRef.value.submit()
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
/* NOTE: 无批量删除权限时，禁用表头全选 Checkbox */
:deep(.selection-disabled) {
  .el-table__header-wrapper .el-checkbox {
    pointer-events: none;
    opacity: 0.4;
  }
}

.column-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.dual-line-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 0px;
  line-height: 1.2;

  .main-link,
  .main-title-static {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
    justify-content: center;
  }

  .main-link {
    color: #1e293b;
    &:hover {
      color: #3b82f6;
    }
  }

  .main-title-static {
    color: #1e293b;
    cursor: default;
  }

  .sub-detail {
    font-size: 11px;
    color: #94a3b8;
    &.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}

.type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
    flex-shrink: 0;
  }

  &.is-system {
    color: #b45309;
    .dot {
      background: #f59e0b;
    }
  }

  &.is-custom {
    color: #475569;
    .dot {
      background: #cbd5e1;
    }
  }
}
</style>
