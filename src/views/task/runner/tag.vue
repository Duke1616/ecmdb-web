<template>
  <div class="tag-configuration">
    <div class="tag-header">
      <div class="label-with-tip">
        <span>标签</span>
        <el-tooltip content="自动化任务是根据【标签】 + 【任务模版标识】进行匹配工作节点" placement="top">
          <el-icon class="tip-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>

    <div class="tags-container">
      <!-- 标签输入区域 -->
      <div class="tags-input-wrapper">
        <el-input
          v-model="tagInput"
          placeholder="输入标签名称，按回车添加"
          size="large"
          class="tag-input"
          @keyup.enter="addTag"
          @blur="addTag"
        >
          <template #suffix>
            <el-button type="primary" size="small" :icon="Plus" @click="addTag" :disabled="!tagInput.trim()">
              添加
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 标签显示区域 -->
      <div class="tags-display" v-if="selectedTags.length > 0">
        <div class="tags-header">
          <span class="tags-count">已选择 {{ selectedTags.length }} 个标签</span>
          <el-button type="danger" size="small" :icon="Delete" @click="clearAllTags" text> 清空 </el-button>
        </div>
        <div class="tags-list">
          <el-tag
            v-for="(tag, index) in selectedTags"
            :key="index"
            closable
            @close="removeTag(index)"
            class="tag-item"
            type="info"
            effect="light"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 推荐标签区域 -->
      <div class="suggested-tags" v-if="recommendedTags.length > 0">
        <div class="suggested-header">
          <el-icon><Star /></el-icon>
          <span>推荐标签</span>
        </div>
        <div class="suggested-list">
          <el-tag
            v-for="tag in recommendedTags"
            :key="tag"
            @click="addRecommendedTag(tag)"
            class="suggested-tag"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue"
import { Plus, Delete, Star, QuestionFilled } from "@element-plus/icons-vue"
import { listRunnerTagsApi } from "@/api/runner"

// 接收父组件传递
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

// 标签相关状态
const tagInput = ref("")
const selectedTags = ref<string[]>([])
const recommendedTags = ref<string[]>([])

// 添加标签
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    tagInput.value = ""
    emitChange()
  }
}

// 添加推荐标签
const addRecommendedTag = (tag: string) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    emitChange()
  }
}

// 移除标签
const removeTag = (index: number) => {
  selectedTags.value.splice(index, 1)
  emitChange()
}

// 清空所有标签
const clearAllTags = () => {
  selectedTags.value = []
  emitChange()
}

// 发送变化事件
const emitChange = () => {
  emits("update:modelValue", [...selectedTags.value])
  emits("change", [...selectedTags.value])
}

// 获取推荐标签
const loadRecommendedTags = () => {
  listRunnerTagsApi()
    .then(({ data }) => {
      const tags = new Set<string>()
      data.runner_tags.forEach((item) => {
        Object.keys(item.tags_topic).forEach((tag) => {
          tags.add(tag)
        })
      })
      recommendedTags.value = Array.from(tags).slice(0, 10)
    })
    .catch(() => {
      recommendedTags.value = []
    })
}

// 监听 props 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedTags.value = [...newValue]
    }
  },
  { immediate: true }
)

// 监听 props.suggestedTags 变化
watch(
  () => props.suggestedTags,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      recommendedTags.value = [...newValue]
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 如果没有传入推荐标签，则从 API 获取
  if (!props.suggestedTags || props.suggestedTags.length === 0) {
    loadRecommendedTags()
  }
})
</script>

<style lang="scss" scoped>
.tag-configuration {
  width: 100%;
  max-width: 100%;

  .tag-header {
    margin-bottom: 16px;

    .label-with-tip {
      display: flex;
      align-items: center;
      gap: 6px;

      span {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .tip-icon {
        font-size: 14px;
        color: #9ca3af;
        cursor: help;

        &:hover {
          color: #6b7280;
        }
      }
    }
  }

  .tags-container {
    width: 100%;
    max-width: 100%;
    .tags-input-wrapper {
      margin-bottom: 16px;

      .tag-input {
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

    .tags-display {
      margin-bottom: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .tags-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .tags-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
        max-width: 100%;
        overflow: hidden;

        .tag-item {
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

    .suggested-tags {
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
}

// 响应式设计
@media (max-width: 768px) {
  .tag-configuration {
    .tags-container {
      .tags-display,
      .suggested-tags {
        padding: 12px;
      }

      .tags-list,
      .suggested-list {
        gap: 6px;

        .tag-item,
        .suggested-tag {
          max-width: calc(50% - 3px);
          min-width: 0;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .tag-configuration {
    .tags-container {
      .tags-list,
      .suggested-list {
        .tag-item,
        .suggested-tag {
          max-width: 100%;
        }
      }
    }
  }
}
</style>
