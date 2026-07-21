<template>
  <section class="editor-view">
    <div class="editor-header">
      <div class="editor-toolbar">
        <div class="editor-primary-actions">
          <AuthButton
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
            v-if="activeEditor.id && !isReadonly"
            :capability="capabilities.Preview.Run"
            disableMode
            size="small"
            class="secondary-action"
            :icon="VideoPlay"
            @click="$emit('run', activeEditor)"
            >试运行</AuthButton
          >
          <AuthButton
            v-if="activeEditor.id && !isReadonly"
            :capability="capabilities.Runner.View"
            disableMode
            size="small"
            class="secondary-action"
            :icon="Setting"
            @click="$emit('open-runner', activeEditor)"
            >执行单元</AuthButton
          >
          <AuthButton
            v-if="!isReadonly"
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
          <el-dropdown
            v-if="hasMoreActions"
            trigger="click"
            placement="bottom-end"
            popper-class="editor-actions-dropdown"
          >
            <el-button class="more-button" text size="small" aria-label="更多操作">
              <el-icon><MoreFilled /></el-icon>
              <span>更多</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="canOpenVersion" @click="$emit('open-version', activeEditor)">
                  <el-icon><Clock /></el-icon>
                  <span>版本</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="canEditMeta" @click="$emit('open-meta', activeEditor)">
                  <el-icon><Edit /></el-icon>
                  <span>信息</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="canDelete" class="danger-item" @click="$emit('delete', activeEditor)">
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="isReadonly" class="readonly-hint">已发布制品只读，仅支持查看内容</span>
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
          <el-tooltip v-if="isSystemCodebook(file)" content="已发布制品，只读" placement="top" :show-after="300">
            <el-icon class="tab-readonly-lock"><Lock /></el-icon>
          </el-tooltip>
          <el-icon class="tab-close-icon" @click.stop="$emit('close-tab', file)">
            <Close />
          </el-icon>
        </div>
      </div>
    </div>

    <div class="editor-body" v-loading="detailLoading">
      <CodeEditor
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
  Edit,
  Lock,
  MagicStick,
  MoreFilled,
  Setting,
  VideoPlay
} from "@element-plus/icons-vue"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { getFileIconName, inferLanguage } from "../composables/useCodebookFile"
import { isSystemCodebook } from "../composables/useCodebookTree"
import type { codebook } from "@/api/task/codebook/types/codebook"

const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  activeEditor: codebook
  openedFiles: codebook[]
  saving: boolean
  detailLoading: boolean
  assistantOpen?: boolean
  readonly?: boolean
}>()

const isReadonly = computed(() => props.readonly || isSystemCodebook(props.activeEditor))
const { hasPermission } = usePermission()

const canOpenVersion = computed(() =>
  Boolean(props.activeEditor.id && !isReadonly.value && hasPermission(capabilities.Codebook.ViewVersion))
)
const canEditMeta = computed(() => !isReadonly.value && hasPermission(capabilities.Codebook.Edit))
const canDelete = computed(() =>
  Boolean(props.activeEditor.id && !isReadonly.value && hasPermission(capabilities.Codebook.Delete))
)
const hasMoreActions = computed(() => canOpenVersion.value || canEditMeta.value || canDelete.value)

defineEmits<{
  (e: "select", row: codebook): void
  (e: "close-tab", row: codebook): void
  (e: "open-version", row: codebook): void
  (e: "open-runner", row: codebook): void
  (e: "open-meta", row: codebook): void
  (e: "delete", row: codebook): void
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

.more-button {
  height: 26px;
  padding: 0 7px;
  color: #475569;
  font-size: 12px;
  border-radius: 5px;

  &:hover {
    color: #1d4ed8;
    background: #eff6ff;
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

.readonly-hint {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

:global(.editor-actions-dropdown .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 112px;
  font-size: 12px;
}

:global(.editor-actions-dropdown .danger-item) {
  color: var(--el-color-danger);
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
