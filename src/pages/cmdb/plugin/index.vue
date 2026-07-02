<template>
  <ProGovernanceLayout
    title="插件中心"
    subtitle=""
    v-model:keyword="keyword"
    search-placeholder="搜索插件名称或绑定模型"
    @search="void loadPlugins()"
    @refresh="loadPlugins"
  >
    <div class="plugin-page">
      <div class="plugin-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-header-text">
            <div class="sidebar-title-row">
              <h3>插件目录</h3>
              <span class="sidebar-count">{{ filteredPlugins.length }}</span>
            </div>
          </div>
        </div>

        <div v-if="pluginsLoading" class="sidebar-loading" v-loading="true" />

        <template v-else>
          <div v-if="filteredPlugins.length" class="plugin-list">
            <button
              v-for="item in filteredPlugins"
              :key="item.uid"
              type="button"
              class="plugin-list-item"
              :class="{ 'is-active': activePluginUid === item.uid }"
              @click="selectPlugin(item.uid)"
            >
              <div class="plugin-list-leading">
                <div class="plugin-list-main">
                  <div class="plugin-list-title">
                    <span>{{ item.name }}</span>
                  </div>
                </div>
              </div>

              <div class="plugin-list-meta">
                <span>{{ item.binding_count }} 模型</span>
                <span class="meta-separator" />
                <span>{{ item.action_count }} 动作</span>
              </div>
            </button>
          </div>

          <div v-else class="sidebar-empty">
            <el-empty description="没有匹配的插件" :image-size="60" />
          </div>
        </template>
      </div>

      <div class="plugin-content">
        <div v-if="activePluginCard" class="plugin-overview">
          <section class="workspace-hero">
            <div class="overview-main">
              <div class="overview-copy">
                <div class="overview-title-row">
                  <h3>{{ activePluginCard.name }}</h3>
                  <el-tag size="small" effect="plain">{{ activePluginCard.type }}</el-tag>
                </div>
              </div>
            </div>

            <div class="overview-actions">
              <AuthButton
                v-if="hasBindingEditDraft"
                class="overview-action-btn is-save"
                :capability="CMDB_CAPABILITIES.Plugin.BindingUpsert"
                :loading="savingBindingEdit"
                disable-mode
                @click="saveBindingEdit"
              >
                <el-icon><Check /></el-icon>
                <span>保存</span>
              </AuthButton>

              <AuthButton
                v-else
                class="overview-action-btn"
                :class="hasDefaultSchemaPreview ? 'is-save' : 'is-create'"
                :capability="CMDB_CAPABILITIES.Plugin.BindingUpsert"
                :loading="savingDefaultBindingDraft"
                disable-mode
                @click="handleDefaultBindingDraft(activePluginCard)"
              >
                <el-icon>
                  <Check v-if="hasDefaultSchemaPreview" />
                  <Plus v-else />
                </el-icon>
                <span>{{ hasDefaultSchemaPreview ? "保存" : "新增绑定" }}</span>
              </AuthButton>

              <el-button
                v-if="hasDefaultSchemaPreview || hasBindingEditDraft"
                class="overview-action-btn is-cancel"
                :loading="detailLoading || savingBindingEdit"
                @click="hasBindingEditDraft ? cancelBindingEdit() : cancelDefaultSchemaPreview(activePluginCard.uid)"
              >
                <el-icon><Close /></el-icon>
                <span>取消</span>
              </el-button>

              <el-button
                v-else-if="!hasBindingEditDraft"
                class="overview-action-btn is-secondary"
                @click="openDetailDrawer(activePluginCard.uid)"
              >
                <el-icon><ArrowRight /></el-icon>
                <span>查看详情</span>
              </el-button>
            </div>
          </section>

          <div class="workspace-body">
            <section class="workspace-stage">
              <div class="stage-header">
                <div class="stage-header-main">
                  <div class="graph-view-switcher">
                    <button
                      type="button"
                      class="view-switcher-btn"
                      :class="{ 'is-active': graphViewMode === 'binding' }"
                      @click="graphViewMode = 'binding'"
                    >
                      模型链路
                    </button>
                    <button
                      type="button"
                      class="view-switcher-btn"
                      :class="{ 'is-active': graphViewMode === 'action' }"
                      @click="graphViewMode = 'action'"
                    >
                      动作能力
                    </button>
                  </div>
                </div>

                <div class="stage-toolbar">
                  <template v-if="pluginDetail?.bindings?.length">
                    <div class="binding-tabs" role="tablist" aria-label="绑定模型切换">
                      <button
                        v-for="binding in pluginDetail.bindings"
                        :key="binding.uid"
                        type="button"
                        class="binding-tab"
                        :class="{ 'is-active': activeBindingUid === binding.uid }"
                        @click="activeBindingUid = binding.uid"
                      >
                        <span class="binding-tab-name">{{ binding.model_name || binding.model_uid }}</span>
                        <span v-if="binding.group_name" class="binding-tab-meta">{{ binding.group_name }}</span>
                      </button>
                    </div>
                  </template>
                  <el-button v-else text type="primary" @click="openDetailDrawer(activePluginCard.uid)"
                    >加载绑定详情</el-button
                  >
                </div>
              </div>

              <div class="stage-canvas">
                <div v-if="activeBindingDetail && graphViewMode === 'binding'" class="binding-status-panel is-floating">
                  <div
                    class="binding-state-control"
                    :class="{
                      'is-enabled': activeBindingDetail.enabled,
                      'is-disabled': !canToggleBindingEnabled
                    }"
                  >
                    <span class="binding-state-dot" />
                    <span class="binding-state-text">
                      {{ activeBindingDetail.enabled ? "启用中" : "已停用" }}
                    </span>
                    <span class="binding-state-divider" />
                    <el-switch
                      class="binding-state-switch"
                      :model-value="activeBindingDetail.enabled"
                      :before-change="toggleActiveBindingEnabled"
                      :loading="togglingBindingEnabled"
                      :disabled="!canToggleBindingEnabled"
                      size="small"
                    />
                  </div>
                </div>

                <PluginBindingTopology
                  :binding="activeBindingDetail"
                  :loading="detailLoading"
                  :models="modelOptions"
                  :actions="pluginDetail?.plugin.actions || activePluginCard.actions"
                  :mode="graphViewMode"
                  :editable="isTopologyEditable"
                  :can-edit="canStartBindingEdit"
                  @start-edit="startBindingEdit(activePluginCard.uid)"
                  @update-binding-model="handleDraftModelChange"
                  @update-node="updateDraftGraphNode"
                  @update-field-mapping="updateDraftFieldMapping"
                />
              </div>
            </section>
          </div>
        </div>

        <div v-else class="plugin-blank-state">
          <el-empty description="暂无可展示的插件" :image-size="120" />
        </div>
      </div>
    </div>

    <PluginDetailDrawer
      v-model="detailVisible"
      :loading="detailLoading"
      :plugin-detail="pluginDetail"
      :models="pluginEnums?.models || []"
    />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ArrowRight, Check, Close, Plus } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import PluginBindingTopology from "./components/PluginBindingTopology.vue"
import PluginDetailDrawer from "./components/PluginDetailDrawer.vue"
import { usePluginCenter } from "./composables/usePluginCenter"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"

const {
  activeBindingDetail,
  activeBindingUid,
  activePluginCard,
  activePluginUid,
  cancelBindingEdit,
  cancelDefaultSchemaPreview,
  detailLoading,
  detailVisible,
  filteredPlugins,
  graphViewMode,
  handleDefaultBindingDraft,
  hasBindingEditDraft,
  hasDefaultSchemaPreview,
  isTopologyEditable,
  keyword,
  loadPlugins,
  modelOptions,
  openDetailDrawer,
  pluginDetail,
  pluginEnums,
  pluginsLoading,
  selectPlugin,
  saveBindingEdit,
  savingBindingEdit,
  startBindingEdit,
  savingDefaultBindingDraft,
  toggleActiveBindingEnabled,
  togglingBindingEnabled,
  updateDraftBindingModel,
  updateDraftFieldMapping,
  updateDraftGraphNode
} = usePluginCenter()

const { hasPermission } = usePermission()

const canStartBindingEdit = computed(
  () =>
    !hasDefaultSchemaPreview.value &&
    !hasBindingEditDraft.value &&
    graphViewMode.value === "binding" &&
    !!activeBindingDetail.value &&
    hasPermission(CMDB_CAPABILITIES.Plugin.BindingUpsert)
)

const canToggleBindingEnabled = computed(
  () =>
    !!activeBindingDetail.value &&
    !hasDefaultSchemaPreview.value &&
    !hasBindingEditDraft.value &&
    hasPermission(CMDB_CAPABILITIES.Plugin.BindingUpsert)
)

const handleDraftModelChange = (modelUid: unknown) => {
  const binding = activeBindingDetail.value
  if (!binding) return
  updateDraftBindingModel(binding.uid, String(modelUid))
}
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.manager-header) {
  align-items: center;
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(280px, 24vw, 360px);
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: 12px;
}

.plugin-page {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #f9fbfd 0%, #f6f9fc 100%);
  border: 1px solid #e7edf4;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.plugin-sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 232px;
  min-width: 232px;
  background: rgba(244, 247, 251, 0.9);
  border-right: 1px solid #e7edf4;
}

.sidebar-header,
.detail-section-header,
.stage-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
  }
}

.sidebar-header {
  padding: 16px 16px 14px;
  background: transparent;
  border-bottom: 1px solid #e7edf4;
}

.sidebar-header-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  color: #475569;
  background: rgba(226, 232, 240, 0.86);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.sidebar-loading {
  flex: 1;
  min-height: 0;
}

.plugin-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  overflow-y: auto;
}

.plugin-list-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #e2e8f0;
    background: rgba(255, 255, 255, 0.72);
  }

  &.is-active {
    background: rgba(255, 255, 255, 0.92);
    border-color: #bfdbfe;
    box-shadow:
      inset 2px 0 0 #3b82f6,
      0 8px 18px rgba(59, 130, 246, 0.08);
  }
}

.plugin-list-leading {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.plugin-list-main {
  min-width: 0;
  flex: 1;
}

.plugin-list-title {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 20px;

  span {
    min-width: 0;
    overflow: hidden;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.plugin-list-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.meta-separator {
  width: 3px;
  height: 3px;
  background: #cbd5e1;
  border-radius: 999px;
}

.sidebar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  padding: 24px;
}

.plugin-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 0;
  min-width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
}

.plugin-overview {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.workspace-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid #e7edf4;
}

.overview-main {
  display: flex;
  flex: 1;
  align-items: flex-start;
  min-width: 0;
}

.overview-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.overview-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }
}

.overview-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
  flex: 0 0 auto;
  width: auto;
  margin-left: auto;
}

.overview-action-btn {
  min-width: 0;
  height: 36px;
  margin: 0;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  :deep(.el-icon) {
    font-size: 15px;
  }

  &.is-create {
    --el-button-text-color: #2563eb;
    --el-button-bg-color: #f8fbff;
    --el-button-border-color: #dbeafe;
    --el-button-hover-text-color: #1d4ed8;
    --el-button-hover-bg-color: #eff6ff;
    --el-button-hover-border-color: #bfdbfe;
    --el-button-active-text-color: #1d4ed8;
    --el-button-active-bg-color: #dbeafe;
    --el-button-active-border-color: #93c5fd;
  }

  &.is-save {
    --el-button-text-color: #15803d;
    --el-button-bg-color: #fbfefc;
    --el-button-border-color: #dcfce7;
    --el-button-hover-text-color: #166534;
    --el-button-hover-bg-color: #f0fdf4;
    --el-button-hover-border-color: #bbf7d0;
    --el-button-active-text-color: #166534;
    --el-button-active-bg-color: #dcfce7;
    --el-button-active-border-color: #86efac;
  }

  &.is-secondary {
    --el-button-text-color: #475569;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #cbd5e1;
    --el-button-hover-text-color: #334155;
    --el-button-hover-bg-color: #f8fafc;
    --el-button-hover-border-color: #94a3b8;
    --el-button-active-text-color: #334155;
    --el-button-active-bg-color: #f1f5f9;
    --el-button-active-border-color: #94a3b8;
  }

  &.is-cancel {
    --el-button-text-color: #64748b;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d7dde5;
    --el-button-hover-text-color: #475569;
    --el-button-hover-bg-color: #f8fafc;
    --el-button-hover-border-color: #cbd5e1;
    --el-button-active-text-color: #475569;
    --el-button-active-bg-color: #f1f5f9;
    --el-button-active-border-color: #cbd5e1;
  }

  &.is-danger {
    --el-button-text-color: #b91c1c;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #fecaca;
    --el-button-hover-text-color: #991b1b;
    --el-button-hover-bg-color: #fef2f2;
    --el-button-hover-border-color: #fca5a5;
    --el-button-active-text-color: #991b1b;
    --el-button-active-bg-color: #fee2e2;
    --el-button-active-border-color: #f87171;
  }
}

.workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.workspace-stage {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.stage-header {
  align-items: center;
  padding: 0 2px 12px;
}

.stage-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.graph-view-switcher {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.view-switcher-btn {
  height: 30px;
  padding: 0 12px;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  &.is-active {
    color: #0f172a;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  }
}

.stage-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.binding-tabs {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
}

.stage-canvas {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.binding-status-panel {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: auto;
  white-space: nowrap;

  &.is-floating {
    position: absolute;
    top: 10px;
    left: 14px;
    z-index: 6;
    margin-left: 0;
  }
}

.binding-state-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 8px 4px 10px;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #dbe3ed;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    opacity 0.18s ease;

  &.is-enabled {
    color: #15803d;
    background: #fbfefc;
    border-color: #bbf7d0;

    .binding-state-dot {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
    }
  }

  &.is-disabled {
    opacity: 0.62;
  }
}

.binding-state-dot {
  flex: 0 0 6px;
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 999px;
}

.binding-state-text {
  color: currentColor;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.binding-state-divider {
  width: 1px;
  height: 16px;
  background: #e2e8f0;
}

.binding-state-switch {
  :deep(.el-switch__core) {
    min-width: 32px;
    height: 18px;
    border-color: #cbd5e1;
  }

  :deep(.el-switch__action) {
    width: 14px;
    height: 14px;
  }

  &.is-checked :deep(.el-switch__core) {
    border-color: #22c55e;
    background-color: #22c55e;
  }
}

.binding-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: 7px 11px;
  color: #475569;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    color: #0f172a;
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &.is-active {
    color: #0f172a;
    background: #eff6ff;
    border-color: #bfdbfe;
    box-shadow: 0 0 0 1px rgba(191, 219, 254, 0.8);
  }
}

.binding-tab-name {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.binding-tab-meta {
  color: #64748b;
  font-size: 11px;
  line-height: 1.2;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.binding-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e8eef5;
  border-radius: 8px;
}

.binding-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.binding-title.is-subtle {
  color: #334155;
  font-size: 13px;
}

.binding-header-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.binding-caption {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.binding-meta,
.spec-node-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.detail-section {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e7edf4;
  border-radius: 8px;
}

@media (max-width: 1200px) {
  .plugin-page {
    flex-direction: column;
  }

  .plugin-sidebar {
    width: 100%;
    min-width: 0;
    max-height: 340px;
    border-right: 0;
    border-bottom: 1px solid #e7edf4;
  }

  .workspace-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .overview-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-left: 0;
  }
}

@media (max-width: 860px) {
  .workspace-hero,
  .stage-header {
    padding-left: 14px;
    padding-right: 14px;
  }

  .workspace-body {
    padding: 12px;
  }

  .stage-header-main {
    width: 100%;
    justify-content: space-between;
  }

  .binding-tabs {
    width: 100%;
  }

  .binding-status-panel {
    &:not(.is-floating) {
      width: 100%;
      justify-content: flex-end;
      margin-left: 0;
    }
  }

  .binding-status-panel.is-floating {
    top: 12px;
    left: 12px;
  }
}

.plugin-blank-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: #ffffff;
  border-radius: 8px;
}

@media (max-width: 640px) {
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

  .overview-action-btn {
    width: 100%;
  }

  .plugin-list-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .plugin-list-meta {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
