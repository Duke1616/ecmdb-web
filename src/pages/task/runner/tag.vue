<template>
  <div class="tag-configuration">
    <div class="tag-editor-container" :class="{ 'is-active': isFocused }" @click="focusInput">
      <div class="editor-content">
        <el-icon class="label-icon"><PriceTag /></el-icon>
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

        <div class="actions">
          <span v-if="selectedTags.length > 0" class="tag-count">{{ selectedTags.length }} 个</span>
          <el-button v-if="selectedTags.length > 0" link type="primary" size="small" @click.stop="clearAll">
            清空
          </el-button>
        </div>
      </div>
    </div>

    <div class="smart-suggestions" v-if="recommendedTags.length > 0">
      <div class="suggestion-header">
        <span class="dot" />
        <span>推荐标签</span>
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
import { listRunnerTagsApi } from "@/api/task/runner"

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
const remoteTags = ref<string[]>([])

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
    syncRecommendedTags()
  } else {
    inputValue.value = ""
  }
}

const removeTag = (index: number) => {
  selectedTags.value.splice(index, 1)
  emitChange()
  syncRecommendedTags()
}

const clearAll = () => {
  selectedTags.value = []
  emitChange()
  syncRecommendedTags()
}

const handleBackspace = () => {
  if (inputValue.value === "" && selectedTags.value.length > 0) {
    selectedTags.value.pop()
    emitChange()
    syncRecommendedTags()
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
  syncRecommendedTags()
}

const emitChange = () => {
  emits("update:modelValue", [...selectedTags.value])
  emits("change", [...selectedTags.value])
}

const syncRecommendedTags = () => {
  const tags = new Set<string>()
  for (const tag of props.suggestedTags) {
    const value = tag.trim()
    if (value) tags.add(value)
  }
  for (const tag of remoteTags.value) {
    const value = tag.trim()
    if (value) tags.add(value)
  }
  recommendedTags.value = Array.from(tags).filter((tag) => !selectedTags.value.includes(tag)).slice(0, 5)
}

const loadRecommendedTags = () => {
  listRunnerTagsApi()
    .then(({ data }) => {
      const tags = new Set<string>()
      data.runner_tags.forEach((item) => {
        item.tags.forEach((t) => tags.add(t.tag))
      })
      remoteTags.value = Array.from(tags)
      syncRecommendedTags()
    })
    .catch(() => {
      remoteTags.value = []
      syncRecommendedTags()
    })
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) selectedTags.value = [...val]
    syncRecommendedTags()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.suggestedTags,
  () => {
    syncRecommendedTags()
  },
  { deep: true }
)

onMounted(() => {
  syncRecommendedTags()
  loadRecommendedTags()
})
</script>

<style lang="scss" scoped>
.tag-configuration {
  width: 100%;
  --primary-color: #3b82f6;
  --bg-soft: #f8fafc;
  --border-color: #dcdfe6;

  .tag-editor-container {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 7px 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    cursor: text;

    &:hover {
      border-color: #c0c4cc;
    }

    &.is-active {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
    }

    .editor-content {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-height: 28px;

      .label-icon {
        flex: 0 0 auto;
        color: #94a3b8;
        font-size: 16px;
      }

      .vibrant-tag {
        height: 24px;
        border: none;
        background: #eff6ff;
        color: var(--primary-color);
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        padding: 0 8px;

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
        min-width: 110px;
        font-size: 13px;
        color: #1f2937;
        padding: 3px 0;

        &::placeholder {
          color: #9ca3af;
        }
      }

      .actions {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 8px;
        margin-left: auto;

        .tag-count {
          color: #94a3b8;
          font-size: 12px;
        }
      }
    }
  }

  .smart-suggestions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    min-width: 0;

    .suggestion-header {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;

      .dot {
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
      }
    }

    .suggestion-wall {
      display: grid;
      flex: 1 1 0;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      min-width: 0;
      overflow: hidden;
    }

    .modern-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      white-space: nowrap;
      font-size: 11px;
      padding: 3px 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      .text-overflow {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }

      &.is-picked {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: #ffffff;
      }
    }
  }
}

@media (max-width: 1180px) {
  .tag-configuration .smart-suggestions .suggestion-wall {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .tag-configuration .smart-suggestions {
    align-items: flex-start;
    flex-direction: column;
  }

  .tag-configuration .smart-suggestions .suggestion-wall {
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

</style>
