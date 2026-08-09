<template>
  <footer class="composer">
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
      <div class="composer-options">
        <el-dropdown
          trigger="click"
          placement="top-start"
          :disabled="sending"
          popper-class="code-assist-profile-menu"
          @command="selectProfile"
        >
          <button class="profile-trigger" type="button" :disabled="sending" title="切换 AI 协作方式">
            @{{ activeProfile.label }}
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="profile in profiles" :key="profile.id" :command="profile.id">
                <div class="profile-option">
                  <span>{{ profile.label }}</span>
                  <small>{{ profile.description }}</small>
                </div>
                <el-icon v-if="profile.id === profileId" class="selected-icon"><Check /></el-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span>Enter 发送 · Shift + Enter 换行</span>
      </div>
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
import { computed, ref } from "vue"
import { Check, Promotion } from "@element-plus/icons-vue"
import type { InputInstance } from "element-plus"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import type { CodeAssistProfile } from "../constants"

const props = defineProps<{
  modelValue: string
  profileId: string
  profiles: CodeAssistProfile[]
  canSend: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
  (event: "send"): void
  (event: "cancel"): void
  (event: "select-profile", value: string): void
}>()

const capabilities = TASK_CAPABILITIES
const inputRef = ref<InputInstance>()
const activeProfile = computed(
  () => props.profiles.find((profile) => profile.id === props.profileId) || props.profiles[0]
)

function selectProfile(profileId: string) {
  emit("select-profile", profileId)
  inputRef.value?.focus()
}

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

.composer-options {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.profile-trigger {
  padding: 3px 5px;
  color: #4f46e5;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;

  &:hover,
  &:focus-visible {
    background: #eef2ff;
    outline: none;
  }

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
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

:global(.code-assist-profile-menu .el-dropdown-menu__item) {
  min-width: 220px;
  justify-content: space-between;
  gap: 14px;
  padding-top: 7px;
  padding-bottom: 7px;
}

:global(.code-assist-profile-menu .profile-option) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

:global(.code-assist-profile-menu .profile-option span) {
  color: var(--el-text-color-primary);
  font-size: 11px;
  line-height: 1.5;
}

:global(.code-assist-profile-menu .profile-option small) {
  color: var(--el-text-color-placeholder);
  font-size: 9px;
  line-height: 1.4;
  white-space: nowrap;
}

:global(.code-assist-profile-menu .selected-icon) {
  flex-shrink: 0;
  color: var(--el-color-primary);
}
</style>
