<template>
  <div class="query-input-wrapper">
    <!-- Built-in Metrics Label -->
    <div class="metrics-sidebar group">
      <span class="metrics-text">内置指标</span>
      <el-icon class="metrics-icon"><ArrowRight /></el-icon>
    </div>

    <div class="query-editor-container flex-1">
      <!-- Code Editor -->
      <div class="editor-wrapper cm-editor-custom">
        <codemirror
          :model-value="modelValue"
          placeholder="输入查询语句. 按 Ctrl+Enter 执行查询"
          :style="{ fontSize: '13px', fontFamily: 'Menlo, Monaco, Consolas, monospace' }"
          :autofocus="true"
          :indent-with-tab="true"
          :tab-size="2"
          :extensions="extensions"
          class="h-full"
          @update:model-value="$emit('update:modelValue', $event)"
          @keydown.ctrl.enter="$emit('execute')"
          @keydown.meta.enter="$emit('execute')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Codemirror } from "vue-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { ArrowRight } from "@element-plus/icons-vue"

interface QueryInputProps {
  modelValue: string
}

defineProps<QueryInputProps>()

defineEmits<{
  "update:modelValue": [value: string]
  execute: []
}>()

// CodeMirror 扩展 (使用 markdown 作为 PromQL 的临时语法高亮)
const extensions = [markdown()]
</script>

<style lang="scss" scoped>
/* Ensure full height usage */
:deep(.cm-editor) {
  height: 100%;
}

.query-input-wrapper {
  padding: 0 1.25rem 1.25rem 1.25rem;
  border-top: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.query-editor-container {
  display: flex;
  align-items: stretch;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  min-height: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #d1d5db;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: none;
  }
}

.metrics-sidebar {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    color: #3b82f6;
  }
}

.metrics-text {
  margin-right: 0.25rem;
}

.metrics-icon {
  font-size: 12px;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Customize codemirror to look cleaner */
:deep(.cm-editor-custom .cm-editor) {
  height: auto;
  min-height: 36px;
  max-height: 110px;
  outline: none !important;
  background-color: transparent !important;
}

:deep(.cm-content) {
  padding-top: 10px;
  padding-bottom: 10px;
  font-family: Menlo, Monaco, Consolas, monospace;
  line-height: 20px;
}

:deep(.cm-line) {
  padding-left: 8px;
}

:deep(.cm-scroller) {
  overflow-y: auto !important;
}

:deep(.cm-gutters) {
  display: none !important;
}

:deep(.cm-activeLine) {
  background-color: transparent !important;
}
</style>
