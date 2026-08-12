<template>
  <article class="change-file" :class="{ 'has-error': errorCount > 0 }">
    <button class="file-heading" type="button" @click="expanded = !expanded">
      <span class="file-icon" :class="item.operation.toLowerCase()">
        <el-icon><component :is="operationIcon" /></el-icon>
      </span>
      <span class="file-copy">
        <strong :title="displayPath">{{ displayPath }}</strong>
        <small>
          <span class="operation" :class="item.operation.toLowerCase()">{{ operationLabel }}</span>
          <span v-if="item.language">{{ item.language }}</span>
          <span v-if="item.applied_version_id">版本 #{{ item.applied_version_id }}</span>
          <span v-if="item.diagnostics?.length">{{ item.diagnostics.length }} 项检查结果</span>
        </small>
      </span>
      <el-icon class="expand-icon" :class="{ expanded }"><ArrowRight /></el-icon>
    </button>

    <div v-if="expanded" class="file-detail">
      <div v-if="item.diagnostics?.length" class="diagnostics">
        <div
          v-for="diagnostic in item.diagnostics"
          :key="`${diagnostic.code}-${diagnostic.message}`"
          :class="diagnostic.severity.toLowerCase()"
        >
          <el-icon><WarningFilled /></el-icon>
          <span>{{ diagnostic.message }}</span>
        </div>
      </div>

      <pre v-if="hasCodePreview" class="code-preview"><code>{{ item.code }}</code></pre>

      <div class="file-actions">
        <span v-if="hasCodePreview">{{ codeLineCount }} 行</span>
        <span v-else>{{ operationLabel }}文件</span>
        <el-button v-if="canLoad" text type="primary" size="small" @click.stop="$emit('load', item)">
          载入当前编辑器
        </el-button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { ArrowRight, Delete, Document, EditPen, WarningFilled } from "@element-plus/icons-vue"
import { AIChangeOperation, AIDiagnosticSeverity } from "@/api/task/codeassist/ai.enums"
import type { AIChangeItem } from "@/api/task/codeassist/types"

const props = defineProps<{
  item: AIChangeItem
  activeFileId: number
}>()

defineEmits<{ (event: "load", item: AIChangeItem): void }>()

const expanded = ref(false)
const operationLabels: Record<AIChangeOperation, string> = {
  [AIChangeOperation.CREATE]: "新建",
  [AIChangeOperation.UPDATE]: "修改",
  [AIChangeOperation.RENAME]: "重命名",
  [AIChangeOperation.DELETE]: "删除"
}
const operationLabel = computed(() => operationLabels[props.item.operation])
const operationIcon = computed(() => {
  if (props.item.operation === AIChangeOperation.RENAME) return EditPen
  if (props.item.operation === AIChangeOperation.DELETE) return Delete
  return Document
})
const displayPath = computed(() =>
  props.item.operation === AIChangeOperation.RENAME && props.item.source_path
    ? `${props.item.source_path} -> ${props.item.path}`
    : props.item.path
)
const hasCodePreview = computed(
  () => props.item.operation === AIChangeOperation.CREATE || props.item.operation === AIChangeOperation.UPDATE
)
const errorCount = computed(
  () => props.item.diagnostics?.filter((diagnostic) => diagnostic.severity === AIDiagnosticSeverity.ERROR).length || 0
)
const canLoad = computed(
  () => props.item.operation === AIChangeOperation.UPDATE && props.item.node_id === props.activeFileId
)
const codeLineCount = computed(() => (props.item.code ? props.item.code.split("\n").length : 0))
</script>

<style scoped lang="scss">
.change-file {
  overflow: hidden;
  background: #fbfcfe;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &.has-error {
    border-color: var(--el-color-danger-light-7);
  }
}

.file-heading {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 8px 9px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.file-icon {
  display: inline-flex;
  width: 27px;
  height: 27px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: #dbeafe;
  border-radius: 7px;

  &.create {
    color: #15803d;
    background: #dcfce7;
  }

  &.rename {
    color: #7c3aed;
    background: #ede9fe;
  }

  &.delete {
    color: #b91c1c;
    background: #fee2e2;
  }
}

.file-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  strong {
    overflow: hidden;
    color: #334155;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
    color: var(--el-text-color-placeholder);
    font-size: 9px;
  }
}

.operation {
  color: #2563eb;
  font-weight: 700;

  &.create {
    color: #15803d;
  }

  &.rename {
    color: #7c3aed;
  }

  &.delete {
    color: #b91c1c;
  }
}

.expand-icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s ease;

  &.expanded {
    transform: rotate(90deg);
  }
}

.file-detail {
  border-top: 1px solid var(--el-border-color-lighter);
}

.diagnostics {
  display: flex;
  padding: 8px 9px 0;
  flex-direction: column;
  gap: 5px;

  > div {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    color: #a16207;
    font-size: 9px;
    line-height: 1.45;

    &.error {
      color: var(--el-color-danger);
    }

    .el-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }
}

.code-preview {
  max-height: 230px;
  margin: 8px 0 0;
  overflow: auto;
  padding: 10px 11px;
  color: #d7e2f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1.58;
  background: #172033;
  white-space: pre;
}

.file-actions {
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px 3px 10px;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
}
</style>
