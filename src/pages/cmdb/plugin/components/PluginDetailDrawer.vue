<template>
  <Drawer
    v-model="visible"
    title="插件详情"
    subtitle="插件定义、绑定模型与动作能力"
    :header-icon="Cpu"
    size="46%"
    :show-footer="false"
  >
    <div v-loading="loading" class="detail-drawer">
      <template v-if="pluginDetail">
        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>插件概览</span>
            </div>
          </div>

          <div class="overview-panel">
            <div class="overview-main">
              <div class="plugin-avatar">
                <AppIcon name="Cpu" fallback="Box" />
              </div>
              <div class="overview-heading">
                <div class="overview-title-row">
                  <h3>{{ pluginDetail.plugin.name }}</h3>
                  <el-tag size="small" effect="plain">{{ pluginDetail.plugin.type }}</el-tag>
                  <el-tag v-if="pluginDetail.plugin.version" size="small" type="info" effect="plain">
                    v{{ pluginDetail.plugin.version }}
                  </el-tag>
                </div>
                <p>{{ pluginDetail.plugin.uid }}</p>
              </div>
            </div>

            <div class="overview-stats">
              <div class="stat-item">
                <span>绑定模型</span>
                <strong>{{ pluginDetail.bindings.length }}</strong>
              </div>
              <div class="stat-item">
                <span>启用绑定</span>
                <strong>{{ enabledBindingCount }}</strong>
              </div>
              <div class="stat-item">
                <span>动作能力</span>
                <strong>{{ pluginDetail.plugin.actions?.length || 0 }}</strong>
              </div>
              <div class="stat-item">
                <span>最近更新</span>
                <strong>{{ formatTimestamp(pluginDetail.plugin.utime || pluginDetail.plugin.ctime) }}</strong>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-line">
                <span>插件名称</span>
                <strong>{{ pluginDetail.plugin.name }}</strong>
              </div>
              <div class="info-line">
                <span>插件 UID</span>
                <strong>{{ pluginDetail.plugin.uid }}</strong>
              </div>
              <div class="info-line">
                <span>插件类型</span>
                <strong>{{ pluginDetail.plugin.type }}</strong>
              </div>
              <div class="info-line">
                <span>当前版本</span>
                <strong>{{ pluginDetail.plugin.version || "-" }}</strong>
              </div>
              <div class="info-line">
                <span>图谱节点</span>
                <strong>{{ totalNodeCount }}</strong>
              </div>
              <div class="info-line">
                <span>图谱边</span>
                <strong>{{ totalEdgeCount }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Connection /></el-icon>
              <span>绑定模型</span>
            </div>
            <div class="title-right">{{ pluginDetail.bindings.length }} 个绑定</div>
          </div>

          <div v-if="pluginDetail.bindings.length" class="binding-list">
            <article v-for="binding in pluginDetail.bindings" :key="binding.uid" class="binding-item">
              <div class="binding-header">
                <div class="binding-model">
                  <AppIcon :name="binding.model_icon" fallback="Box" class="binding-icon" />
                  <div class="binding-copy">
                    <strong>{{ binding.model_name || binding.model_uid }}</strong>
                    <span>{{ binding.model_uid }}</span>
                  </div>
                </div>
                <el-tag :type="binding.enabled ? 'success' : 'info'" effect="light" size="small">
                  {{ binding.enabled ? "已启用" : "已停用" }}
                </el-tag>
              </div>

              <div class="binding-meta">
                <span>{{ binding.group_name || "未分组" }}</span>
                <span>入口：{{ resolveEntryNodeName(binding) }}</span>
                <span>{{ binding.graph?.nodes?.length || 0 }} 节点</span>
                <span>{{ binding.graph?.edges?.length || 0 }} 边</span>
              </div>

              <div v-if="binding.graph?.nodes?.length" class="node-strip">
                <span v-for="node in resolveBindingNodes(binding)" :key="node.id" class="node-pill">
                  {{ node.name || resolveModelName(node.model_uid) }}
                </span>
                <span v-if="(binding.graph?.nodes?.length || 0) > 6" class="node-more">
                  +{{ (binding.graph?.nodes?.length || 0) - 6 }}
                </span>
              </div>
            </article>
          </div>
          <el-empty v-else description="当前插件还没有绑定记录" :image-size="96" />
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Operation /></el-icon>
              <span>动作能力</span>
            </div>
            <div class="title-right">{{ pluginDetail.plugin.actions?.length || 0 }} 个动作</div>
          </div>

          <div v-if="pluginDetail.plugin.actions?.length" class="action-list">
            <article v-for="action in pluginDetail.plugin.actions" :key="action.action" class="action-item">
              <div class="action-main">
                <AppIcon :name="resolveActionIcon(action.icon)" fallback="Box" class="action-icon" />
                <div class="action-copy">
                  <strong>{{ action.name }}</strong>
                  <span>{{ action.action }}</span>
                </div>
              </div>
              <div class="action-tags">
                <el-tag size="small" effect="plain">{{ action.permission || "-" }}</el-tag>
                <el-tag size="small" type="info" effect="plain">
                  {{ placementLabelMap[action.placement] || action.placement }}
                </el-tag>
              </div>
            </article>
          </div>
          <el-empty v-else description="当前插件没有定义动作" :image-size="96" />
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Document /></el-icon>
              <span>原始数据</span>
            </div>
          </div>

          <pre class="json-block">{{ formatJson(pluginDetail) }}</pre>
        </section>
      </template>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Connection, Cpu, Document, Operation, Setting } from "@element-plus/icons-vue"
import { Drawer } from "@/common/components/Dialogs"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { type PluginBindingDetail, type PluginDetail, type PluginModelOption } from "@/api/cmdb/plugin/types/plugin"

const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  loading: boolean
  pluginDetail: PluginDetail | null
  models: PluginModelOption[]
}>()

const placementLabelMap: Record<string, string> = {
  "resource.detail.actions": "资源详情动作"
}

const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const enabledBindingCount = computed(() => props.pluginDetail?.bindings.filter((item) => item.enabled).length || 0)

const totalNodeCount = computed(() =>
  (props.pluginDetail?.bindings || []).reduce((count, binding) => count + (binding.graph?.nodes?.length || 0), 0)
)

const totalEdgeCount = computed(() =>
  (props.pluginDetail?.bindings || []).reduce((count, binding) => count + (binding.graph?.edges?.length || 0), 0)
)

const modelNameMap = computed(() => {
  return new Map(props.models.map((item) => [item.uid, item.name || item.uid]))
})

const normalizeTimestamp = (value: number) => {
  return value > 0 && value < 1_000_000_000_000 ? value * 1000 : value
}

const formatTimestamp = (value?: number) => {
  if (!value) return "-"
  const date = new Date(normalizeTimestamp(value))
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

const resolveEntryNodeName = (binding: PluginBindingDetail) => {
  const graph = binding.graph
  if (!graph?.entry_node_id) return "-"
  return graph.nodes?.find((node) => node.id === graph.entry_node_id)?.name || graph.entry_node_id
}

const resolveBindingNodes = (binding: PluginBindingDetail) => {
  return binding.graph?.nodes?.slice(0, 6) || []
}

const resolveModelName = (modelUid?: string) => {
  if (!modelUid) return "-"
  return modelNameMap.value.get(modelUid) || modelUid
}

const resolveActionIcon = (icon?: string) => {
  const normalized = String(icon || "")
    .trim()
    .toLowerCase()

  if (normalized === "terminal") return "fa-terminal"
  if (normalized === "folder") return "Folder"
  if (normalized === "connection") return "Connection"
  return icon || "Box"
}
</script>

<style scoped lang="scss">
.detail-drawer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 12px 16px;
  background: #fdfdfe;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;

  .title-left {
    display: flex;
    align-items: center;
  }

  .section-icon {
    margin-right: 6px;
    color: #3b82f6;
    font-size: 16px;
  }

  span {
    color: #374151;
    font-size: 14px;
    font-weight: 600;
  }

  .title-right {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }
}

.overview-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e7edf4;
  border-radius: 8px;
}

.overview-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.plugin-avatar {
  display: inline-flex;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #2563eb;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
}

.overview-heading {
  min-width: 0;
  flex: 1;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
  }

  p {
    margin: 5px 0 0;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.overview-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  background: #fbfcfe;
  border: 1px solid #edf2f7;
  border-radius: 8px;

  span {
    color: #64748b;
    font-size: 12px;
  }

  strong {
    overflow: hidden;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  padding: 10px 12px;
  background: #fbfcfe;
  border: 1px solid #edf2f7;
  border-radius: 8px;

  span {
    flex: 0 0 auto;
    color: #64748b;
    font-size: 12px;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.binding-list,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.binding-item,
.action-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e7edf4;
  border-radius: 8px;
}

.binding-header,
.action-item {
  align-items: stretch;
}

.binding-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.binding-model,
.action-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.binding-icon,
.action-icon {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  color: #2563eb;
}

.binding-copy,
.action-copy {
  min-width: 0;

  strong,
  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
  }

  span {
    margin-top: 3px;
    color: #64748b;
    font-size: 12px;
  }
}

.binding-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 8px;
    color: #475569;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    font-size: 12px;
  }
}

.node-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.node-pill,
.node-more {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 24px;
  padding: 0 8px;
  color: #1e3a8a;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.action-item {
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
}

.action-tags {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.json-block {
  max-height: 520px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .overview-stats,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-item,
  .binding-header {
    flex-direction: column;
  }

  .action-tags {
    justify-content: flex-start;
  }
}
</style>
