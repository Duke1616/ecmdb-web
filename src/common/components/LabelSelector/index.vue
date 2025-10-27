<template>
  <div class="label-selector">
    <!-- 标签输入区域 -->
    <div class="labels-input-wrapper">
      <el-input
        v-model="labelInput"
        :placeholder="placeholder"
        size="large"
        class="label-input"
        @keyup.enter="addLabel"
        @blur="addLabel"
      >
        <template #suffix>
          <el-button type="primary" size="small" :icon="Plus" @click="addLabel" :disabled="!labelInput.trim()">
            添加
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 标签显示区域 -->
    <div class="labels-display" v-if="modelValue && modelValue.length > 0">
      <div class="labels-header">
        <span class="labels-count">已选择 {{ modelValue.length }} 个标签</span>
        <el-button type="danger" size="small" :icon="Delete" @click="clearAllLabels" text> 清空 </el-button>
      </div>
      <div class="labels-list">
        <el-tag
          v-for="(label, index) in modelValue"
          :key="index"
          closable
          @close="removeLabel(index)"
          class="label-item"
          type="info"
          effect="light"
        >
          {{ label }}
        </el-tag>
      </div>
    </div>

    <!-- 推荐标签区域 -->
    <div class="suggested-labels" v-if="suggestedLabels && suggestedLabels.length > 0">
      <div class="suggested-header">
        <el-icon><Star /></el-icon>
        <span>推荐标签</span>
      </div>
      <div class="suggested-list">
        <el-tag
          v-for="label in suggestedLabels"
          :key="label"
          @click="addRecommendedLabel(label)"
          class="suggested-tag"
          effect="plain"
        >
          {{ label }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Plus, Delete, Star } from "@element-plus/icons-vue"

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

// 添加标签
const addLabel = () => {
  const label = labelInput.value.trim()
  if (label && !props.modelValue.includes(label)) {
    const newLabels = [...props.modelValue, label]
    emit("update:modelValue", newLabels)
    labelInput.value = ""
  }
}

// 添加推荐标签
const addRecommendedLabel = (label: string) => {
  if (!props.modelValue.includes(label)) {
    const newLabels = [...props.modelValue, label]
    emit("update:modelValue", newLabels)
  }
}

// 移除标签
const removeLabel = (index: number) => {
  const newLabels = [...props.modelValue]
  newLabels.splice(index, 1)
  emit("update:modelValue", newLabels)
}

// 清空所有标签
const clearAllLabels = () => {
  emit("update:modelValue", [])
}
</script>

<style lang="scss" scoped>
.label-selector {
  width: 100%;

  .labels-input-wrapper {
    margin-bottom: 16px;

    .label-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        &.is-focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }

  .labels-display {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 16px;

    .labels-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .labels-count {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }
    }

    .labels-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      overflow: hidden;

      .label-item {
        border-radius: 6px;
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1e40af;
        font-size: 13px;
        padding: 4px 8px;
        max-width: 100%;
        word-break: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .el-tag__close {
          color: #6b7280;
          margin-left: 4px;

          &:hover {
            background: #dbeafe;
            color: #1e40af;
          }
        }
      }
    }
  }

  .suggested-labels {
    padding: 16px;
    background: #fef3c7;
    border-radius: 8px;
    border: 1px solid #fbbf24;

    .suggested-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .el-icon {
        margin-right: 6px;
        color: #f59e0b;
        font-size: 16px;
      }

      span {
        font-size: 14px;
        color: #92400e;
        font-weight: 500;
      }
    }

    .suggested-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      overflow: hidden;

      .suggested-tag {
        border-radius: 6px;
        background: #ffffff;
        border-color: #fbbf24;
        color: #92400e;
        font-size: 13px;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        max-width: 100%;
        word-break: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:hover {
          background: #fef3c7;
          border-color: #f59e0b;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}
</style>
