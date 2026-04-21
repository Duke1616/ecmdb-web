<script setup lang="ts">
import { Connection } from "@element-plus/icons-vue"
import type { Policy } from "@/api/iam/policy/type"
import CodeEditor from "@/common/components/CodeEditor/index.vue"

interface Props {
  policy: Policy
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "copy", text: string): void
}>()

const handleCopy = () => {
  emit("copy", JSON.stringify(props.policy, null, 2))
}
</script>

<template>
  <div class="source-code-view">
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

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    span {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
  }
  .editor-wrapper {
    height: 520px;
  }
}
</style>
