<template>
  <WorkspaceSectionPage
    title="聚合路由"
    subtitle="按路由树匹配告警，不同分支可独立声明分组标签和通知节奏"
    :primary-action="primaryAction"
    @primary-action="handleAddChildRoute"
  >
    <template #actions>
      <el-button v-if="!isEditing || activeTab === 'sandbox'" :icon="Refresh" :loading="loading" @click="loadRoutes"
        >刷新</el-button
      >

      <template v-if="activeTab === 'config' && !isEditing">
        <AuthButton
          :icon="Plus"
          :disabled="!canAddChild"
          :capability="ALERT_CAPABILITIES.Aggregate.Add"
          disable-mode
          @click="handleAddChildRoute"
        >
          新增子路由
        </AuthButton>
        <AuthButton
          v-if="form.id && !form.is_default"
          type="danger"
          :icon="Delete"
          :capability="ALERT_CAPABILITIES.Aggregate.Delete"
          disable-mode
          @click="handleDeleteRoute"
        >
          删除路由
        </AuthButton>
      </template>

      <el-button v-if="activeTab === 'config' && isEditing" @click="handleCancelEdit"> 取消 </el-button>

      <AuthButton
        type="primary"
        :icon="primaryBtn.icon"
        :loading="primaryBtn.loading"
        :capability="primaryBtn.capability"
        disable-mode
        @click="primaryBtn.click"
      >
        {{ primaryBtn.label }}
      </AuthButton>
    </template>

    <div class="aggregate-route-page" v-loading="loading">
      <div v-if="!loading && routes.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h4 class="empty-title">暂无聚合路由</h4>
        <p class="empty-description">创建默认根路由后，即可继续添加不同场景的子路由</p>
        <AuthButton
          type="primary"
          :icon="Setting"
          :capability="ALERT_CAPABILITIES.Aggregate.Add"
          disable-mode
          @click="handleCreateRootRoute"
        >
          创建默认路由
        </AuthButton>
      </div>

      <div v-else class="route-workbench">
        <!-- 路由树组件 -->
        <RouteTree
          :routes="routes"
          :selected-route-id="selectedRouteId"
          @select="handleSelectRoute"
          @reorder="handleReorderRoute"
        />

        <main class="route-editor-panel">
          <div class="editor-tabs-bar">
            <CustomTabs
              class="route-editor-tabs"
              :tabs="editorTabs"
              :default-active="activeTab"
              no-margin
              @tab-change="handleTabChange"
            >
              <template #default>
                <div v-if="activeTab === 'config'" class="tab-pane-content">
                  <!-- 1. 只读查看模式 -->
                  <template v-if="!isEditing && selectedRoute">
                    <div class="route-read-view">
                      <!-- 匹配条件面板 -->
                      <section class="read-view-section">
                        <div class="read-view-section-title">
                          <el-icon><Filter /></el-icon>
                          <span>匹配条件</span>
                        </div>
                        <div class="read-view-content">
                          <div class="meta-field">
                            <span class="field-label">告警级别</span>
                            <div class="field-value">
                              <template v-if="selectedRoute.levels && selectedRoute.levels.length > 0">
                                <el-tag
                                  v-for="lvl in selectedRoute.levels"
                                  :key="lvl"
                                  size="small"
                                  type="info"
                                  class="level-read-tag"
                                >
                                  {{ getLevelLabel(lvl) }}
                                </el-tag>
                              </template>
                              <span v-else class="empty-field-text">不限级别 (默认匹配所有级别)</span>
                            </div>
                          </div>

                          <div class="meta-field">
                            <span class="field-label">标签匹配器</span>
                            <div class="field-value">
                              <template v-if="selectedRoute.matchers && selectedRoute.matchers.length > 0">
                                <div class="matcher-read-tags">
                                  <el-tag
                                    v-for="(m, i) in selectedRoute.matchers"
                                    :key="i"
                                    size="small"
                                    effect="plain"
                                    class="matcher-read-tag"
                                  >
                                    {{ formatMatcher(m) }}
                                  </el-tag>
                                </div>
                              </template>
                              <span v-else class="empty-field-text">不限条件 (默认匹配所有告警)</span>
                            </div>
                          </div>
                        </div>
                      </section>
                      <!-- 最终生效配置组件 -->
                      <RouteEffectiveConfig v-if="currentEffective" :effective="currentEffective" :routes="routes" />
                    </div>
                  </template>

                  <!-- 2. 编辑模式 -->
                  <RouteConfigForm v-else-if="isEditing" ref="routeFormRef" :form="form" />
                </div>

                <div v-else-if="activeTab === 'sandbox'" class="tab-pane-content">
                  <!-- 沙箱验证组件 -->
                  <RoutePreviewSandbox
                    ref="previewSandboxRef"
                    :workspace-id="workspaceId"
                    :routes="routes"
                    v-model:previewing="sandboxPreviewing"
                  />
                </div>
              </template>
            </CustomTabs>
          </div>
        </main>
      </div>
    </div>
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue"
import { Check, Plus, Refresh, Setting, Search, Delete, Edit, Filter } from "@element-plus/icons-vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { MATCH_TYPE_OPTIONS } from "@/common/constants/match-type"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"
import RouteTree from "./components/RouteTree.vue"
import RouteConfigForm from "./components/RouteConfigForm.vue"
import RouteEffectiveConfig from "./components/RouteEffectiveConfig.vue"
import RoutePreviewSandbox from "./components/RoutePreviewSandbox.vue"
import { useAggregateRoutes, getLevelLabel } from "./composables/useAggregateRoutes"

const props = defineProps<{ workspaceId: number }>()

const emit = defineEmits<{
  refresh: []
}>()

// 引入逻辑控制器层
const {
  loading,
  saving,
  routes,
  selectedRouteId,
  isEditing,
  activeTab,
  sandboxPreviewing,
  form,
  selectedRoute,
  currentEffective,
  canAddChild,
  routeFormRef,
  previewSandboxRef,
  handleTabChange,
  loadRoutes,
  handleSelectRoute,
  handleReorderRoute,
  handleDeleteRoute,
  handleCreateRootRoute,
  handleAddChildRoute,
  handleCancelEdit,
  handleSaveRoute
} = useAggregateRoutes(toRef(props, "workspaceId"), emit)

const editorTabs = [
  { name: "config", label: "路由配置" },
  { name: "sandbox", label: "沙箱验证" }
]

// 编辑/保存动作按钮配置
const primaryBtn = computed(() => {
  if (activeTab.value === "sandbox") {
    return {
      label: "执行验证",
      icon: Search,
      loading: sandboxPreviewing.value,
      capability: ALERT_CAPABILITIES.Aggregate.Add,
      click: () => previewSandboxRef.value?.handlePreview()
    }
  }

  if (!isEditing.value) {
    return {
      label: "编辑",
      icon: Edit,
      loading: false,
      capability: form.value.id ? ALERT_CAPABILITIES.Aggregate.Edit : ALERT_CAPABILITIES.Aggregate.Add,
      click: () => {
        isEditing.value = true
      }
    }
  }

  return {
    label: "保存",
    icon: Check,
    loading: saving.value,
    capability: form.value.id ? ALERT_CAPABILITIES.Aggregate.Edit : ALERT_CAPABILITIES.Aggregate.Add,
    click: handleSaveRoute
  }
})

const primaryAction = computed(() => ({
  label: "新增子路由",
  icon: Plus,
  capability: ALERT_CAPABILITIES.Aggregate.Add,
  disabled: !canAddChild.value
}))

function formatMatcher(matcher: any) {
  const opt = MATCH_TYPE_OPTIONS.find((o) => o.value === matcher.type)
  if (!opt) return `${matcher.name} = ${matcher.value}`
  if (opt.requiresValue) {
    return `${matcher.name} ${opt.operatorText} "${matcher.value}"`
  }
  return `${matcher.name} ${opt.operatorText}`
}
</script>

<style lang="scss" scoped>
.aggregate-route-page {
  display: flex;
  flex: 1;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex: 1;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #ffffff;

  .empty-icon {
    margin-bottom: 14px;
    color: #94a3b8;
    font-size: 42px;
  }

  .empty-title {
    margin: 0 0 8px;
    color: #1f2937;
    font-size: 16px;
    font-weight: 700;
  }

  .empty-description {
    margin: 0 0 18px;
    color: #64748b;
    font-size: 13px;
  }
}

.route-workbench {
  display: grid;
  grid-template-columns: minmax(200px, 260px) minmax(0, 1fr);
  width: 100%;
  min-height: 0;
  border-radius: 0;
  background: #ffffff;
  box-shadow:
    0 4px 20px -2px rgba(51, 65, 85, 0.05),
    0 2px 6px -1px rgba(51, 65, 85, 0.03);
  transition: box-shadow 0.3s ease;
  overflow: hidden;

  &:hover {
    box-shadow:
      0 10px 25px -3px rgba(51, 65, 85, 0.08),
      0 4px 12px -2px rgba(51, 65, 85, 0.04);
  }
}

.route-editor-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.editor-tabs-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.route-editor-tabs {
  flex: 1;
  min-height: 0;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;

  :deep(.tabs-header) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: 37px;
    min-height: 37px;
    padding-right: 0;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  :deep(.tab-item) {
    height: 36px;
    min-height: 36px;
    padding: 0 12px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;

    &:hover {
      color: #3b82f6;
      background: #f1f5f9;
    }

    &.active {
      color: #2563eb;
      background: #ffffff;

      &::after {
        width: 32px;
        height: 2px;
        background: #3b82f6;
        border-radius: 2px 2px 0 0;
      }
    }
  }

  :deep(.tabs-content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
  }
}

.tab-pane-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.route-read-view {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.read-view-section {
  padding-bottom: 0px;

  .read-view-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    position: relative;
    padding-left: 10px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: #3b82f6;
      border-radius: 2px;
    }

    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }
  }
}

.read-view-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  padding: 16px;
}

.meta-field {
  display: flex;
  align-items: center;
  gap: 24px;

  .field-label {
    width: 90px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    flex-shrink: 0;
  }

  .field-value {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
}

.level-read-tag {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 500;
}

.matcher-read-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.matcher-read-tag {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-weight: 500;
}

.empty-field-text {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 1024px) {
  .route-workbench {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .route-editor-tabs {
    :deep(.tabs-header) {
      padding-right: 0;
    }
  }
}
</style>
