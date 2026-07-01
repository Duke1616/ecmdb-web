<template>
  <aside class="topology-panel" :class="{ 'is-compact': compact }">
    <div class="panel-header">
      <div class="panel-header-copy">
        <div class="panel-heading-row">
          <h4>{{ panelTitle }}</h4>
          <span class="panel-chip">{{ panelChip }}</span>
        </div>
      </div>
      <button class="panel-close" type="button" @click="emit('close')">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <template v-if="selectedNodeData.kind === 'binding'">
      <div class="panel-summary">
        <div class="summary-line">
          <span>挂载模型</span>
          <strong>{{ binding.model_name || binding.model_uid }}</strong>
        </div>
        <div class="summary-line">
          <span>{{ isActionMode ? "当前视图" : "主资源输入" }}</span>
          <strong>{{ isActionMode ? "动作能力" : selectedRootSpec?.name || "-" }}</strong>
        </div>
        <div class="summary-line">
          <span>动作</span>
          <strong>{{ actionsCount }}</strong>
        </div>
        <div class="summary-line">
          <span>{{ isActionMode ? "动作节点" : "链路节点" }}</span>
          <strong>{{ isActionMode ? actionNodeCount : specNodeCount }}</strong>
        </div>
      </div>

      <div v-if="!isActionMode && rootFieldEntries.length" class="panel-section">
        <div class="panel-section-title">主资源字段映射</div>
        <div class="field-list">
          <div v-for="[field, value] in rootFieldEntries" :key="`root-${field}`" class="field-item">
            <span class="field-name">{{ field }}</span>
            <span class="field-arrow">-></span>
            <span class="field-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="selectedNodeData.kind === 'action' && selectedNodeData.action">
      <div class="panel-summary">
        <div class="summary-line">
          <span>动作标识</span>
          <strong>{{ selectedNodeData.action.action }}</strong>
        </div>
        <div class="summary-line">
          <span>界面类型</span>
          <strong>{{ actionUiLabelMap[selectedNodeData.action.ui] || selectedNodeData.action.ui }}</strong>
        </div>
        <div class="summary-line">
          <span>触发位置</span>
          <strong>{{
            actionPlacementLabelMap[selectedNodeData.action.placement] || selectedNodeData.action.placement
          }}</strong>
        </div>
      </div>
    </template>

    <template v-else-if="selectedSpecNode">
      <div class="panel-summary">
        <div class="summary-line">
          <span>数量</span>
          <strong>{{ cardinalityLabelMap[selectedSpecNode.cardinality] || selectedSpecNode.cardinality }}</strong>
        </div>
        <div class="summary-line">
          <span>必需</span>
          <strong>{{ selectedSpecNode.required ? "是" : "否" }}</strong>
        </div>
        <div class="summary-line">
          <span>关系</span>
          <strong>{{
            relationLabelMap[selectedSpecNode.relation_type || ""] || selectedSpecNode.relation_type || "根节点"
          }}</strong>
        </div>
        <div class="summary-line">
          <span>方向</span>
          <strong>{{
            directionLabelMap[selectedSpecNode.direction || ""] ||
            (selectedSpecNode.direction ? selectedSpecNode.direction : "绑定资源")
          }}</strong>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">字段映射</div>
        <div v-if="fieldEntries.length" class="field-list">
          <div v-for="[field, value] in fieldEntries" :key="`${selectedSpecNode.name}-${field}`" class="field-item">
            <span class="field-name">{{ field }}</span>
            <span class="field-arrow">-></span>
            <span class="field-value">{{ value }}</span>
          </div>
        </div>
        <div v-else class="section-empty">没有字段映射</div>
      </div>

      <div v-if="selectedSpecNode.required_fields?.length" class="panel-section">
        <div class="panel-section-title">必填字段</div>
        <div class="tag-list">
          <span v-for="field in selectedSpecNode.required_fields" :key="field" class="field-tag is-required">
            {{ field }}
          </span>
        </div>
      </div>

      <div v-if="selectedSpecNode.filters?.length" class="panel-section">
        <div class="panel-section-title">过滤条件</div>
        <div class="filter-list">
          <div
            v-for="filter in selectedSpecNode.filters"
            :key="`${filter.field}-${filter.operator}-${String(filter.value)}`"
            class="filter-item"
          >
            <span>{{ filter.field }}</span>
            <span>{{ filter.operator }}</span>
            <span>{{ String(filter.value) }}</span>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue"
import type { PluginBindingDetail, ResourceSpec } from "@/api/cmdb/plugin/types/plugin"
import {
  actionPlacementLabelMap,
  actionUiLabelMap,
  cardinalityLabelMap,
  directionLabelMap,
  relationLabelMap
} from "./usePluginTopologyGraph"
import type { TopologyNodeData } from "./types"

defineProps<{
  actionNodeCount: number
  actionsCount: number
  binding: PluginBindingDetail
  compact: boolean
  fieldEntries: Array<[string, string]>
  isActionMode: boolean
  panelChip: string
  panelTitle: string
  rootFieldEntries: Array<[string, string]>
  selectedNodeData: TopologyNodeData
  selectedRootSpec: ResourceSpec | null
  selectedSpecNode: ResourceSpec | null
  specNodeCount: number
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped lang="scss">
.topology-panel {
  position: relative;
  flex: 0 0 328px;
  width: 328px;
  min-width: 328px;
  max-width: 328px;
  padding: 18px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.topology-panel.is-compact {
  flex: 0 0 clamp(280px, 34vw, 328px);
  width: clamp(280px, 34vw, 328px);
  min-width: 280px;
  max-width: 328px;
  max-height: none;
}

.topology-panel::-webkit-scrollbar {
  width: 8px;
}

.topology-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.topology-panel::-webkit-scrollbar-track {
  background: transparent;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-header-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .panel-heading-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }

  h4 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }
}

.panel-chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
  white-space: nowrap;
}

.panel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #e5ebf3;
  border-radius: 10px;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    color: #334155;
    background: #ffffff;
    border-color: #d7e1ec;
  }
}

.panel-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  background: #fbfcfe;
  border: 1px solid #edf2f7;
  border-radius: 10px;

  span,
  strong {
    min-width: 0;
  }

  span {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    text-align: right;
    word-break: break-word;
  }
}

.panel-section {
  margin-top: 20px;
}

.panel-section-title {
  margin-bottom: 12px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.section-empty {
  color: #94a3b8;
  font-size: 12px;
}

.field-list,
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-item,
.filter-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 11px 14px;
  background: #ffffff;
  border: 1px solid #e8eef5;
  border-radius: 10px;
  font-size: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.field-name,
.field-value,
.field-arrow,
.filter-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-name {
  color: #0f172a;
  font-weight: 600;
}

.field-arrow {
  color: #c0cad7;
}

.field-value,
.filter-item span:last-child {
  color: #0369a1;
  font-weight: 600;
  text-align: right;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.field-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #e8eef5;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;

  &.is-required {
    color: #0f4c81;
    background: #eef6ff;
    border-color: #d8e8fb;
  }
}

@media (max-width: 640px) {
  .field-item,
  .filter-item {
    grid-template-columns: 1fr;
  }

  .field-value,
  .filter-item span:last-child {
    text-align: left;
  }

  .summary-line {
    align-items: flex-start;
    flex-direction: column;

    strong {
      text-align: left;
    }
  }
}
</style>
