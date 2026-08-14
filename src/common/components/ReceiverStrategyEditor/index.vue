<template>
  <div class="strategy-editor">
    <div class="strategy-input-wrapper">
      <el-input
        :model-value="summary"
        :placeholder="placeholder"
        class="strategy-input"
        readonly
        :disabled="disabled"
      />
      <el-button class="strategy-action" :icon="Setting" :disabled="disabled" @click="handleEdit()">
        {{ actionLabel }}
      </el-button>
    </div>

    <div v-if="items.length > 0" class="strategy-shelf scroll-slim">
      <div
        v-for="item in items"
        :key="item.key"
        class="strategy-item"
        :class="{ disabled }"
        role="button"
        tabindex="0"
        @click="handleEdit(item.rule)"
        @keydown.enter="handleEdit(item.rule)"
        @keydown.space.prevent="handleEdit(item.rule)"
      >
        <div class="strategy-tag" :class="item.rule">{{ item.label }}</div>
        <div class="strategy-value">{{ item.text }}</div>
        <el-button
          v-if="!disabled"
          link
          :icon="Close"
          class="strategy-remove"
          :aria-label="`删除${item.label}策略`"
          @click.stop="handleRemove(item.key)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close, Setting } from "@element-plus/icons-vue"

export interface StrategyPreview {
  /** 展示项的稳定标识，用于删除策略。 */
  key: string
  /** 业务策略类型，用于触发对应的编辑页签和样式。 */
  rule: string
  /** 策略类型名称。 */
  label: string
  /** 策略具体内容摘要。 */
  text: string
}

const props = withDefaults(
  defineProps<{
    items: StrategyPreview[]
    summary?: string
    placeholder?: string
    actionLabel?: string
    disabled?: boolean
  }>(),
  {
    summary: "",
    placeholder: "尚未配置策略",
    actionLabel: "配置策略",
    disabled: false
  }
)

const emit = defineEmits<{
  edit: [rule?: string]
  remove: [key: string]
}>()

const handleEdit = (rule?: string) => {
  if (!props.disabled) emit("edit", rule)
}

const handleRemove = (key: string) => {
  if (!props.disabled) emit("remove", key)
}
</script>

<style scoped lang="scss">
.strategy-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  line-height: normal;
}

.strategy-input-wrapper {
  display: flex;
  width: 100%;
  height: 40px;
  line-height: normal;
}

.strategy-input {
  flex: 1;
  min-width: 0;
  line-height: normal;

  :deep(.el-input__wrapper) {
    height: 100%;
    padding: 2px 10px;
    background: #fff !important;
    border: 1px solid #cbd5e1 !important;
    border-right: none !important;
    border-radius: 8px 0 0 8px !important;
    box-shadow: none !important;
  }
}

.strategy-action {
  box-sizing: border-box;
  height: 100%;
  margin: 0 !important;
  padding: 0 16px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: none;
  border-radius: 0 8px 8px 0 !important;
  line-height: normal;

  &:hover:not(:disabled) {
    color: #6366f1;
    background: #f1f5f9;
  }
}

.strategy-shelf {
  display: flex;
  max-height: 220px;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  overflow-y: auto;
  background: #fbfcfe;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  line-height: normal;
}

.strategy-item {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: normal;

  &:hover,
  &:focus-visible {
    border-color: #cbd5e1;
    outline: none;
    box-shadow: 0 4px 12px rgb(0 0 0 / 3%);
    transform: translateY(-1px);
  }

  &.disabled {
    cursor: default;

    &:hover,
    &:focus-visible {
      border-color: #eef2f6;
      outline: none;
      box-shadow: none;
      transform: none;
    }
  }
}

.strategy-tag {
  flex-shrink: 0;
  padding: 2px 6px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  background: #f1f5f9;
  border-radius: 4px;
  line-height: 1.2;

  &.appoint {
    color: #2563eb;
    background: #eff6ff;
  }

  &.founder {
    color: #16a34a;
    background: #f0fdf4;
  }

  &.department {
    color: #dc2626;
    background: #fef2f2;
  }

  &.team {
    color: #ea580c;
    background: #fff7ed;
  }

  &.on_call {
    color: #9333ea;
    background: #faf5ff;
  }

  &.template {
    color: #0369a1;
    background: #f0f9ff;
  }
}

.strategy-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strategy-remove {
  flex-shrink: 0;
  color: #cbd5e1;
  line-height: 1;

  &:hover {
    color: #ef4444;
  }
}

.scroll-slim {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
}

@media (max-width: 768px) {
  .strategy-input-wrapper {
    height: auto;
    flex-direction: column;
  }

  .strategy-input {
    :deep(.el-input__wrapper) {
      border-right: 1px solid #cbd5e1 !important;
      border-radius: 8px 8px 0 0 !important;
    }
  }

  .strategy-action {
    height: 38px;
    border: 1px solid #cbd5e1;
    border-top: 1px solid #e2e8f0;
    border-radius: 0 0 8px 8px !important;
  }
}
</style>
