<template>
  <el-card class="editor-card">
    <template #header>
      <div class="card-header">
        <h3>
          {{ channelLabel || "模板内容" }}
          <span class="language-badge">{{ language.toUpperCase() }}</span>
        </h3>
        <CodeEditorToolbar
          :language="language"
          :file-name="fileName"
          :show-preview="showPreview"
          @preview="handlePreview"
          @format="handleFormat"
          @clear="handleClear"
          @theme-change="handleThemeChange"
        />
      </div>
    </template>
    <div class="editor-container">
      <!-- 分屏预览模式 -->
      <div v-if="!showPreview || previewMode === 'split'" class="editor-split">
        <div class="editor-panel">
          <CodeEditor
            ref="codeEditorRef"
            :code="modelValue"
            @update:code="handleUpdateModelValue"
            :language="language"
            :is-create="false"
            class="template-editor"
            :show-preview="showPreview && previewMode === 'split'"
            :preview-content="previewContent"
          />
        </div>
      </div>

      <!-- 全屏预览模式 -->
      <div v-else-if="showPreview && previewMode === 'fullscreen'" class="fullscreen-preview">
        <div class="preview-header">
          <span class="preview-title">预览</span>
          <el-button type="primary" size="small" @click="handlePreview"> 返回编辑 </el-button>
        </div>
        <div class="preview-content" v-html="previewContent" />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import CodeEditorToolbar from "@/common/components/CodeEditor/toolbar.vue"

interface Props {
  modelValue: string
  language: string
  fileName: string
  showPreview: boolean
  previewContent: string
  previewMode?: "split" | "fullscreen"
  channelLabel?: string
}

interface Emits {
  (e: "update:modelValue", value: string): void
  (e: "preview"): void
  (e: "format"): void
  (e: "clear"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const codeEditorRef = ref()

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

const handleThemeChange = (theme: string) => {
  if (codeEditorRef.value) {
    codeEditorRef.value.handleThemeChange?.(theme)
  }
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
  width: 100%;
  overflow: hidden;
}

.editor-panel {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

// 模板编辑器
.template-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  overflow: hidden;

  :deep(.editor) {
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow: hidden;
  }

  :deep(.cm-editor) {
    height: 100% !important;
    width: 100% !important;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    overflow: hidden;
  }

  :deep(.cm-scroller) {
    overflow: auto !important;
  }
}

// 全屏预览模式
.fullscreen-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;

    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .preview-content {
    flex: 1;
    padding: 20px;
    overflow: auto;
    min-height: 0;

    // HTML 预览样式
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 16px 0 8px 0;
      color: #1f2937;
    }

    :deep(p) {
      margin: 8px 0;
      line-height: 1.6;
      color: #374151;
    }

    :deep(strong) {
      font-weight: 600;
      color: #1f2937;
    }

    :deep(ul),
    :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
    }

    :deep(li) {
      margin: 4px 0;
      line-height: 1.6;
    }

    :deep(a) {
      color: #3b82f6;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(code) {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 13px;
    }

    :deep(pre) {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;

      code {
        background: none;
        padding: 0;
      }
    }
  }
}
</style>
