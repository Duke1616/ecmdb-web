<template>
  <main class="binding-workbench">
    <template v-if="pool">
      <header class="workbench-head">
        <div class="pool-summary">
          <div class="pool-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="pool-copy">
            <span class="section-kicker">授权绑定</span>
            <div class="pool-title-row">
              <h2>{{ pool.name }}</h2>
              <span
                class="pool-status"
                :class="pool.status === ExecutionPoolStatus.Enabled ? 'is-enabled' : 'is-disabled'"
              >
                <span class="status-dot" />
                {{ pool.status === ExecutionPoolStatus.Enabled ? "启用中" : "已禁用" }}
              </span>
              <span v-if="pool.isolation_level === ExecutionPoolIsolation.Dedicated" class="pool-isolation"
                >专属资源池</span
              >
            </div>
          </div>
        </div>

        <el-button class="add-binding-btn" type="primary" :icon="Plus" @click="$emit('openBind')">新增授权</el-button>
      </header>

      <div class="filterbar">
        <div class="filter-field is-tenant">
          <span class="field-label">租户</span>
          <TenantPicker
            v-model="tenantId"
            class="tenant-filter"
            :tenants="tenantOptions"
            placeholder="租户 ID / 名称"
            variant="element"
            size="default"
            clearable
            @change="$emit('loadBindings')"
          />
        </div>
        <div class="filter-field is-status">
          <span class="field-label">状态</span>
          <el-select
            v-model="bindingStatus"
            class="status-filter"
            clearable
            placeholder="全部"
            size="default"
            @change="$emit('loadBindings')"
          >
            <el-option label="启用" :value="ExecutionPoolBindingStatus.Enabled" />
            <el-option label="禁用" :value="ExecutionPoolBindingStatus.Disabled" />
          </el-select>
        </div>
      </div>

      <div class="binding-table-shell">
        <DataTable
          class="binding-data-table"
          :loading="bindingLoading"
          :data="bindings"
          :columns="tableColumns"
          :show-selection="false"
          :show-pagination="false"
          :action-column-width="152"
          :action-column-fixed="false"
          :table-props="bindingTableProps"
        >
          <template #tenant="{ row }">
            <div class="tenant-cell">
              <strong>{{ getTenantName(row.tenant_id) }}</strong>
            </div>
          </template>

          <template #handler="{ row }">
            <span class="handler-code">{{ row.handler_name || "*" }}</span>
          </template>

          <template #status="{ row }">
            <StatusBadge
              :type="row.status === ExecutionPoolBindingStatus.Enabled ? 'success' : 'info'"
              :label="row.status === ExecutionPoolBindingStatus.Enabled ? '启用' : '禁用'"
            />
          </template>

          <template #desc="{ row }">
            <span class="desc-cell" :class="{ 'is-empty': !row.desc }">{{ row.desc || "暂无说明" }}</span>
          </template>

          <template #actions="{ row }">
            <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="handleAction" />
          </template>

          <template #empty>
            <div class="binding-empty">
              <el-empty :image-size="96" description="当前资源池暂无授权绑定" />
              <el-button class="empty-action" type="primary" :icon="Plus" @click="$emit('openBind')">
                新增第一条授权
              </el-button>
            </div>
          </template>
        </DataTable>
      </div>
    </template>

    <el-empty v-else :image-size="120" description="请选择一个执行资源池" class="detail-empty" />
  </main>
</template>

<script setup lang="ts">
import {
  ExecutionPoolBindingStatus,
  ExecutionPoolIsolation,
  ExecutionPoolStatus,
  type ExecutionPool,
  type ExecutionPoolBinding
} from "@/api/task/pool/type"
import type { Tenant } from "@/api/iam/user/type"
import type { TenantSelectValue } from "../types"
import { TenantPicker } from "@@/components/Pickers"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import StatusBadge from "@/common/components/StatusBadge/index.vue"
import type { Column } from "@@/components/DataTable/types"
import { Connection, Delete, Plus, VideoPause, VideoPlay } from "@element-plus/icons-vue"

defineProps<{
  pool: ExecutionPool | null
  bindings: ExecutionPoolBinding[]
  bindingLoading: boolean
  tenantOptions: Tenant[]
  getTenantName: (tenantId: number) => string
}>()

const emit = defineEmits<{
  loadBindings: []
  openBind: []
  toggle: [row: ExecutionPoolBinding]
  unbind: [row: ExecutionPoolBinding]
}>()

const tenantId = defineModel<TenantSelectValue>("tenantId", { required: true })
const bindingStatus = defineModel<ExecutionPoolBindingStatus | "">("bindingStatus", { required: true })

const tableColumns: Column[] = [
  { prop: "tenant_id", label: "租户", slot: "tenant", width: 280, align: "left", showOverflowTooltip: true },
  { prop: "handler_name", label: "Handler", slot: "handler", width: 150, align: "left" },
  { prop: "status", label: "状态", slot: "status", width: 120, align: "left" },
  { prop: "desc", label: "说明", slot: "desc", minWidth: 320, align: "left", showOverflowTooltip: true }
]

const bindingTableProps = {
  tableLayout: "fixed",
  fit: true
}

const getOperateItems = (row: ExecutionPoolBinding) => [
  {
    name: row.status === ExecutionPoolBindingStatus.Enabled ? "禁用" : "启用",
    code: "toggle",
    icon: row.status === ExecutionPoolBindingStatus.Enabled ? VideoPause : VideoPlay,
    type: row.status === ExecutionPoolBindingStatus.Enabled ? "warning" : "success"
  },
  {
    name: "解绑",
    code: "unbind",
    icon: Delete,
    type: "danger"
  }
]

const handleAction = (row: ExecutionPoolBinding, code: string) => {
  if (code === "toggle") {
    emit("toggle", row)
    return
  }
  if (code === "unbind") {
    emit("unbind", row)
  }
}
</script>

<style scoped lang="scss">
.binding-workbench {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
}

.workbench-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 82px;
  padding: 16px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e8eef6;
}

.pool-summary {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pool-isolation {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 7px;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.pool-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  flex: 0 0 auto;

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.pool-copy {
  min-width: 0;
}

.section-kicker {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.pool-title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  h2 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: #111827;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.pool-status {
  height: 26px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border-radius: 6px;
  color: #64748b;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;

  &.is-enabled {
    color: #15803d;
    background: #dcfce7;
  }

  &.is-disabled {
    color: #475569;
    background: #e2e8f0;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
}

.add-binding-btn {
  width: 112px;
  height: 36px;
  border-radius: 6px;
  font-weight: 700;
  flex: 0 0 auto;
}

.filterbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  align-items: center;
  padding: 12px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e8eef6;
}

.filter-field {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: center;

  &.is-tenant {
    width: min(500px, 48%);
    min-width: 300px;
  }

  &.is-status {
    width: 220px;
  }
}

.field-label {
  width: 42px;
  flex: 0 0 42px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.tenant-filter,
.status-filter {
  width: 100%;
}

.binding-table-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.binding-data-table {
  flex: 1;
  min-height: 0;

  :deep(.manager-content) {
    height: 100%;
    min-height: 0;
  }

  :deep(.content-card) {
    border: 0;
    border-radius: 0;
  }

  :deep(.data-table-container) {
    min-height: 0;
  }

  :deep(.data-table .el-table__header th) {
    height: 44px;
    color: #475569;
    background: #f8fafc !important;
  }

  :deep(.data-table .el-table__header th .cell) {
    justify-content: flex-start;
    min-height: 44px;
    padding: 10px 14px;
    text-align: left;
  }

  :deep(.data-table .el-table__header th:last-child .cell) {
    justify-content: center;
    text-align: center;
  }

  :deep(.data-table .el-table__body td) {
    height: 56px;
  }

  :deep(.data-table .el-table__body td .cell) {
    min-height: 56px;
    padding: 10px 14px;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: hidden;
  }

  :deep(.el-table__empty-block) {
    min-height: 260px;
  }

  :deep(.operate-actions .btn-container) {
    gap: 10px;
    justify-content: center;
  }

  :deep(.operate-actions .el-button) {
    height: 28px;
    padding: 0 4px;
  }
}

.tenant-cell {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  strong {
    color: #111827;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #64748b;
    font-size: 12px;
    white-space: nowrap;
  }
}

.handler-code {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 6px;
  color: #2563eb;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1;
}

.desc-cell {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #475569;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-empty {
    color: #94a3b8;
  }
}

.binding-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}

.empty-action {
  height: 34px;
  border-radius: 6px;
}

.detail-empty {
  margin: auto;
}

@media (max-width: 980px) {
  .workbench-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .add-binding-btn {
    width: 100%;
  }

  .filter-field {
    &.is-tenant {
      width: 100%;
      min-width: 0;
    }

    &.is-status {
      width: 240px;
    }
  }
}

@media (max-width: 640px) {
  .filter-field {
    width: 100% !important;
    gap: 6px;
    align-items: flex-start;
    flex-direction: column;
  }

  .field-label {
    width: auto;
    flex-basis: auto;
  }
}
</style>
