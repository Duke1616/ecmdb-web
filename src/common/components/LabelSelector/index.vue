<template>
  <div class="label-selector">
    <!-- 复合输入与展示框 -->
    <div
      class="composite-container"
      :class="{ 'is-focused': isFocused, 'has-value': modelValue && modelValue.length > 0 }"
      @click="focusInput"
    >
      <div class="tags-wrapper">
        <el-tag
          v-for="(label, index) in modelValue"
          :key="index"
          closable
          @close.stop="removeLabel(index)"
          class="selected-tag"
          size="default"
          type="primary"
          effect="light"
        >
          {{ label }}
        </el-tag>

        <input
          ref="inputRef"
          v-model="labelInput"
          type="text"
          :placeholder="modelValue && modelValue.length > 0 ? '' : placeholder"
          class="inner-input"
          @focus="isFocused = true"
          @blur="handleBlur"
          @keyup.enter="addLabel"
        />
      </div>

      <div class="actions-wrapper" v-if="modelValue && modelValue.length > 0">
        <el-button link type="danger" class="clear-btn" :icon="Delete" @click.stop="clearAllLabels"> 清空 </el-button>
      </div>
    </div>

    <!-- 推荐标签（紧凑平铺样式） -->
    <div class="suggested-section" v-if="suggestedLabels && suggestedLabels.length > 0">
      <span class="suggested-title">
        <el-icon><Star /></el-icon>
        推荐：
      </span>
      <div class="suggested-tags">
        <span
          v-for="label in suggestedLabels"
          :key="label"
          class="suggested-item-tag"
          :class="{ 'is-active': modelValue.includes(label) }"
          @click="toggleRecommendedLabel(label)"
          :title="modelValue.includes(label) ? '点击取消选择' : '点击添加'"
        >
          {{ label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Delete, Star } from "@element-plus/icons-vue"

// Props 定义
interface Props {
  modelValue: string[]
  placeholder?: string
  suggestedLabels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "输入标签名称，按回车添加",
  suggestedLabels: () => []
})

// Emits 定义
const emit = defineEmits<{
  "update:modelValue": [value: string[]]
}>()

// 标签输入
const labelInput = ref("")
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement>()

function focusInput() {
  inputRef.value?.focus()
}

function handleBlur() {
  isFocused.value = false
  // 失去焦点时自动把已输入内容加入
  addLabel()
}

function addLabel() {
  const label = labelInput.value.trim()
  if (label && !props.modelValue.includes(label)) {
    const newLabels = [...props.modelValue, label]
    emit("update:modelValue", newLabels)
  }
  labelInput.value = ""
}

function toggleRecommendedLabel(label: string) {
  if (props.modelValue.includes(label)) {
    // 若已选，点击时从列表中移除
    const newLabels = props.modelValue.filter((item) => item !== label)
    emit("update:modelValue", newLabels)
  } else {
    // 若未选，点击时加入列表
    const newLabels = [...props.modelValue, label]
    emit("update:modelValue", newLabels)
  }
}

function removeLabel(index: number) {
  const newLabels = [...props.modelValue]
  newLabels.splice(index, 1)
  emit("update:modelValue", newLabels)
}

function clearAllLabels() {
  emit("update:modelValue", [])
}
</script>

<style lang="scss" scoped>
.label-selector {
  width: 100%;
}

.composite-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 4px 12px;
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: text;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #c0c4cc;
  }

  &.is-focused {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
  }
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 2px 0;
}

.selected-tag {
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #bfdbfe;
  background-color: #eff6ff;
  color: #1d4ed8;
  height: 24px;
  line-height: 22px;
  padding: 0 8px;
  transition: all 0.15s ease;

  :deep(.el-tag__close) {
    color: #3b82f6;
    margin-left: 4px;
    &:hover {
      background-color: #3b82f6;
      color: #ffffff;
    }
  }
}

.inner-input {
  flex: 1;
  min-width: 120px;
  height: 26px;
  padding: 0;
  font-size: 13px;
  color: #303133;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: #a8abb2;
  }
}

.actions-wrapper {
  margin-left: 8px;
  flex-shrink: 0;
}

.clear-btn {
  font-size: 12px;
  color: #f56c6c;
  height: auto;
  padding: 2px 4px;
  border-radius: 4px;

  &:hover {
    color: #f78989;
    background-color: #fef0f0;
  }
}

.suggested-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

.suggested-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  height: 22px;
  user-select: none;

  .el-icon {
    color: #eab308;
    font-size: 13px;
  }
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.suggested-item-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #2563eb;
    background: #eff6ff;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-active {
    color: #94a3b8;
    background: #f1f5f9;
    border-color: #e2e8f0;
    cursor: pointer;
    box-shadow: none;

    &:hover {
      color: #ef4444;
      background: #fef2f2;
      border-color: #fca5a5;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.08);
    }
  }
}
</style>
