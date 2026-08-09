<template>
  <section class="editor-view">
    <div class="editor-header">
      <div class="editor-toolbar">
        <div class="editor-primary-actions">
          <AuthButton
            v-if="!isDownloadOnly"
            :capability="capabilities.CodeAssist.ViewConversation"
            disableMode
            size="small"
            class="secondary-action assistant-button"
            :type="assistantOpen ? 'primary' : 'default'"
            :plain="assistantOpen"
            :icon="MagicStick"
            @click="$emit('toggle-assistant')"
            >AI 助手</AuthButton
          >
          <AuthButton
            v-if="activeEditor.id && (!isReadonly || allowRunWhenReadonly) && !isDownloadOnly"
            :capability="capabilities.Preview.Run"
            disableMode
            size="small"
            class="secondary-action"
            :icon="VideoPlay"
            @click="$emit('run', activeEditor)"
            >试运行</AuthButton
          >
          <AuthButton
            v-if="activeEditor.id && !isReadonly && !isDownloadOnly"
            :capability="capabilities.Runner.View"
            disableMode
            size="small"
            class="secondary-action"
            :icon="Setting"
            @click="$emit('open-runner', activeEditor)"
            >执行单元</AuthButton
          >
          <AuthButton
            v-if="!isReadonly && !isDownloadOnly"
            :capability="capabilities.Codebook.Edit"
            disableMode
            size="small"
            class="save-button"
            type="primary"
            :loading="saving"
            :icon="Check"
            @click="$emit('save')"
            >保存</AuthButton
          >
        </div>

        <div class="editor-secondary-actions">
          <span v-if="isDownloadOnly" class="readonly-hint">该文件不支持在线预览，请使用下载按钮</span>
          <span v-else-if="isReadonly" class="readonly-hint">当前资源只读，仅支持查看内容</span>
          <el-button
            v-if="canOpenVersion"
            class="single-action-button"
            text
            circle
            size="small"
            title="查看版本"
            aria-label="查看版本"
            @click="$emit('open-version', activeEditor)"
          >
            <el-icon><Clock /></el-icon>
          </el-button>
          <el-button
            v-if="canEditMeta"
            class="single-action-button"
            text
            circle
            size="small"
            title="文件信息"
            aria-label="文件信息"
            @click="$emit('open-meta', activeEditor)"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button
            v-if="canDelete"
            class="single-action-button is-danger"
            text
            circle
            size="small"
            title="删除文件"
            aria-label="删除文件"
            @click="$emit('delete', activeEditor)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="editor-tabs-container">
        <div
          v-for="file in openedFiles"
          :key="file.workspace_key || file.id || 'draft-file'"
          class="editor-tab-item"
          :class="{
            'is-active': file.workspace_key
              ? file.workspace_key === activeEditor.workspace_key
              : (file.id && activeEditor.id === file.id) ||
                (!file.id && !activeEditor.id && !activeEditor.workspace_key && activeEditor.kind === 'FILE')
          }"
          @click="$emit('select', file)"
        >
          <SvgIcon :name="getFileIconName(file.name)" size="14px" class="tab-file-icon" />
          <span class="tab-filename" :title="file.name || '未命名脚本'">{{ file.name || "未命名脚本" }}</span>
          <el-tooltip v-if="isReadonly || isSystemCodebook(file)" content="资源只读" placement="top" :show-after="300">
            <el-icon class="tab-readonly-lock"><Lock /></el-icon>
          </el-tooltip>
          <el-tooltip v-else-if="file.download_only" content="仅支持下载" placement="top" :show-after="300">
            <el-icon class="tab-readonly-lock"><Download /></el-icon>
          </el-tooltip>
          <el-icon class="tab-close-icon" @click.stop="$emit('close-tab', file)">
            <Close />
          </el-icon>
        </div>
      </div>
    </div>

    <div class="editor-body" v-loading="detailLoading">
      <div v-if="isDownloadOnly" class="download-file-view">
        <div class="download-file-card">
          <div class="download-file-icon">
            <SvgIcon :name="getFileIconName(activeEditor.name)" size="42px" />
          </div>
          <div class="download-file-copy">
            <h3>{{ activeEditor.name }}</h3>
            <p>此文件以原始格式存储，不支持在浏览器中直接编辑。</p>
          </div>
          <div class="download-file-meta">
            <div>
              <span>文件类型</span>
              <strong>{{ fileType }}</strong>
            </div>
            <div>
              <span>文件大小</span>
              <strong>{{ formattedFileSize }}</strong>
            </div>
          </div>
          <AuthButton
            :capability="capabilities.Codebook.Detail"
            disableMode
            type="primary"
            :loading="downloading"
            :icon="Download"
            @click="$emit('download', activeEditor)"
          >
            下载文件
          </AuthButton>
        </div>
      </div>
      <CodeEditor
        v-else
        :code="activeEditor.code"
        :language="inferLanguage(activeEditor.name)"
        :read-only="isReadonly"
        @update:code="$emit('update-code', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  Check,
  Clock,
  Close,
  Delete,
  Download,
  Edit,
  Lock,
  MagicStick,
  Setting,
  VideoPlay
} from "@element-plus/icons-vue"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { formatFileSize, getFileExt, getFileIconName, inferLanguage } from "@/common/utils/file"
import { isSystemCodebook } from "../composables/useCodebookTree"
import type { codebook } from "@/api/task/codebook/types/codebook"

const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  activeEditor: codebook
  openedFiles: codebook[]
  saving: boolean
  detailLoading: boolean
  downloading?: boolean
  assistantOpen?: boolean
  readonly?: boolean
  allowRunWhenReadonly?: boolean
}>()

const isReadonly = computed(() => props.readonly || isSystemCodebook(props.activeEditor))
const isDownloadOnly = computed(() => Boolean(props.activeEditor.download_only))
const fileType = computed(() => getFileExt(props.activeEditor.name).toUpperCase() || "FILE")
const formattedFileSize = computed(() => formatFileSize(props.activeEditor.size || 0))
const { hasPermission } = usePermission()

const canOpenVersion = computed(() =>
  Boolean(props.activeEditor.id && !isDownloadOnly.value && hasPermission(capabilities.Codebook.ViewVersion))
)
const canEditMeta = computed(
  () => !isReadonly.value && !isDownloadOnly.value && hasPermission(capabilities.Codebook.Edit)
)
const canDelete = computed(() =>
  Boolean(props.activeEditor.id && !isReadonly.value && hasPermission(capabilities.Codebook.Delete))
)

defineEmits<{
  (e: "select", row: codebook): void
  (e: "close-tab", row: codebook): void
  (e: "open-version", row: codebook): void
  (e: "open-runner", row: codebook): void
  (e: "open-meta", row: codebook): void
  (e: "delete", row: codebook): void
  (e: "download", row: codebook): void
  (e: "run", row: codebook): void
  (e: "toggle-assistant"): void
  (e: "save"): void
  (e: "update-code", code: string): void
}>()
</script>

<style lang="scss" scoped>
.editor-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.editor-header {
  display: flex;
  flex-direction: column;
  height: 74px;
  overflow: hidden;
  background: #f8fafc;
  border-bottom: 1px solid #cfd8e6;
  user-select: none;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  background: #ffffff;
  border-bottom: 1px solid #e5eaf1;
}

.editor-primary-actions,
.editor-secondary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-secondary-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.editor-primary-actions {
  :deep(.el-button) {
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 5px;
  }

  :deep(.secondary-action) {
    --el-button-text-color: #475569;
    --el-button-border-color: #d8dee8;
    --el-button-bg-color: #ffffff;
    --el-button-hover-text-color: #2563eb;
    --el-button-hover-border-color: #bfdbfe;
    --el-button-hover-bg-color: #f3f7ff;
    --el-button-active-text-color: #1d4ed8;
    --el-button-active-border-color: #93c5fd;
    --el-button-active-bg-color: #eff6ff;
  }

  :deep(.assistant-button.el-button--primary.is-plain) {
    --el-button-text-color: #1d4ed8;
    --el-button-border-color: #bfdbfe;
    --el-button-bg-color: #eff6ff;
  }

  :deep(.save-button) {
    --el-button-bg-color: #2563eb;
    --el-button-border-color: #2563eb;
    --el-button-hover-bg-color: #1d4ed8;
    --el-button-hover-border-color: #1d4ed8;
    --el-button-active-bg-color: #1e40af;
    --el-button-active-border-color: #1e40af;
  }
}

.single-action-button {
  width: 26px;
  height: 26px;
  padding: 0;
  color: #475569;
  font-size: 12px;
  border-radius: 5px;

  &:hover {
    color: #1d4ed8;
    background: #eff6ff;
  }

  &.is-danger {
    color: #ef4444;

    &:hover {
      color: #dc2626;
      background: #fef2f2;
    }
  }
}

.editor-tabs-container {
  display: flex;
  align-items: stretch;
  flex: 0 0 34px;
  width: 100%;
  height: 34px;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.editor-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  max-width: 180px;
  height: 100%;
  padding: 0 14px;
  box-sizing: border-box;
  cursor: pointer;
  background: #dde5f0;
  border-top: 2px solid transparent;
  border-right: 1px solid #c3cedd;
  transition: all 0.15s ease;

  .tab-file-icon {
    flex-shrink: 0;
    opacity: 0.76;
  }

  .tab-filename {
    flex: 1;
    overflow: hidden;
    color: #334155;
    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-close-icon {
    flex-shrink: 0;
    margin-left: 4px;
    padding: 2px;
    color: #64748b;
    font-size: 12px;
    border-radius: 50%;
    transition: all 0.12s ease;

    &:hover {
      color: #0f172a;
      background-color: #c5d0df;
    }
  }

  &:hover {
    background: #f8fafc;

    .tab-filename {
      color: #0f172a;
    }
  }

  &.is-active {
    background: #ffffff;
    border-top: 3px solid #2563eb;

    .tab-filename {
      color: #020617;
      font-weight: 700;
    }

    .tab-file-icon {
      opacity: 1;
      filter: saturate(1.25) contrast(1.12);
    }

    .tab-close-icon {
      color: #334155;

      &:hover {
        color: #0f172a;
        background-color: #e2e8f0;
      }
    }
  }
}

.editor-body {
  flex: 1;
  min-height: 0;
  background: #fff;
}

.download-file-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  box-sizing: border-box;
  background: #f8fafc;
}

.download-file-card {
  display: flex;
  align-items: center;
  width: min(560px, 100%);
  flex-direction: column;
  padding: 38px;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 8%);
  text-align: center;
}

.download-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin-bottom: 18px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 16px;
}

.download-file-copy {
  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
  }

  p {
    margin: 8px 0 22px;
    color: #64748b;
    font-size: 13px;
  }
}

.download-file-meta {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;

  div {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  span {
    color: #94a3b8;
    font-size: 11px;
  }

  strong {
    color: #334155;
    font-size: 13px;
  }
}

.readonly-hint {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.tab-readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
}

:deep(.cm-editor) {
  font-size: 13px;
}
</style>
