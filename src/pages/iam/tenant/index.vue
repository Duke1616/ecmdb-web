<template>
  <ProGovernanceLayout
    title="租户治理"
    subtitle="多租户架构核心治理，支持多维度的租户实体管理与维护"
    search-placeholder="搜索租户名称或空间编码..."
    v-model:keyword="query.keyword"
    :primary-action="{ capability: IAM_CAPABILITIES.Tenant.Add, label: '新增租户' }"
    @search="handleRefresh"
    @refresh="handleRefresh"
    @primary-action="handleCreate"
  >
    <!-- 治理列表 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <!-- 租户核心资产: 使用统一的资产单元组件 -->
      <template #tenant_info="{ row }">
        <AssetIdentityCell
          :title="row.name"
          :sub-title="row.code"
          :link-to="
            hasPermission(IAM_CAPABILITIES.Tenant.Detail) ? { name: 'TenantDetail', query: { id: row.id } } : undefined
          "
          centered
        />
      </template>

      <!-- 身份域名 -->
      <template #domain="{ row }">
        <span class="domain-text-indicator mono">
          {{ row.domain || "-" }}
        </span>
      </template>

      <!-- 运行状态 -->
      <template #status="{ row }">
        <div class="status-indicator" :class="row.status === 1 ? 'active' : 'locked'">
          <span class="dot" />
          {{ row.status === 1 ? "运行中" : "已停用" }}
        </div>
      </template>

      <!-- 操作权限 -->
      <template #actions="{ row }">
        <OperateBtn :items="tenantOperateItems" :operate-item="row" :max-length="2" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 租户编辑/创建 弹窗 -->
    <FormDialog
      v-model="formVisible"
      :title="currentEditId ? '编辑租户资料' : '新增租户'"
      :header-icon="OfficeBuilding"
      width="700px"
      :confirm-loading="submitting"
      @confirm="handleConfirm"
      @cancel="formVisible = false"
    >
      <TenantForm ref="tenantFormRef" :id="currentEditId!" :is-edit="!!currentEditId" @success="handleFormSuccess" />
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { OfficeBuilding, Edit, Delete } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import TenantForm from "./components/TenantForm.vue"
import { useTenantList } from "./composables/useTenantList"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Column } from "@@/components/DataTable/types"
import type { Tenant } from "@/api/iam/tenant/type"

const { hasPermission } = usePermission()

const {
  tenants,
  total,
  currentPage,
  pageSize,
  query,
  loading,
  formVisible,
  currentEditId,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useTenantList()

/**
 * 打包表格通用属性，实现模板瘦身
 */
const tableProps = computed(() => ({
  loading: loading.value,
  data: tenants.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  showPagination: true,
  showSelection: true,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

const tenantFormRef = ref<InstanceType<typeof TenantForm>>()
const submitting = ref(false)

/**
 * 租户操作配置项
 */
const tenantOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: IAM_CAPABILITIES.Tenant.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: IAM_CAPABILITIES.Tenant.Delete }
]

/**
 * 统一执行操作分发
 */
const handleOperate = (row: Tenant, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "delete") handleDelete(row)
}

const tableColumns: Column[] = [
  { label: "租户实体", prop: "name", slot: "tenant_info", minWidth: 280, align: "center" },
  { label: "身份域名标识", prop: "domain", slot: "domain", minWidth: 320, align: "center" },
  { label: "运行状态", prop: "status", slot: "status", width: 140, align: "center" }
]

const handleConfirm = async () => {
  if (!tenantFormRef.value) return
  submitting.value = true
  try {
    await tenantFormRef.value.submit()
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
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

.domain-text-indicator {
  font-size: 13px;
  color: #64748b;
  letter-spacing: -0.01em;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

  &.active {
    color: #16a34a;
    .dot {
      background: #22c55e;
    }
  }

  &.locked {
    color: #dc2626;
    .dot {
      background: #ef4444;
    }
  }
}
</style>
