<template>
  <section class="editor-view">
    <div class="editor-header">
      <div class="editor-tabs-container">
        <div
          v-for="file in openedFiles"
          :key="file.id || 'draft-file'"
          class="editor-tab-item"
          :class="{
            'is-active':
              (file.id && activeEditor.id === file.id) || (!file.id && !activeEditor.id && activeEditor.kind === 'FILE')
          }"
          @click="$emit('select', file)"
        >
          <SvgIcon :name="getFileIconName(file.name)" size="14px" class="tab-file-icon" />
          <span class="tab-filename" :title="file.name || '未命名脚本'">{{ file.name || "未命名脚本" }}</span>
          <el-tooltip v-if="isSystemCodebook(file)" content="系统资源，只读" placement="top" :show-after="300">
            <el-icon class="tab-readonly-lock"><Lock /></el-icon>
          </el-tooltip>
          <el-icon class="tab-close-icon" @click.stop="$emit('close-tab', file)">
            <Close />
          </el-icon>
        </div>
      </div>

      <div class="editor-actions">
        <AuthButton
          v-if="activeEditor.id && !isReadonly"
          :capability="capabilities.Codebook.ViewVersion"
          disableMode
          size="small"
          :icon="Clock"
          link
          @click="$emit('open-version', activeEditor)"
          >版本</AuthButton
        >
        <AuthButton
          v-if="activeEditor.id && !isReadonly"
          :capability="capabilities.Runner.View"
          disableMode
          size="small"
          :icon="Setting"
          link
          @click="$emit('open-runner', activeEditor)"
          >执行单元</AuthButton
        >
        <AuthButton
          v-if="!isReadonly"
          :capability="capabilities.Codebook.Edit"
          disableMode
          size="small"
          :icon="Edit"
          link
          @click="$emit('open-meta', activeEditor)"
          >信息</AuthButton
        >
        <AuthButton
          v-if="activeEditor.id && !isReadonly"
          :capability="capabilities.Codebook.Delete"
          disableMode
          size="small"
          type="danger"
          link
          :icon="Delete"
          @click="$emit('delete', activeEditor)"
          >删除</AuthButton
        >
        <AuthButton
          v-if="!isReadonly"
          :capability="capabilities.Codebook.Edit"
          disableMode
          size="small"
          type="primary"
          :loading="saving"
          :icon="Check"
          @click="$emit('save')"
          >保存</AuthButton
        >
        <span v-if="isReadonly" class="readonly-hint">系统资源只读，暂不支持版本与执行单元配置</span>
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
import { Check, Clock, Close, Delete, Edit, Lock, Setting } from "@element-plus/icons-vue"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { getFileIconName, inferLanguage } from "../composables/useCodebookFile"
import { isSystemCodebook } from "../composables/useCodebookTree"
import type { codebook } from "@/api/task/codebook/types/codebook"

const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  activeEditor: codebook
  openedFiles: codebook[]
  saving: boolean
  detailLoading: boolean
  readonly?: boolean
}>()

const isReadonly = computed(() => props.readonly || isSystemCodebook(props.activeEditor))

defineEmits<{
  (e: "select", row: codebook): void
  (e: "close-tab", row: codebook): void
  (e: "open-version", row: codebook): void
  (e: "open-runner", row: codebook): void
  (e: "open-meta", row: codebook): void
  (e: "delete", row: codebook): void
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
  align-items: center;
  justify-content: space-between;
  height: 38px;
  overflow: hidden;
  padding: 0 12px 0 0;
  background: #e8edf5;
  border-bottom: 1px solid #cfd8e6;
  user-select: none;
}

.editor-tabs-container {
  display: flex;
  align-items: stretch;
  flex: 1;
  height: 100%;
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

.editor-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  height: 100%;

  :deep(.el-button) {
    height: 24px;
    padding: 0 8px;
    font-size: 12px;

    &.is-link {
      padding: 0 4px;
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

.tab-readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
}

:deep(.cm-editor) {
  font-size: 13px;
}
</style>
