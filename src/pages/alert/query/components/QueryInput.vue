<template>
  <div class="query-input-wrapper">
    <div class="query-group-container">
      <div class="metrics-addon">
        <el-icon class="addon-icon"><TrendCharts /></el-icon>
        <span class="addon-text">PromQL</span>
      </div>

      <div class="editor-container">
        <codemirror
          v-model="modelValue"
          placeholder="输入 PromQL 查询语句，按 Cmd/Ctrl + Enter 执行查询"
          :style="{ fontSize: '13px', fontFamily: 'Menlo, Monaco, Consolas, monospace' }"
          :autofocus="true"
          :indent-with-tab="true"
          :tab-size="2"
          :extensions="extensions"
          class="h-full"
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
import { TrendCharts } from "@element-plus/icons-vue"

// NOTE: QueryInput 是纯表单输入组件，使用 defineModel 进行双向绑定
const modelValue = defineModel<string>({ required: true })

defineEmits<{
  execute: []
}>()

// CodeMirror 扩展 (使用 markdown 作为 PromQL 的临时语法高亮)
const extensions = [markdown()]
</script>

<style lang="scss" scoped>
:deep(.cm-editor) {
  height: 100%;
}

.query-input-wrapper {
  padding: 12px 16px 16px;
}

.query-group-container {
  display: flex;
  align-items: stretch;
  min-height: 38px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &:focus-within {
    border-color: #cbd5e1;
  }

  &:focus-within {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.metrics-addon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
  border-radius: 5px 0 0 5px;
  user-select: none;
  flex-shrink: 0;
}

.addon-text {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0.25rem;
  white-space: nowrap;
}

.addon-icon {
  font-size: 14px;
  color: #9ca3af;
}

.editor-container {
  flex: 1;
  min-width: 0;
  padding: 0 0 0 0.5rem;
  background: #ffffff;
  border-radius: 0 5px 5px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(.cm-editor) {
  height: auto;
  min-height: 36px;
  max-height: 120px;
  width: 100%;
  outline: none !important;
  background-color: transparent !important;

  &.cm-focused {
    outline: none !important;
  }
}

:deep(.cm-content) {
  padding: 6px 0;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  outline: none !important;
  caret-color: #374151 !important;
}

:deep(.cm-cursor) {
  border-left-color: #374151 !important;
  border-left-width: 2px;
}

:deep(.cm-line) {
  padding-left: 0;
}

:deep(.cm-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  width: 100%;
  outline: none !important;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 3px;

    &:hover {
      background-color: #d1d5db;
    }
  }
}

:deep(.cm-gutters) {
  display: none !important;
}

:deep(.cm-activeLine) {
  background-color: transparent !important;
}

:deep(.cm-placeholder) {
  color: #9ca3af;
  font-style: normal;
}
</style>
