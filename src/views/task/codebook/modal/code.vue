<template>
  <div class="code-page">
    <!-- 代码编辑器容器 -->
    <div class="editor-container">
      <div class="editor-wrapper">
        <div class="editor-header">
          <div class="editor-info">
            <span class="language-badge">{{ formData.language || "python" }}</span>
            <span class="file-name">{{ formData.name || "untitled" }}</span>
          </div>
          <div class="editor-actions">
            <el-button size="small" @click="formatCode" class="format-btn">
              <el-icon><Edit /></el-icon>
              格式化
            </el-button>
            <el-button size="small" @click="clearCode" class="clear-btn">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <div class="code-editor">
          <CodeMirror
            ref="codeMirrorRef"
            :code="formData.code"
            :language="formData.language"
            :is-create="!formData.id"
            @update:code="handleCodeUpdate"
            @update:language="handleLanguageUpdate"
          />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <FormActions
      :show-previous="true"
      :show-next="false"
      :show-save="true"
      :show-cancel="true"
      :previous-text="'上一步'"
      :save-text="formData.id ? '保存修改' : '创建脚本'"
      :cancel-text="'取消'"
      @previous="previous"
      @save="save"
      @cancel="close"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { Edit, Delete } from "@element-plus/icons-vue"
import CodeMirror from "@@/components/CodeEditor/index.vue"
import FormActions from "@@/components/FormActions/index.vue"
import { type createOrUpdateCodebookReq } from "@/api/codebook/types/codebook"
import { ElMessage } from "element-plus"
import { useFormHandler } from "@@/composables/useFormHandler"

interface Props {
  formData: createOrUpdateCodebookReq
}

interface Emits {
  (e: "update:formData", data: createOrUpdateCodebookReq): void
  (e: "previous"): void
  (e: "save"): void
  (e: "close"): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const { localFormData, updateFormData, previous, save, close, setFormData } = useFormHandler(
  props.formData,
  emits,
  "codebook"
)

const codeMirrorRef = ref()

// 代码更新处理
const handleCodeUpdate = (code: string) => {
  localFormData.value = { ...localFormData.value, code }
  updateFormData()
}

// 语言更新处理
const handleLanguageUpdate = (language: string) => {
  localFormData.value = { ...localFormData.value, language }
  updateFormData()
}

// 格式化代码
const formatCode = () => {
  if (codeMirrorRef.value) {
    codeMirrorRef.value.formatCode()
    ElMessage.success("代码格式化完成")
  }
}

// 清空代码
const clearCode = () => {
  if (codeMirrorRef.value) {
    codeMirrorRef.value.setCode("")
    localFormData.value = { ...localFormData.value, code: "" }
    updateFormData()
    ElMessage.success("代码已清空")
  }
}

// 监听 props.formData 的变化，同步到 localFormData
watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.code-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
  text-align: left; /* 覆盖 WizardContainer 的 text-align: center */
}

/* 编辑器容器 - 参考 designer 的布局 */
.editor-container {
  flex: 1;
  padding: 0px;
  overflow: hidden;

  .editor-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 100%;
    margin: 0;
    height: 100%;
    display: flex;
    flex-direction: column;

    .editor-header {
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      flex-shrink: 0;

      .editor-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .language-badge {
          padding: 4px 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .file-name {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
      }

      .editor-actions {
        display: flex;
        gap: 8px;

        .format-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          padding: 6px 12px;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
        }

        .clear-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          padding: 6px 12px;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
        }
      }
    }

    .code-editor {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: #fafafa;
      min-height: 0;
      display: flex;
      flex-direction: column;

      :deep(.code-mirror) {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      :deep(.editor) {
        flex: 1;
        min-height: 0;
      }

      :deep(.cm-editor) {
        height: 100% !important;
        border-radius: 0;

        /* 自定义滚轮样式 */
        .cm-scroller {
          &::-webkit-scrollbar {
            width: 8px;
          }

          &::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
            transition: background 0.3s ease;

            &:hover {
              background: #94a3b8;
            }
          }
        }
      }
    }
  }
}
</style>
