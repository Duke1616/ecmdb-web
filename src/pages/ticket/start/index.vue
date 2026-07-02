<template>
  <ProGovernanceLayout
    v-model:keyword="searchQuery"
    title="工单服务目录"
    subtitle="选择服务模板并快速发起流程工单"
    search-placeholder="搜索工单名称..."
    :show-refresh="true"
    @refresh="handleRefresh"
  >
    <template #actions-prefix>
      <div class="ticket-summary">
        <span class="summary-item">
          <span class="summary-label">模板总数</span>
          <strong>{{ totalTemplateCount }}</strong>
        </span>
        <span class="summary-item">
          <span class="summary-label">当前可见</span>
          <strong>{{ visibleTemplateCount }}</strong>
        </span>
      </div>
    </template>

    <div v-if="empty" class="ticket-empty">
      <el-empty :image-size="160" description="暂无模板数据">
        <el-button type="primary" :loading="loading" @click="handleRefresh">刷新数据</el-button>
      </el-empty>
    </div>

    <div v-else v-loading="initialLoading" class="ticket-catalog">
      <CategorySidebar
        v-model:selectedCategory="selectedCategory"
        :groups="templateGroupSummaries"
        :favorite-count="favoriteIds.length"
        :total-count="totalTemplateCount"
        :recent-count="recentTemplates.length"
        :show-favorites="canFavoriteTemplate"
        :loading="groupLoading"
      />

      <section class="catalog-content">
        <div class="catalog-section-header">
          <div>
            <h3>{{ selectedCategoryName }}</h3>
            <p>{{ selectedCategorySubtitle }}</p>
          </div>
        </div>

        <div
          v-loading="templateLoading && displayTemplates.length === 0"
          class="templates-container"
          @scroll="handleTemplateScroll"
        >
          <div v-if="displayTemplates.length === 0 && !templateLoading" class="ticket-empty is-inline">
            <el-empty :description="emptyDescription" :image-size="120" />
          </div>

          <div v-else class="templates-grid">
            <TemplateCard
              v-for="tpl in displayTemplates"
              :key="tpl.id"
              :template="tpl"
              :is-favorite="favoriteIds.includes(tpl.id)"
              :disabled="!canCreateTicket"
              :can-favorite="canFavoriteTemplate"
              @click="handleDetail(tpl)"
              @toggle-favorite="toggleFavorite"
            />
          </div>

          <div v-if="templateLoading && displayTemplates.length > 0" class="template-loading-more">加载中...</div>
          <div v-else-if="hasMoreTemplates && displayTemplates.length > 0" class="template-load-hint">
            继续下滑加载更多
          </div>
        </div>
      </section>
    </div>

    <CreateTicketDialog
      v-model:visible="dialogVisible"
      :template-id="currentTemplateId"
      :can-submit="canCreateTicket"
    />
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import TemplateCard from "./components/TemplateCard.vue"
import CategorySidebar from "./components/CategorySidebar.vue"
import CreateTicketDialog from "./components/CreateTicketDialog.vue"
import { useTemplateData } from "./composables/useTemplateData"
import { useTemplateFilter } from "./composables/useTemplateFilter"
import { useTemplateCatalogView } from "./composables/useTemplateCatalogView"
import { useTemplateUsage } from "./composables/useTemplateUsage"
import type { template } from "@/api/ticket/template/types/template"

const { hasPermission } = usePermission()

const canCreateTicket = computed(() => hasPermission(TICKET_CAPABILITIES.Manager.Submit))
const canFavoriteTemplate = computed(() => hasPermission(TICKET_CAPABILITIES.Manager.Submit))

const { selectedCategory, searchQuery } = useTemplateFilter()

const {
  templateGroupSummaries,
  templatesData,
  favoriteTemplates,
  favoriteIds,
  totalTemplateCount,
  templateResultTotal,
  empty,
  loading,
  groupLoading,
  templateLoading,
  hasMoreTemplates,
  loadMoreTemplates,
  toggleFavorite,
  refreshData
} = useTemplateData({
  immediate: false,
  canFavorite: () => canFavoriteTemplate.value,
  selectedCategory,
  searchQuery
})

const { recentTemplates, recordTemplateUsage } = useTemplateUsage()

const dialogVisible = ref(false)
const currentTemplateId = ref<number | null>(null)
const initialLoading = computed(() => loading.value && templateGroupSummaries.value.length === 0)
const currentTemplates = computed(() => {
  if (selectedCategory.value === "favorites") return favoriteTemplates.value
  return templatesData.value
})

const { selectedCategoryName, selectedCategorySubtitle, emptyDescription, displayTemplates, visibleTemplateCount } =
  useTemplateCatalogView({
    selectedCategory,
    searchQuery,
    displayTemplates: currentTemplates,
    recentTemplates,
    groups: templateGroupSummaries,
    totalTemplateCount,
    templateResultTotal
  })

const handleRefresh = () => {
  refreshData()
}

const handleDetail = (targetTemplate: template) => {
  if (!canCreateTicket.value) {
    ElMessage.warning("暂无提交工单权限")
    return
  }
  recordTemplateUsage(targetTemplate)
  currentTemplateId.value = targetTemplate.id
  dialogVisible.value = true
}

const handleTemplateScroll = (event: Event) => {
  if (selectedCategory.value === "favorites" || selectedCategory.value === "recent") return

  const target = event.currentTarget as HTMLElement
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (distanceToBottom < 120) loadMoreTemplates()
}

watch(canCreateTicket, () => refreshData(), { immediate: true })

watch(canFavoriteTemplate, (allowed) => {
  if (!allowed && selectedCategory.value === "favorites") selectedCategory.value = "all"
})

watch(
  recentTemplates,
  (recent, previousRecent) => {
    if (selectedCategory.value === "recent" && previousRecent.length > 0 && recent.length === 0) {
      selectedCategory.value = "all"
    }
  },
  { flush: "post" }
)
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(260px, 22vw, 330px);
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: clamp(12px, 1.2vw, 20px);
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.ticket-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.summary-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  color: #5b21b6;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.summary-label {
  color: #6d28d9;
  font-weight: 600;
}

.summary-item strong {
  color: #111827;
  font-size: 15px;
}

.ticket-empty {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  &.is-inline {
    min-height: 360px;
    border: none;
  }
}

.ticket-catalog {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.catalog-content {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #ffffff;
}

.catalog-section-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }

  p {
    margin: 2px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.3;
  }
}

.templates-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 24px;
  scroll-behavior: smooth;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.template-loading-more,
.template-load-hint {
  display: flex;
  justify-content: center;
  padding: 14px 0 2px;
  color: #94a3b8;
  font-size: 12px;
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

@media (max-width: 768px) {
  .ticket-catalog {
    flex-direction: column;
    overflow-y: auto;
  }

  .templates-container {
    overflow-y: visible;
  }
}

@media (max-width: 480px) {
  :deep(.action-group),
  .ticket-summary,
  .summary-item {
    width: 100%;
  }

  .ticket-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-item {
    justify-content: space-between;
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>
