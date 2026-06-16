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
        <ResourceIdentityBadge :name="resourceName" />
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
import ResourceIdentityBadge from "./components/detail/ResourceIdentityBadge.vue"
import ResourceDescription from "./components/detail/ResourceDescription.vue"
import ResourceRelationGraph from "./components/detail/ResourceRelationGraph.vue"
import ResourceRelations from "./components/detail/ResourceRelations.vue"
import { useResourceDetail } from "./composables/detail/useResourceDetail"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"

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
</script>
