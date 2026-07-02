<script setup lang="ts">
import { Connection } from "@element-plus/icons-vue"
import type { Policy } from "@/api/iam/policy/type"
import CodeEditor from "@/common/components/CodeEditor/index.vue"

interface Props {
  policy: Policy
  borderless?: boolean // 是否为无边框模式 (用于嵌套在卡片中时)
}

const props = withDefaults(defineProps<Props>(), {
  borderless: false
})

const emit = defineEmits<{
  (e: "copy", text: string): void
}>()

const handleCopy = () => {
  emit("copy", JSON.stringify(props.policy, null, 2))
}
</script>

<template>
  <div class="source-code-view" :class="{ borderless: borderless }">
    <div class="code-header">
      <span class="title">POLICY SOURCE</span>
      <el-button link :icon="Connection" @click="handleCopy"> 复制全文 </el-button>
    </div>
    <div class="editor-wrapper">
      <CodeEditor :code="JSON.stringify(policy, null, 2)" language="json" read-only />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.source-code-view {
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &.borderless {
    border: none;
    border-radius: 0;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    span {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }
  }
  .editor-wrapper {
    height: 520px;
  }
}
</style>
