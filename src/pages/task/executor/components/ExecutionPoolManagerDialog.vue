<template>
  <Drawer
    v-model="visible"
    title="执行资源池管理"
    subtitle="维护系统租户空间的资源池与授权绑定"
    size="82%"
    :header-icon="Connection"
    class="execution-pool-manager-drawer"
    :show-footer="false"
  >
    <AccessLockedState
      v-if="!isSystemSpace"
      :current-tenant-name="currentTenantName"
      :system-tenant="systemTenant"
      @switch="switchToSystemTenant"
    />

    <section v-else class="pool-manager-layout">
      <PoolDirectory
        v-model:kind="poolFilters.kind"
        v-model:status="poolFilters.status"
        v-model:mode="poolFilters.mode"
        v-model:current-page="poolPagination.currentPage"
        v-model:page-size="poolPagination.pageSize"
        :loading="poolLoading"
        :pools="pools"
        :selected-pool-name="selectedPoolName"
        :total="poolPagination.total"
        @reload="reloadPools"
        @select="selectPool"
      />

      <PoolDetailPanel
        v-model:tenant-id="bindingFilters.tenant_id"
        v-model:binding-status="bindingFilters.status"
        :pool="selectedPool"
        :bindings="bindings"
        :binding-loading="bindingLoading"
        :tenant-options="tenantOptions"
        :get-tenant-name="getTenantName"
        @load-bindings="loadBindings"
        @open-bind="openBindDialog"
        @toggle="toggleBinding"
        @unbind="unbind"
      />
    </section>

    <BindingDialog
      v-model="bindDialogVisible"
      v-model:tenant-id="bindForm.tenant_id"
      v-model:handler-names="bindForm.handler_names"
      v-model:desc="bindForm.desc"
      :pool-name="selectedPool?.name || bindForm.pool_name"
      :is-dedicated="selectedPool?.isolation_level === ExecutionPoolIsolation.Dedicated"
      :handlers="selectedHandlers"
      :bindings="bindDialogBindings"
      :binding-loading="bindDialogBindingLoading"
      :tenant-options="tenantOptions"
      :submit-loading="submitLoading"
      @submit="submitBind"
    />
  </Drawer>
</template>

<script setup lang="ts">
import { Connection } from "@element-plus/icons-vue"
import { ExecutionPoolIsolation } from "@/api/task/pool/type"
import { Drawer } from "@/common/components/Dialogs"
import AccessLockedState from "../execution-pool/components/AccessLockedState.vue"
import BindingDialog from "../execution-pool/components/BindingDialog.vue"
import PoolDetailPanel from "../execution-pool/components/PoolDetailPanel.vue"
import PoolDirectory from "../execution-pool/components/PoolDirectory.vue"
import { useExecutionPoolPage } from "../execution-pool/composables/useExecutionPoolPage"

const visible = defineModel<boolean>({ default: false })

const {
  poolLoading,
  bindingLoading,
  submitLoading,
  bindDialogBindingLoading,
  bindDialogVisible,
  pools,
  bindings,
  bindDialogBindings,
  selectedPoolName,
  poolPagination,
  poolFilters,
  bindingFilters,
  bindForm,
  currentTenantName,
  isSystemSpace,
  systemTenant,
  tenantOptions,
  selectedPool,
  selectedHandlers,
  getTenantName,
  loadBindings,
  reloadPools,
  selectPool,
  openBindDialog,
  submitBind,
  toggleBinding,
  unbind,
  switchToSystemTenant
} = useExecutionPoolPage()
</script>

<style scoped lang="scss">
.pool-manager-layout {
  height: 100%;
  min-height: 560px;
  display: grid;
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  background: #f8fafc;
}

@media (max-width: 1180px) {
  .pool-manager-layout {
    grid-template-columns: 1fr;
  }
}
</style>
