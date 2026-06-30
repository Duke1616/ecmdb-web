<template>
  <div class="relation-management">
    <div class="relation-toolbar">
      <div class="toolbar-title">
        <h3>模型关联</h3>
        <span>维护当前模型与其他模型之间的关联约束</span>
      </div>

      <div class="toolbar-actions">
        <AuthButton
          type="primary"
          class="toolbar-btn"
          :icon="CirclePlus"
          :capability="CMDB_CAPABILITIES.Model.RelationAdd"
          disable-mode
          @click="openCreateDrawer"
        >
          新建关联
        </AuthButton>
        <el-button class="toolbar-btn" :icon="RefreshRight" @click="fetchRelations">刷新</el-button>
      </div>
    </div>

    <DataTable
      :data="modelRelationData"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #relation_name="{ row }">
        <code class="relation-id">{{ row.relation_name }}</code>
      </template>

      <template #source_model_uid="{ row }">
        <span class="model-name">{{ getModelName(row.source_model_uid) }}</span>
      </template>

      <template #target_model_uid="{ row }">
        <span class="model-name">{{ getModelName(row.target_model_uid) }}</span>
      </template>

      <template #relation_type_uid="{ row }">
        <span class="relation-type">{{ row.relation_type_uid }}</span>
      </template>

      <template #mapping="{ row }">
        <span class="mapping-text">{{ getRelationMappingLabel(row.mapping) }}</span>
      </template>

      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" :operate-item="row" :max-length="2" @route-event="handleOperateEvent" />
      </template>
    </DataTable>

    <CreateRelation
      v-model="drawerVisible"
      :model-uid="modelUid"
      :relation-type-data="relationTypeData"
      :active-relation="activeRelation"
      @success="fetchRelations"
    />
  </div>
</template>

<script lang="ts" setup>
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import CreateRelation from "./create.vue"
import { useModelRelations } from "../../composables/useModelRelations"
import { getRelationMappingLabel } from "@/api/cmdb/relation/types/relation"

const { modelUid } = defineProps<{ modelUid: string }>()

const {
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  drawerVisible,
  activeRelation,
  relationTypeData,
  modelRelationData,
  tableColumns,
  operateBtnItems,
  getModelName,
  fetchRelations,
  openCreateDrawer,
  handleOperateEvent
} = useModelRelations(modelUid)
</script>

<style lang="scss" scoped>
.relation-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.relation-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.toolbar-title {
  min-width: 0;

  h3 {
    margin: 0 0 4px;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.toolbar-actions {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
}

.toolbar-btn {
  height: 34px;
  border-radius: 8px;
  font-weight: 600;
}

:deep(.el-table) {
  .relation-id {
    color: #0f172a;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
  }

  .model-name,
  .relation-type,
  .mapping-text {
    display: inline-block;
    max-width: 180px;
    overflow: hidden;
    color: #334155;
    font-size: 13px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .model-name {
    font-weight: 600;
  }

  .relation-type,
  .mapping-text {
    padding: 2px 8px;
    color: #475569;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }
}

@media (max-width: 768px) {
  .relation-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>
