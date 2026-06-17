<template>
  <ProGovernanceLayout
    v-model:keyword="searchQuery"
    title="工单服务目录"
    subtitle="选择服务模板并快速发起流程工单"
    search-placeholder="搜索工单名称..."
    :show-refresh="canViewTicketStart"
    @refresh="handleRefresh"
  >
    <template #actions-prefix>
      <div v-if="canViewTicketStart" class="ticket-summary">
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

    <div v-if="!canViewTicketStart" class="ticket-empty">
      <el-empty :image-size="160" description="您没有权限查看工单服务目录" />
    </div>

    <div v-else-if="empty" class="ticket-empty">
      <el-empty :image-size="160" description="暂无模板数据">
        <el-button type="primary" :loading="loading" @click="handleRefresh">刷新数据</el-button>
      </el-empty>
    </div>

    <div v-else v-loading="loading" class="ticket-catalog">
      <CategorySidebar
        v-model:selectedCategory="selectedCategory"
        :template-combinations="templateCombinations"
        :favorite-count="favoriteIds.length"
        :total-count="totalTemplateCount"
        :recent-count="recentTemplates.length"
        :show-favorites="canFavoriteTemplate"
      />

      <section class="catalog-content">
        <div class="catalog-section-header">
          <div>
            <h3>{{ selectedCategoryName }}</h3>
            <p>{{ selectedCategorySubtitle }}</p>
          </div>
        </div>

        <div class="templates-container">
          <TemplateOverview
            v-if="isOverview"
            :recent-templates="recentTemplates"
            :groups="visibleTemplateGroups"
            :favorite-ids="favoriteIds"
            :can-create="canCreateTicket"
            :can-favorite="canFavoriteTemplate"
            @template-click="handleDetail"
            @toggle-favorite="toggleFavorite"
          />

          <div v-else-if="displayTemplates.length === 0" class="ticket-empty is-inline">
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
              @click="handleDetail(tpl.id)"
              @toggle-favorite="toggleFavorite"
            />
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
import TemplateOverview from "./components/TemplateOverview.vue"
import { useTemplateData } from "./composables/useTemplateData"
import { useTemplateFilter } from "./composables/useTemplateFilter"
import { useTemplateCatalogView } from "./composables/useTemplateCatalogView"
import { useTemplateUsage } from "./composables/useTemplateUsage"

const { hasPermission } = usePermission()

const canViewTicketStart = computed(() => hasPermission(TICKET_CAPABILITIES.Center.Pipeline))
const canCreateTicket = computed(() =>
  hasPermission([TICKET_CAPABILITIES.Center.Pipeline, TICKET_CAPABILITIES.Center.Create])
)
const canFavoriteTemplate = computed(() =>
  hasPermission([TICKET_CAPABILITIES.Center.Pipeline, TICKET_CAPABILITIES.Template.ToggleFavorite])
)

const {
  templateCombinations,
  favoriteTemplates,
  favoriteIds,
  empty,
  loading,
  toggleFavorite,
  getTotalTemplateCount,
  refreshData
} = useTemplateData({
  immediate: false,
  canFavorite: () => canFavoriteTemplate.value
})

const { selectedCategory, searchQuery, getSelectedCategoryName, filteredTemplates, allTemplates } = useTemplateFilter(
  templateCombinations,
  favoriteTemplates
)
const { recentTemplates, recordTemplateUsage } = useTemplateUsage(allTemplates)

const dialogVisible = ref(false)
const currentTemplateId = ref<number | null>(null)

const totalTemplateCount = computed(() => getTotalTemplateCount())
const {
  isOverview,
  selectedCategoryName,
  selectedCategorySubtitle,
  emptyDescription,
  visibleTemplateGroups,
  displayTemplates,
  visibleTemplateCount
} = useTemplateCatalogView({
  selectedCategory,
  searchQuery,
  templateCombinations,
  filteredTemplates,
  recentTemplates,
  totalTemplateCount,
  getSelectedCategoryName
})

const handleRefresh = () => {
  if (!canViewTicketStart.value) return
  refreshData()
}

const handleDetail = (id: number) => {
  if (!canCreateTicket.value) {
    ElMessage.warning("暂无提交工单权限")
    return
  }
  recordTemplateUsage(id)
  currentTemplateId.value = id
  dialogVisible.value = true
}

watch(
  canViewTicketStart,
  (allowed) => {
    if (allowed) refreshData()
  },
  { immediate: true }
)

watch(canFavoriteTemplate, (allowed) => {
  if (!allowed && selectedCategory.value === "favorites") {
    selectedCategory.value = "all"
  }
})

watch(recentTemplates, (recent) => {
  if (selectedCategory.value === "recent" && recent.length === 0) selectedCategory.value = "all"
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
}

.catalog-section-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 0;

  h3 {
    margin: 0;
    color: #111827;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
  }
}

.templates-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px 20px;
  scroll-behavior: smooth;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
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
