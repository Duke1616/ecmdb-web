<template>
  <FormDialog
    v-model="visible"
    title="强制终止任务"
    subtitle="停止当前执行，稍后可人工重新执行"
    width="460px"
    :header-icon="CircleCloseFilled"
    confirm-text="确认终止"
    confirm-type="danger"
    :confirm-loading="loading"
    :confirm-disabled="!reason.trim()"
    :footer-info-text="`任务 ID: ${taskId}`"
    @confirm="submit"
    @cancel="visible = false"
    @closed="reset"
  >
    <div class="terminate-dialog-content">
      <el-alert
        title="终止后任务将进入已取消状态，可稍后人工重新执行；若任务正在执行，将向执行节点发送停止信号。"
        type="warning"
        :closable="false"
      />
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="终止原因" required>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="请说明强制终止原因"
            autofocus
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { CircleCloseFilled } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"

const props = defineProps<{
  modelValue: boolean
  taskId: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "confirm", reason: string): void
}>()

const reason = ref("")
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const submit = () => {
  const normalizedReason = reason.value.trim()
  if (!normalizedReason || props.loading) return
  emit("confirm", normalizedReason)
}

const reset = () => {
  reason.value = ""
}
</script>

<style scoped lang="scss">
.terminate-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 8px;
}

:deep(.el-alert) {
  align-items: flex-start;
  padding: 9px 12px;
  line-height: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
