<template>
  <el-card class="editor-card">
    <template #header>
      <div class="card-header">
        <h3>
          模板内容
          <span class="language-badge">{{ language.toUpperCase() }}</span>
        </h3>
        <CodeEditorToolbar
          :language="language"
          :file-name="fileName"
          :show-preview="showPreview"
          @preview="handlePreview"
          @format="handleFormat"
          @clear="handleClear"
        />
      </div>
    </template>
    <div class="editor-container">
      <div class="editor-split">
        <div class="editor-panel">
          <CodeEditor
            :code="modelValue"
            @update:code="handleUpdateModelValue"
            :language="language"
            :is-create="false"
            class="template-editor"
            :show-preview="showPreview"
            :preview-content="previewContent"
          />
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import CodeEditorToolbar from "@/common/components/CodeEditor/toolbar.vue"

interface Props {
  modelValue: string
  language: string
  fileName: string
  showPreview: boolean
  previewContent: string
}

interface Emits {
  (e: "update:modelValue", value: string): void
  (e: "preview"): void
  (e: "format"): void
  (e: "clear"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handlePreview = () => {
  emit("preview")
}

const handleFormat = () => {
  emit("format")
}

const handleClear = () => {
  emit("clear")
}

const handleUpdateModelValue = (value: string) => {
  emit("update:modelValue", value)
}
</script>

<style lang="scss" scoped>
.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;

    .language-badge {
      background: #f3f4f6;
      color: #6b7280;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
  }
}

// CodeEditor Toolbar 样式
:deep(.editor-toolbar) {
  margin-top: 0;
  padding: 0;
  border: none;
  background: transparent;
}

// 编辑器容器
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
}

.editor-split {
  flex: 1;
  display: flex;
  min-height: 0;
}

.editor-panel {
  flex: 1;
  min-height: 0;
}

// 模板编辑器
.template-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.editor) {
    flex: 1;
    min-height: 0;
  }

  :deep(.cm-editor) {
    height: 100% !important;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }
}
</style>
