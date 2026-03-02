<template>
  <div class="tag-configuration">
    <!-- 核心输入区域：模拟输入框，不仅是容器，更是视觉焦点 -->
    <div class="tag-editor-container" :class="{ 'is-active': isFocused }" @click="focusInput">
      <div class="editor-header">
        <div class="label-group">
          <el-icon class="label-icon"><PriceTag /></el-icon>
          <span class="label-text">运行标签</span>
        </div>
        <div class="actions">
          <span v-if="selectedTags.length > 0" class="tag-count">已选 {{ selectedTags.length }}</span>
          <el-button v-if="selectedTags.length > 0" link type="primary" size="small" @click.stop="clearAll"
            >清空</el-button
          >
        </div>
      </div>

      <div class="editor-content">
        <transition-group name="tag-list">
          <el-tag
            v-for="(tag, index) in selectedTags"
            :key="tag"
            closable
            size="small"
            class="vibrant-tag"
            @close="removeTag(index)"
          >
            {{ tag }}
          </el-tag>
        </transition-group>

        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          class="ghost-input"
          :placeholder="selectedTags.length === 0 ? '键入标签名称并回车...' : ''"
          @focus="isFocused = true"
          @blur="handleBlur"
          @keydown.enter.prevent="addTag"
          @keydown.backspace="handleBackspace"
        />
      </div>
    </div>

    <!-- 智能推荐区域：采用流式布局，弱化边框，强化交互态 -->
    <div class="smart-suggestions" v-if="recommendedTags.length > 0">
      <div class="suggestion-header">
        <span class="dot" />
        <span>快速添加推荐标签</span>
      </div>
      <div class="suggestion-wall">
        <div
          v-for="tag in recommendedTags"
          :key="tag"
          class="modern-chip"
          :class="{ 'is-picked': selectedTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          <span class="text-overflow">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue"
import { PriceTag } from "@element-plus/icons-vue"
import { listRunnerTagsApi } from "@/api/runner"

// NOTE: 该组件为第三版设计，追求「呼吸感」与「现代工业设计」的平衡。
// 引入了 transition 动画，使用了更细腻的 HSL 配色方案，强调组件的自愈能力与输入流畅度。

interface Props {
  modelValue?: string[]
  suggestedTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  suggestedTags: () => []
})

const emits = defineEmits<{
  "update:modelValue": [value: string[]]
  change: [value: string[]]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref("")
const isFocused = ref(false)
const selectedTags = ref<string[]>([])
const recommendedTags = ref<string[]>([])

const focusInput = () => {
  inputRef.value?.focus()
}

const handleBlur = () => {
  isFocused.value = false
  if (inputValue.value.trim()) {
    addTag()
  }
}

const addTag = () => {
  const val = inputValue.value.trim()
  if (val && !selectedTags.value.includes(val)) {
    selectedTags.value.push(val)
    inputValue.value = ""
    emitChange()
  } else {
    inputValue.value = ""
  }
}

const removeTag = (index: number) => {
  selectedTags.value.splice(index, 1)
  emitChange()
}

const clearAll = () => {
  selectedTags.value = []
  emitChange()
}

const handleBackspace = () => {
  if (inputValue.value === "" && selectedTags.value.length > 0) {
    selectedTags.value.pop()
    emitChange()
  }
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index >= 0) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  emitChange()
}

const emitChange = () => {
  emits("update:modelValue", [...selectedTags.value])
  emits("change", [...selectedTags.value])
}

const loadRecommendedTags = () => {
  listRunnerTagsApi()
    .then(({ data }) => {
      const tags = new Set<string>()
      data.runner_tags.forEach((item) => {
        item.tags.forEach((t) => tags.add(t.tag))
      })
      // 限制展示数量，确保一行平分时不会太拥挤
      recommendedTags.value = Array.from(tags).slice(0, 7)
    })
    .catch(() => {
      recommendedTags.value = []
    })
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) selectedTags.value = [...val]
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  if (!props.suggestedTags || props.suggestedTags.length === 0) {
    loadRecommendedTags()
  } else {
    recommendedTags.value = [...props.suggestedTags]
  }
})
</script>

<style lang="scss" scoped>
.tag-configuration {
  width: 100%;
  --primary-color: #4f46e5;
  --bg-soft: #f9fafb;
  --border-color: #e5e7eb;

  .tag-editor-container {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: text;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }

    &.is-active {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .label-group {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #374151;

        .label-icon {
          font-size: 16px;
          color: var(--primary-color);
        }

        .label-text {
          font-size: 13px;
          font-weight: 600;
        }
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .tag-count {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }

    .editor-content {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

      .vibrant-tag {
        height: 28px;
        border: none;
        background: #eef2ff;
        color: var(--primary-color);
        font-weight: 500;
        border-radius: 6px;
        padding: 0 10px;

        :deep(.el-tag__close) {
          color: var(--primary-color);
          &:hover {
            background: var(--primary-color);
            color: #ffffff;
          }
        }
      }

      .ghost-input {
        border: none;
        outline: none;
        flex: 1;
        min-width: 120px;
        font-size: 14px;
        color: #1f2937;
        padding: 4px 0;

        &::placeholder {
          color: #9ca3af;
        }
      }
    }
  }

  .smart-suggestions {
    margin-top: 20px;

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 12px;
      padding-left: 4px;
      font-weight: 500;

      .dot {
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
      }
    }

    .suggestion-wall {
      display: flex;
      gap: 6px;
      width: 100%;
    }

    .modern-chip {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      white-space: nowrap;
      font-size: 11px;
      padding: 3px 4px;
      background: var(--bg-soft);
      border: 1px solid var(--border-color);
      color: #4b5563;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      .text-overflow {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &:hover {
        background: #ffffff;
        border-color: #cbd5e1;
        transform: scale(1.02);
        color: #1f2937;
      }

      &.is-picked {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: #ffffff;
      }
    }
  }
}

// 动画
.tag-list-enter-active,
.tag-list-leave-active {
  transition: all 0.3s ease;
}
.tag-list-enter-from,
.tag-list-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

@keyframes scale-up {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
