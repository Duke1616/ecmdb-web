<template>
  <div class="query-input-wrapper">
    <div class="query-group-container">
      <!-- Part 1: Built-in Metrics Button (Addon) -->
      <div class="metrics-addon" role="button">
        <el-icon class="addon-icon"><TrendCharts /></el-icon>
        <span class="addon-text">内置指标</span>
        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
      </div>

      <!-- Part 2: Editor Container (Input) -->
      <div class="editor-container">
        <codemirror
          :model-value="modelValue"
          placeholder="输入 PromQL 查询语句，按 Cmd/Ctrl + Enter 执行查询"
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
import { TrendCharts, ArrowRight } from "@element-plus/icons-vue"

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
  padding: 1rem 1.5rem 1.25rem 1.5rem; // 增加顶部 padding (1rem) 与 Toolbar 隔开一点距离，左右 padding 保持与 Toolbar 一致 (1.5rem)
}

// 容器：负责整体边框和 Flex 布局
.query-group-container {
  display: flex;
  align-items: stretch; // 关键：让子元素高度一致 stretching
  min-height: 32px;
  background: white;
  border-radius: 4px;
  // 使用 box-shadow 模拟边框，避免 flex 子元素边框重叠问题，或者父级统一边框
  // 这里采用父级统一边框方案
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

// Part 1: 左侧 Addon
.metrics-addon {
  display: flex;
  align-items: center; // 垂直居中
  justify-content: center;
  padding: 0 0.75rem;
  background-color: #f9fafb; // 默认灰色背景，区分输入区
  border-right: 1px solid #e5e7eb; // 分割线
  border-radius: 3px 0 0 3px; // 左侧圆角
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: all 0.2s ease;

  // 悬停效果
  &:hover {
    background-color: #eff6ff;
    color: #3b82f6;

    .addon-icon,
    .arrow-icon,
    .addon-text {
      color: #3b82f6;
    }
  }

  &:active {
    background-color: #dbeafe;
  }
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

.arrow-icon {
  font-size: 12px;
  color: #9ca3af;
}

// Part 2: 编辑器容器
.editor-container {
  flex: 1;
  min-width: 0;
  padding: 0 0 0 0.5rem;
  background: white;
  border-radius: 0 3px 3px 0; // 右侧圆角
  display: flex;
  flex-direction: column;
  justify-content: center; // 垂直居中内容（如果只有一行）
}

/* Customize codemirror to look cleaner */
// 修正：移除 .cm-editor-custom 类，因为模板中不再包含此包裹类
:deep(.cm-editor) {
  height: auto;
  min-height: 30px;
  max-height: 120px;
  width: 100%;
  outline: none !important;
  background-color: transparent !important;

  // 确保聚集状态下也无边框
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
  outline: none !important; // 关键修复：移除输入区焦点的默认虚线框
  caret-color: #374151 !important; // 强制设置原生光标颜色(深灰色)
}

// 强制设置 CodeMirror 模拟光标样式
:deep(.cm-cursor) {
  border-left-color: #374151 !important;
  border-left-width: 2px; // 稍微加粗一点点确保可见
}

:deep(.cm-line) {
  padding-left: 0;
}

:deep(.cm-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  width: 100%;
  outline: none !important; // 双重保险

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
