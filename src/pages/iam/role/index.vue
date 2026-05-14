<template>
  <PageContainer>
    <!-- 头部治理区 -->
    <ManagerHeader
      title="角色治理"
      subtitle="系统权限体系的核心载体，支持自定义与系统预设角色治理"
      @refresh="handleRefresh"
    >
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 搜索治理 -->
          <div class="search-command-inner">
            <el-icon class="search-icon"><Search /></el-icon>
            <el-input
              v-model="query.keyword"
              placeholder="搜索角色名称或标识码..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            />
          </div>

          <!-- 动作组 -->
          <div class="action-group">
            <template v-if="selectedRows.length > 0">
              <el-button
                class="u-gov-btn is-danger is-large"
                :disabled="!hasPermission(IAM_CAPABILITIES.Role.BatchDelete)"
                @click="handleBatchDelete"
              >
                <el-icon><Delete /></el-icon>
                <span>批量注销 ({{ selectedRows.length }})</span>
              </el-button>
            </template>
            <template v-else>
              <el-button
                class="u-gov-btn is-large"
                :disabled="!hasPermission(IAM_CAPABILITIES.Role.Add)"
                @click="handleCreate"
              >
                <el-icon><Plus /></el-icon>
                <span>初始化角色</span>
              </el-button>
            </template>
            <el-button :icon="RefreshRight" class="eiam-refresh-btn" @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 治理列表 -->
    <DataTable
      ref="tableRef"
      v-loading="loading"
      :data="roles"
      @selection-change="handleSelectionChange"
      :columns="tableColumns"
      :show-selection="true"
      :selectable="() => hasPermission(IAM_CAPABILITIES.Role.BatchDelete)"
      :table-props="!hasPermission(IAM_CAPABILITIES.Role.BatchDelete) ? { class: 'selection-disabled' } : {}"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 角色核心资产: Dual-Line 风格 -->
      <template #role_info="{ row }">
        <div class="dual-line-info">
          <el-link
            v-if="hasPermission(IAM_CAPABILITIES.Role.Detail)"
            type="primary"
            :underline="false"
            class="main-link"
            @click="handleViewDetail(row)"
          >
            {{ row.name }}
          </el-link>
          <span v-else class="main-title-static">{{ row.name }}</span>
          <div class="sub-detail mono">{{ row.code }}</div>
        </div>
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { Search, Plus, RefreshRight, Lock, Edit, Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import RoleForm from "./components/RoleForm.vue"
import { useRoleList } from "./composables/useRoleList"
import type { Column } from "@@/components/DataTable/types"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Role } from "@/api/iam/role/type"

const { hasPermission } = usePermission()

const router = useRouter()
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
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useRoleList()

const roleFormRef = ref<InstanceType<typeof RoleForm>>()
const tableRef = ref<InstanceType<typeof DataTable>>()
const submitting = ref(false)

const handleSelectionChange = (val: Role[]) => {
  selectedRows.value = val
}

/**
 * 角色跳转详情
 */
const handleViewDetail = (row: Role) => {
  if (!hasPermission(IAM_CAPABILITIES.Role.Detail)) return
  router.push({
    name: "RoleDetail",
    query: { code: row.code }
  })
}

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

.eiam-governance-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  .search-command-inner {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    width: 380px;
    height: 38px;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }

    &:focus-within {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }

    .search-icon {
      color: #94a3b8;
      font-size: 16px;
      margin-right: 8px;
    }

    .command-input {
      width: 100%;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
        .el-input__inner {
          font-size: 13px;
          color: #1e293b;
        }
      }
    }
  }
}

.column-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;

  .eiam-primary-btn {
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    height: 38px;
    padding: 0 20px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
    transition: all 0.2s;

    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
  }
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
