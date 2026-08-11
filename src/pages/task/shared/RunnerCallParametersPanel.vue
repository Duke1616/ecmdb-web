<template>
  <div v-if="showTip" class="runner-context-note">
    已自动带入 Runner 私有变量与 Handler 参数默认值；这里仅支持手动调整，提交时只发送真正变化的覆盖值。
  </div>

  <div class="metadata-container has-metadata" :class="{ 'is-disabled': disabled }">
    <div class="metadata-header">
      <div class="metadata-title">
        <span class="dot" />
        <span>调用参数</span>
      </div>
      <div v-if="parameters.length" class="runner-override-actions">
        <span>{{ overrideCount ? `已覆盖 ${overrideCount} 项` : "当前使用默认值" }}</span>
        <el-button v-if="overrideCount" link type="primary" :disabled="disabled" @click="$emit('reset')">
          恢复默认
        </el-button>
      </div>
    </div>

    <TaskParamsEditor
      v-if="parameters.length"
      v-model="modelValue"
      :metadata="parameters"
      :initialize-defaults="false"
      :project-entry-codebook-id="projectEntryCodebookId"
    />
    <div v-else-if="runnerId" class="manual-map-box">
      <KVEditor
        v-model="modelValue"
        title-key="参数名"
        title-value="覆盖值"
        add-text="添加覆盖参数..."
        empty-text="当前执行单元未声明可配置参数"
      />
    </div>
    <div v-else class="runner-params-placeholder">选择执行单元后自动加载可配置参数和默认值</div>
  </div>
</template>

<script setup lang="ts">
import type { Parameter } from "@/api/task/resource/type"
import KVEditor from "@/pages/task/manager/components/KVEditor.vue"
import TaskParamsEditor from "@/pages/task/manager/components/TaskParamsEditor.vue"

withDefaults(
  defineProps<{
    runnerId?: number
    projectEntryCodebookId?: number
    parameters: Parameter[]
    overrideCount: number
    disabled?: boolean
    showTip?: boolean
  }>(),
  { showTip: true }
)

defineEmits<{ reset: [] }>()
const modelValue = defineModel<Record<string, string>>({ required: true })
</script>

<style scoped lang="scss">
.runner-context-note {
  margin: 0 0 14px;
  padding: 10px 12px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.metadata-container {
  position: relative;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;

  &.is-disabled {
    pointer-events: none;
    opacity: 0.72;
  }

  &.has-metadata::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    content: "";
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }
}

.metadata-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.metadata-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;

  .dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
  }
}

.runner-override-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;

  :deep(.el-button) {
    height: auto;
    padding: 0;
    font-size: 11px;
  }
}

.manual-map-box {
  padding: 12px;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.runner-params-placeholder {
  padding: 28px 16px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  background: #fff;
  border: 1px dashed #dbe4ef;
  border-radius: 8px;
}
</style>
