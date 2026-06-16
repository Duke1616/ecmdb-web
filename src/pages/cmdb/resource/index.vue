<template>
  <ProGovernanceLayout
    title="资产仓库"
    subtitle="按 CMDB 模型浏览资源数据与资产规模"
    v-model:keyword="searchInput"
    @refresh="getResourceModelsData"
  >
    <template #search>
      <ResourceSearchCommand v-model:keyword="searchInput" v-model:asset-state="assetState" />
    </template>

    <template #actions-prefix>
      <div class="resource-summary">
        <span class="summary-label">资产总数</span>
        <strong>{{ totalResources }}</strong>
      </div>
    </template>

    <el-empty v-if="empty" :image-size="180" description="暂无资产模型数据" class="resource-empty" />

    <ResourceCatalogPanel
      v-else
      :groups="filterData"
      :selected-group="selectedGroup"
      :can-view-resources="canViewResources"
      @select-group="selectGroup"
      @model-click="handleModelClick"
    />
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import ResourceCatalogPanel from "./components/ResourceCatalogPanel.vue"
import ResourceSearchCommand from "./components/ResourceSearchCommand.vue"
import { useResourceCatalog } from "./composables/useResourceCatalog"

const {
  searchInput,
  assetState,
  filterData,
  empty,
  selectedGroup,
  totalResources,
  canViewResources,
  selectGroup,
  getResourceModelsData,
  handleModelClick
} = useResourceCatalog()

onMounted(() => {
  getResourceModelsData()
})
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: 24px;
  padding: 22px 24px;
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: 330px;
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: 20px;
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.resource-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  color: #075985;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;

  .summary-label {
    color: #0369a1;
    font-weight: 600;
  }

  strong {
    color: #0f172a;
    font-size: 15px;
  }
}

.resource-empty {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

@media (max-width: 1100px) {
  :deep(.manager-header) {
    align-items: stretch;
    flex-direction: column;
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.eiam-governance-bar) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  :deep(.action-group) {
    width: 100%;
    flex-wrap: wrap;
  }

  .resource-summary {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
