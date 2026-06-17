<template>
  <FormDialog
    v-model="visible"
    title="重试任务"
    subtitle="确认重新执行该任务"
    width="400px"
    :header-icon="WarningFilled"
    :confirm-text="'确认重试'"
    :confirm-loading="loading"
    :footer-info-text="`任务ID: ${taskId}`"
    @closed="handleClosed"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="retry-dialog-content">
      <div class="warning-message">
        <p class="description">请确认是否要重新执行此任务？</p>
        <p class="note">任务将重新进入执行队列，请稍后查看执行结果。</p>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FormDialog } from "@@/components/Dialogs"
import { WarningFilled } from "@element-plus/icons-vue"

interface Props {
  modelValue: boolean
  taskId: number
  loading?: boolean
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
  (e: "confirm"): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = () => {
  emits("confirm")
}

const handleClosed = () => {
  emits("closed")
}
</script>

<style scoped lang="scss">
.retry-dialog-content {
  padding: 20px 0;
  text-align: center;
}

.warning-message {
  .description {
    font-size: 14px;
    color: #374151;
    margin: 0 0 12px 0;
    line-height: 1.5;
  }

  .note {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }
}
</style>
