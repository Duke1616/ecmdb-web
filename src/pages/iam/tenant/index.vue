<template>
  <PageContainer>
    <!-- 头部治理区 -->
    <ManagerHeader
      title="租户治理"
      subtitle="多租户架构核心治理，支持多维度的租户实体管理与维护"
      @refresh="handleRefresh"
    >
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 搜索治理 -->
          <div class="search-command-inner">
            <el-icon class="search-icon"><Search /></el-icon>
            <el-input
              v-model="query.keyword"
              placeholder="搜索租户名称或空间编码..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            />
          </div>

          <!-- 动作组 -->
          <div class="action-group">
            <el-button
              class="u-gov-btn is-large"
              :disabled="!hasPermission(IAM_CAPABILITIES.Tenant.Add)"
              @click="handleCreate"
            >
              <el-icon><Plus /></el-icon>
              <span>新增租户</span>
            </el-button>
            <el-button :icon="RefreshRight" class="eiam-refresh-btn" @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 治理列表 -->
    <DataTable
      v-loading="loading"
      :data="tenants"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 租户核心资产 -->
      <template #tenant_info="{ row }">
        <div class="dual-line-info">
          <el-link
            v-if="hasPermission(IAM_CAPABILITIES.Tenant.Detail)"
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Search, Plus, RefreshRight, OfficeBuilding, Edit, Delete } from "@element-plus/icons-vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import TenantForm from "./components/TenantForm.vue"
import { useTenantList } from "./composables/useTenantList"
import { useRouter } from "vue-router"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Column } from "@@/components/DataTable/types"
import type { Tenant } from "@/api/iam/tenant/type"

const router = useRouter()
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

const tenantFormRef = ref<InstanceType<typeof TenantForm>>()
const submitting = ref(false)

/**
 * 租户操作配置项
 */
const tenantOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: IAM_CAPABILITIES.Tenant.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: IAM_CAPABILITIES.Tenant.Delete }
]

const handleViewDetail = (row: Tenant) => {
  router.push({
    name: "TenantDetail",
    query: { id: row.id }
  })
}

/**
 * 统一执行操作分发
 */
const handleOperate = (row: Tenant, code: string) => {
  if (code === "view") handleViewDetail(row)
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

  .eiam-refresh-btn {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
    transition: all 0.2s;

    &:hover {
      color: #409eff;
      border-color: #409eff;
      background: #f0f7ff;
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
