<template>
  <div class="assistant-empty">
    <span class="empty-mark">
      <el-icon><ChatDotRound /></el-icon>
    </span>
    <strong>和项目一起思考</strong>
    <p>{{ description }}</p>
    <div class="prompt-examples">
      <button v-for="example in examples" :key="example.prompt" type="button" @click="$emit('select', example.prompt)">
        <span>{{ example.label }}</span>
        <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ArrowRight, ChatDotRound } from "@element-plus/icons-vue"
import { FILE_CONTEXT_EXAMPLES, PROJECT_CONTEXT_EXAMPLES } from "../constants"

const props = defineProps<{ hasFileContext: boolean }>()
defineEmits<{ (event: "select", prompt: string): void }>()

const examples = computed(() => (props.hasFileContext ? FILE_CONTEXT_EXAMPLES : PROJECT_CONTEXT_EXAMPLES))
const description = computed(() =>
  props.hasFileContext
    ? "当前编辑器内容会作为上下文。需要修改时，AI 会生成一份可检查的变更集。"
    : "可以讨论整个项目，或使用 Ansible 项目模式分析跨文件结构。"
)
</script>

<style scoped lang="scss">
.assistant-empty {
  display: flex;
  align-items: center;
  padding: 48px 12px 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
  flex-direction: column;

  strong {
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  p {
    max-width: 300px;
    margin: 8px 0 18px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.65;
  }
}

.empty-mark {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(79, 70, 229, 0.2);
}

.prompt-examples {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 7px;

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 11px;
    color: #52647d;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 9px;
    transition: 0.18s ease;

    &:hover {
      color: var(--el-color-primary);
      background: #fff;
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-1px);
    }
  }
}
</style>
