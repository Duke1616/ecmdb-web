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
                  <el-tag size="small" :type="activePluginCard.enabled ? 'success' : 'info'" effect="light">
                    {{ activePluginCard.enabled ? "启用中" : "已停用" }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="overview-actions">
              <AuthButton
                class="overview-action-btn"
                :capability="CMDB_CAPABILITIES.Plugin.Toggle"
                disable-mode
                @click="handleToggle(activePluginCard)"
              >
                <el-icon><Switch /></el-icon>
                <span>{{ activePluginCard.enabled ? "停用插件" : "启用插件" }}</span>
              </AuthButton>

              <AuthButton
                v-if="activePluginCard.type !== 'builtin'"
                class="overview-action-btn is-danger"
                :capability="CMDB_CAPABILITIES.Plugin.Delete"
                disable-mode
                @click="handleDelete(activePluginCard)"
              >
                <el-icon><Delete /></el-icon>
                <span>删除插件</span>
              </AuthButton>

              <el-button class="overview-action-btn" @click="openDetailDrawer(activePluginCard.uid)">
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

              <PluginBindingTopology
                :binding="activeBindingDetail"
                :loading="detailLoading"
                :models="pluginEnums?.models || []"
                :actions="activePluginCard.actions"
                :mode="graphViewMode"
              />
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
import { ArrowRight, Delete, Switch } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import PluginBindingTopology from "./components/PluginBindingTopology.vue"
import PluginDetailDrawer from "./components/PluginDetailDrawer.vue"
import { usePluginCenter } from "./composables/usePluginCenter"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

const {
  activeBindingDetail,
  activeBindingUid,
  activePluginCard,
  activePluginUid,
  detailLoading,
  detailVisible,
  filteredPlugins,
  graphViewMode,
  handleDelete,
  handleToggle,
  keyword,
  loadPlugins,
  openDetailDrawer,
  pluginDetail,
  pluginEnums,
  pluginsLoading,
  selectPlugin
} = usePluginCenter()
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
  white-space: nowrap;

  &.is-danger {
    color: #dc2626;
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
  flex-wrap: wrap;
}

.binding-tabs {
  display: flex;
  align-items: stretch;
  gap: 8px;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
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
