<template>
  <PageContainer class="model-detail-page">
    <ManagerHeader title="模型详情" subtitle="" :show-back-button="true" :show-refresh-button="false" @back="goBack">
      <template #details>
        <ModelDetailIdentity :uid="modelUid" :name="modelName" :builtin="isBuiltin" />
      </template>

      <template #actions>
        <ModelDetailActions
          :model-uid="modelUid"
          :builtin="isBuiltin"
          :exporting="exporting"
          @export="handleExportTemplate"
          @delete="handleDeleteModel"
        />
      </template>
    </ManagerHeader>

    <CustomTabs :tabs="tabs" :default-active="activeTab" @tab-change="activeTab = $event">
      <template #default="{ activeTab: currentTab }">
        <ModelField v-if="currentTab === 'model-field'" :model-uid="modelUid" />
        <ModelRelation v-if="currentTab === 'model-relation'" :model-uid="modelUid" />
      </template>
    </CustomTabs>
  </PageContainer>
</template>

<script lang="ts" setup>
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ModelDetailActions from "./components/ModelDetailActions.vue"
import ModelDetailIdentity from "./components/ModelDetailIdentity.vue"
import ModelField from "./components/model-field/index.vue"
import ModelRelation from "./components/model-relation/index.vue"
import { useModelDetail } from "./composables/useModelDetail"

const tabs = [
  { name: "model-field", label: "模型属性" },
  { name: "model-relation", label: "模型关联" }
]

const { activeTab, modelUid, modelName, isBuiltin, exporting, goBack, handleExportTemplate, handleDeleteModel } =
  useModelDetail()
</script>

<style lang="scss" scoped>
.model-detail-page {
  :deep(.manager-header) {
    align-items: center;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.details-section) {
    min-width: 0;
  }

  :deep(.header-right) {
    flex-shrink: 0;
  }
}

@media (max-width: 900px) {
  .model-detail-page {
    :deep(.manager-header) {
      align-items: flex-start;
      flex-direction: column;
      gap: 14px;
    }
  }
}
</style>
