<template>
  <ProGovernanceLayout
    title="用户组治理"
    subtitle="面向组织、项目和职责边界的用户集合管理"
    search-placeholder="搜索用户组名称或标识码..."
    v-model:keyword="query.keyword"
    :selection-count="selectedRows.length"
    :primary-action="{ capability: IAM_CAPABILITIES.Group.Add, label: '新增用户组' }"
    :danger-action="{ capability: IAM_CAPABILITIES.Group.BatchDelete, label: '批量删除' }"
    @search="handleRefresh"
    @refresh="handleRefresh"
    @primary-action="handleCreate"
    @danger-action="handleBatchDelete"
  >
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <template #group_info="{ row }">
        <AssetIdentityCell
          :title="row.name"
          :sub-title="row.code"
          :link-to="
            hasPermission(IAM_CAPABILITIES.Group.Detail)
              ? { name: 'GroupDetail', query: { code: row.code } }
              : undefined
          "
          centered
        />
      </template>

      <template #desc="{ row }">
        <span class="column-text">{{ row.desc || "--" }}</span>
      </template>

      <template #actions="{ row }">
        <OperateBtn :items="groupOperateItems" :operate-item="row" :max-length="2" @route-event="handleOperate" />
      </template>
    </DataTable>

    <GroupDialog v-model="formVisible" :code="currentEditCode!" @success="handleFormSuccess" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Edit, Delete } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import GroupDialog from "./components/GroupDialog.vue"
import { useGroupList } from "./composables/useGroupList"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Column } from "@@/components/DataTable/types"
import type { Group } from "@/api/iam/group/type"

const { hasPermission } = usePermission()

const {
  groups,
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
} = useGroupList()

const tableProps = computed(() => ({
  loading: loading.value,
  data: groups.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  showPagination: true,
  showSelection: true,
  selectable: () => hasPermission(IAM_CAPABILITIES.Group.BatchDelete),
  tableProps: !hasPermission(IAM_CAPABILITIES.Group.BatchDelete) ? { class: "selection-disabled" } : {},
  onSelectionChange: handleSelectionChange,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

const groupOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: IAM_CAPABILITIES.Group.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: IAM_CAPABILITIES.Group.Delete }
]

const handleOperate = (row: Group, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "delete") handleDelete(row)
}

const tableColumns: Column[] = [
  { label: "用户组资产", prop: "name", slot: "group_info", minWidth: 220, align: "center" },
  { label: "说明描述", prop: "desc", slot: "desc", minWidth: 360, align: "center" }
]
</script>

<style lang="scss" scoped>
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
</style>
