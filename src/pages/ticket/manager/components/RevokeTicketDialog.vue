<template>
  <FormDialog
    v-model="visible"
    title="撤回工单"
    subtitle="填写撤单原因后，当前申请将停止流转"
    width="460px"
    :header-icon="WarningFilled"
    confirm-text="确认撤回"
    :confirm-loading="submitting"
    :confirm-disabled="!reason.trim()"
    :show-footer-info="false"
    @confirm="submit"
    @cancel="visible = false"
    @closed="reset"
  >
    <div class="revoke-dialog-content">
      <div v-if="subject" class="ticket-subject">{{ subject }}</div>
      <el-alert
        title="撤回后，未执行的自动化会被取消；已成功执行且配置了撤回补偿的动作会继续完成补偿。"
        type="warning"
        :closable="false"
      />
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="撤单原因" required>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="请说明撤回原因"
            autofocus
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { WarningFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import { revokeTicketApi } from "@/api/ticket/manager"

const props = defineProps<{
  modelValue: boolean
  instanceId?: number
  subject?: string
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "submitted"): void
}>()

const reason = ref("")
const submitting = ref(false)
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const reset = () => {
  reason.value = ""
  submitting.value = false
}

const submit = async () => {
  if (!props.instanceId || !reason.value.trim() || submitting.value) return
  submitting.value = true
  try {
    await revokeTicketApi({ instance_id: props.instanceId, force: true, reason: reason.value.trim() })
    ElMessage.success("撤回请求已提交")
    emit("submitted")
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.revoke-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 8px;
}

.ticket-subject {
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
