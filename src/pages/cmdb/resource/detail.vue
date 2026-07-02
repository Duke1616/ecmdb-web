<template>
  <PageContainer>
    <ManagerHeader
      title="资源详情"
      subtitle=""
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="false"
      @back="goBack"
    >
      <template #actions>
        <div class="resource-detail-actions">
          <OperateBtn
            v-if="pluginDetailItems.length"
            :items="pluginDetailItems"
            :operate-item="detailOperateItem"
            :max-length="2"
            @routeEvent="handlePluginDetailEvent"
          />
          <ResourceIdentityBadge :name="resourceName" />
        </div>
      </template>
    </ManagerHeader>

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange">
      <template #default="{ activeTab }">
        <ResourceDescription v-if="activeTab === TAB_NAMES.DESC" :resource-id="resourceId" :model-uid="modelUid" />
        <ResourceRelations v-if="activeTab === TAB_NAMES.LIST" :model-uid="modelUid" :resource-id="resourceId" />
        <ResourceRelationGraph
          v-if="activeTab === TAB_NAMES.GRAPH && canViewRelationGraph"
          :model-uid="modelUid"
          :resource-id="resourceId"
          :activeName="activeName"
          :resource-name="resourceName"
        />
      </template>
    </CustomTabs>
  </PageContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue"
import ResourceIdentityBadge from "./components/detail/ResourceIdentityBadge.vue"
import ResourceDescription from "./components/detail/ResourceDescription.vue"
import ResourceRelationGraph from "./components/detail/ResourceRelationGraph.vue"
import ResourceRelations from "./components/detail/ResourceRelations.vue"
import { useResourceDetail } from "./composables/detail/useResourceDetail"
import { useResourcePluginActions } from "./composables/useResourcePluginActions"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"

const {
  TAB_NAMES,
  activeName,
  canViewRelationGraph,
  modelUid,
  resourceId,
  resourceName,
  tabs,
  goBack,
  handleTabChange
} = useResourceDetail()

const { getPluginOperateItems, loadResourcePluginActions, handlePluginAction } = useResourcePluginActions()

const resourceIDNumber = computed(() => Number(resourceId.value) || 0)
const detailOperateItem = computed(() => ({
  id: resourceIDNumber.value,
  name: resourceName.value,
  model_uid: modelUid.value
}))
const pluginDetailItems = computed(() => getPluginOperateItems(resourceIDNumber.value))

const handlePluginDetailEvent = (row: { id: number; name: string; model_uid: string }, action: string) => {
  handlePluginAction(row, action)
}

watch(
  () => resourceIDNumber.value,
  (id) => {
    if (id) {
      void loadResourcePluginActions([
        {
          id,
          name: resourceName.value,
          model_uid: modelUid.value
        }
      ])
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.resource-detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
</style>
