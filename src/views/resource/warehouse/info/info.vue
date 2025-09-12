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
      <template #details>
        <div class="resource-identity">
          <div class="identity-badge">
            <span class="badge-label">资源名称</span>
            <code class="identity-code">{{ resourceName }}</code>
          </div>
        </div>
      </template>
    </ManagerHeader>

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange">
      <template #default="{ activeTab }">
        <resourceDesc v-if="activeTab === 'resource-desc'" :resource-id="resourceId" :model-uid="modelUid" />
        <resourceList v-if="activeTab === 'resource-list'" :model-uid="modelUid" :resource-id="resourceId" />
        <resourceRelation
          v-if="activeTab === 'resource-relation'"
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
import { ref } from "vue"
import { useRoute } from "vue-router"
import resourceDesc from "./c-cnps/desc.vue"
import resourceRelation from "./c-cnps/relation-graph.vue"
import resourceList from "./c-cnps/relation-list.vue"
import router from "@/router"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"

const route = useRoute()
const modelUid = route.query.model_uid as string
const resourceName = route.query.name as string
const resourceId = route.query.id as string

const activeName = ref<string>("resource-desc")

// tabs 配置
const tabs = [
  { name: "resource-desc", label: "资源详情" },
  { name: "resource-list", label: "关系列表" },
  { name: "resource-relation", label: "关联拓扑图" }
]

// 处理 tab 切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
}

const goBack = () => {
  router.go(-1)
}
</script>

<style lang="scss" scoped>
// 移除自定义容器样式，使用 PageContainer

.resource-identity {
  .identity-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--muted, #f9fafb);
    padding: 4px 8px;
    border-radius: 6px;

    .badge-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--muted-foreground, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .identity-code {
      font-family: var(--font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace);
      font-size: 12px;
      font-weight: 600;
      color: var(--primary, #3b82f6);
      background: var(--background, #ffffff);
      padding: 2px 6px;
      border-radius: 3px;
    }
  }
}
</style>
