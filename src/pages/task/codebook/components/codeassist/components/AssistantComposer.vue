<template>
  <footer class="composer">
    <div v-if="recipeName !== '自由对话'" class="active-recipe">
      <el-icon><MagicStick /></el-icon>
      <span>{{ recipeName }}</span>
      <button type="button" title="退出当前模式" @click="$emit('clear-recipe')">×</button>
    </div>
    <el-input
      ref="inputRef"
      :model-value="modelValue"
      type="textarea"
      resize="none"
      :autosize="{ minRows: 2, maxRows: 6 }"
      :maxlength="16000"
      placeholder="询问项目，或描述你希望完成的修改…"
      @update:model-value="$emit('update:modelValue', $event)"
      @keydown="handleKeydown"
    />
    <div class="composer-footer">
      <span>Enter 发送 · Shift + Enter 换行</span>
      <div class="composer-actions">
        <el-button v-if="sending" size="small" @click="$emit('cancel')">停止</el-button>
        <AuthButton
          :capability="capabilities.CodeAssist.Chat"
          :icon="Promotion"
          class="send-button"
          type="primary"
          circle
          :disabled="!canSend"
          :loading="sending"
          title="发送"
          @click="$emit('send')"
        />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { MagicStick, Promotion } from "@element-plus/icons-vue"
import type { InputInstance } from "element-plus"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"

defineProps<{
  modelValue: string
  recipeName: string
  canSend: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
  (event: "send"): void
  (event: "cancel"): void
  (event: "clear-recipe"): void
}>()

const capabilities = TASK_CAPABILITIES
const inputRef = ref<InputInstance>()

function handleKeydown(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) return
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return
  event.preventDefault()
  emit("send")
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped lang="scss">
.composer {
  padding: 10px 12px 12px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--el-border-color-lighter);

  :deep(.el-textarea__inner) {
    padding: 10px 11px;
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 1.55;
    background: #f8fafc;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #dbe3ed inset;

    &:focus {
      background: #fff;
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
    }
  }
}

.active-recipe {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 7px;
  padding: 4px 7px;
  color: #4f46e5;
  font-size: 10px;
  background: #eef2ff;
  border-radius: 6px;

  button {
    padding: 0;
    color: #818cf8;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
}

.composer-footer,
.composer-actions {
  display: flex;
  align-items: center;
}

.composer-footer {
  min-height: 31px;
  justify-content: space-between;
  padding: 6px 1px 0 3px;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
}

.composer-actions {
  gap: 6px;

  :deep(.send-button.el-button.is-circle) {
    display: inline-flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  :deep(.send-button.el-button.is-circle .el-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    line-height: 1;
  }
}
</style>
