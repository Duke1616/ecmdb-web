<template>
  <div class="spec-editor">
    <div class="editor-section-title">{{ title }}</div>

    <div class="readonly-grid">
      <div class="readonly-line">
        <span>节点名称</span>
        <strong>{{ node.name }}</strong>
      </div>
      <div class="readonly-line">
        <span>数量</span>
        <strong>{{ cardinalityLabelMap[node.cardinality] || node.cardinality }}</strong>
      </div>
      <div class="readonly-line">
        <span>必需</span>
        <strong>{{ node.required ? "是" : "否" }}</strong>
      </div>
      <div v-if="canShowRelation" class="readonly-line">
        <span>关系</span>
        <strong>{{ relationLabelMap[relationType || ""] || relationType || "根节点" }}</strong>
      </div>
      <div v-if="canShowRelation" class="readonly-line">
        <span>方向</span>
        <strong>{{ directionLabelMap[direction || ""] || direction || "绑定资源" }}</strong>
      </div>
    </div>

    <label class="editor-field">
      <span>替换资源模型</span>
      <ModelPicker
        :model-value="node.model_uid"
        :models="models"
        empty-text="暂无可选模型，保存后会自动创建模板模型"
        @change="(value) => updateNode({ model_uid: String(value) })"
      />
    </label>

    <div class="editor-block">
      <div class="editor-block-header">字段映射（替换模型字段）</div>

      <div v-if="fieldMappings.length" class="field-editor-list">
        <div class="field-editor-head">
          <span>插件字段（固定）</span>
          <span>模型字段（可替换）</span>
        </div>
        <div v-for="mapping in fieldMappings" :key="mapping.input" class="field-editor-row">
          <span class="field-name">{{ mapping.input }}</span>
          <span class="field-editor-arrow">-></span>
          <AttributePicker
            :model-value="mapping.resource_field"
            :manual-only="isTemplateModel(node.model_uid)"
            :model-uid="node.model_uid"
            single-display="text"
            @change="(nextValue) => emit('update-field-mapping', node, mapping.input, nextValue)"
          />
        </div>
      </div>
      <div v-else class="editor-empty">没有字段映射</div>
    </div>

    <div v-if="requiredMappings.length" class="editor-block">
      <div class="editor-block-header">必填字段</div>
      <div class="tag-list">
        <span v-for="mapping in requiredMappings" :key="mapping.input" class="field-tag is-required">
          {{ mapping.input }}
        </span>
      </div>
    </div>

    <div v-if="node.filters?.length" class="editor-block">
      <div class="editor-block-header">过滤条件</div>
      <div class="filter-list">
        <div
          v-for="filter in node.filters"
          :key="`${filter.field}-${filter.operator}-${String(filter.value)}`"
          class="filter-item"
        >
          <span>{{ filter.field }}</span>
          <span>{{ filter.operator }}</span>
          <span>{{ String(filter.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { BindingGraphNode, PluginModelOption } from "@/api/cmdb/plugin/types/plugin"
import { AttributePicker, ModelPicker } from "@/common/components/Pickers"
import { cardinalityLabelMap, directionLabelMap, relationLabelMap } from "./usePluginTopologyGraph"

const props = withDefaults(
  defineProps<{
    canShowRelation?: boolean
    direction?: string
    models: PluginModelOption[]
    node: BindingGraphNode
    relationType?: string
    title: string
  }>(),
  {
    canShowRelation: true
  }
)

const emit = defineEmits<{
  "update-field-mapping": [node: BindingGraphNode, input: string, nextValue: string]
  "update-node": [node: BindingGraphNode, patch: Partial<BindingGraphNode>]
}>()

const fieldMappings = computed(() => props.node.field_mappings || [])
const requiredMappings = computed(() => fieldMappings.value.filter((mapping) => mapping.required))

const isTemplateModel = (modelUid?: string) => {
  const model = props.models.find((item) => item.uid === modelUid)
  return model?.group_name === "保存后自动创建"
}

const updateNode = (patch: Partial<BindingGraphNode>) => {
  emit("update-node", props.node, patch)
}
</script>

<style scoped lang="scss">
.spec-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-section-title,
.editor-block-header {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.readonly-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.readonly-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 10px;
  background: #fbfcfe;
  border: 1px solid #edf2f7;
  border-radius: 8px;

  span {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    min-width: 0;
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    word-break: break-word;
  }
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  > span {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }
}

.editor-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-editor-list,
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-editor-head {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 28px;
  padding: 0 2px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}

.field-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) auto minmax(0, 1.1fr);
  gap: 8px;
  align-items: center;
}

.field-name,
.field-editor-arrow,
.filter-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-name {
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
}

.field-editor-arrow {
  color: #c0cad7;
  font-size: 12px;
  font-weight: 700;
}

.editor-empty {
  padding: 10px 12px;
  color: #94a3b8;
  background: #fbfcfe;
  border: 1px dashed #dbe4ef;
  border-radius: 8px;
  font-size: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  color: #0f4c81;
  background: #eef6ff;
  border: 1px solid #d8e8fb;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.filter-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e8eef5;
  border-radius: 8px;
  color: #475569;
  font-size: 12px;

  span:last-child {
    color: #0369a1;
    font-weight: 700;
    text-align: right;
  }
}

@media (max-width: 640px) {
  .field-editor-row,
  .filter-item {
    grid-template-columns: 1fr;
  }

  .field-editor-head {
    display: none;
  }

  .field-editor-arrow {
    display: none;
  }

  .filter-item span:last-child {
    text-align: left;
  }
}
</style>
