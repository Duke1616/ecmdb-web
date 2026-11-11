<template>
  <FormDialog
    v-model="visible"
    title="审批驳回"
    width="480px"
    :header-icon="WarningFilled"
    :confirm-text="rejectType === 'TERMINATE' ? '确认否决' : '确认退回'"
    :confirm-type="rejectType === 'TERMINATE' ? 'danger' : 'primary'"
    :confirm-loading="submitting"
    :confirm-disabled="!comment.trim() || (rejectType === 'RETURN' && !targetNodeId)"
    :show-footer-info="false"
    @confirm="submit"
    @cancel="visible = false"
    @closed="reset"
  >
    <div class="reject-dialog-content">
      <el-form label-position="top" @submit.prevent="submit">
        <!-- 驳回处理方式 (若策略仅允许单模式，则自动隐藏单选栏，收敛为单一操作) -->
        <el-form-item v-if="!isSingleMode" label="处理方式" required>
          <el-radio-group v-model="rejectType" class="intent-radio-group">
            <el-radio-button v-if="canReturn" value="RETURN">退回修改</el-radio-button>
            <el-radio-button v-if="canTerminate" value="TERMINATE">直接否决</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 退回目标环节 (仅在选择退回修改时展示) -->
        <el-form-item v-if="rejectType === 'RETURN'" label="退回环节" required>
          <el-select
            v-model="targetNodeId"
            placeholder="请选择退回环节"
            style="width: 100%"
            :loading="loadingTargets"
          >
            <el-option
              v-for="target in filteredTargets"
              :key="target.node_id"
              :label="target.node_name"
              :value="target.node_id"
            >
              <div class="target-option-row">
                <span>{{ target.node_name }}</span>
                <el-tag v-if="target.is_starter" size="small" type="warning" effect="plain" round>
                  提单人
                </el-tag>
                <el-tag v-else size="small" type="info" effect="plain" round>
                  上一环节
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 否决终止警示 (仅在选择直接否决时展示) -->
        <el-alert
          v-if="rejectType === 'TERMINATE'"
          title="否决后流程将直接终止并作废，工单无法再次修改或提审。"
          type="error"
          :closable="false"
          show-icon
          class="terminate-alert"
        />

        <!-- 驳回说明 / 修改意见 -->
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="comment"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="请说明驳回原因或修改要求..."
            autofocus
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { WarningFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import { getRejectTargetsApi, rejectTicketApi } from "@/api/ticket/manager"
import type { TaskID, RejectTarget, FlowPolicy } from "@/api/ticket/manager/types/manager"

interface IProps {
  modelValue: boolean
  ticketId?: number
  taskId?: TaskID
  policy?: FlowPolicy
}

const props = defineProps<IProps>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "submitted"): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val)
})

const canReturn = computed(() => {
  const modes = props.policy?.reject_modes
  if (!modes || modes.length === 0) return false
  return modes.includes("starter") || modes.includes("history")
})

const canTerminate = computed(() => {
  const modes = props.policy?.reject_modes
  if (!modes || modes.length === 0) return false
  return modes.includes("terminate")
})

const isSingleMode = computed(() => {
  return (canReturn.value && !canTerminate.value) || (!canReturn.value && canTerminate.value)
})

const comment = ref("")
const rejectType = ref<"RETURN" | "TERMINATE">("RETURN")
const targetNodeId = ref("")
const submitting = ref(false)
const loadingTargets = ref(false)
const rejectTargets = ref<RejectTarget[]>([])

const filteredTargets = computed(() => {
  const modes = props.policy?.reject_modes
  if (!modes || modes.length === 0) return []

  const allowStarter = modes.includes("starter")
  const allowHistory = modes.includes("history")

  return rejectTargets.value.filter((target) => {
    if (target.is_starter) {
      return allowStarter
    }
    return allowHistory
  })
})

const syncDefaultType = () => {
  if (!canReturn.value && canTerminate.value) {
    rejectType.value = "TERMINATE"
  } else {
    rejectType.value = "RETURN"
  }
}

const syncDefaultTarget = () => {
  if (filteredTargets.value.length > 0) {
    const exists = filteredTargets.value.some((t) => t.node_id === targetNodeId.value)
    if (!exists) {
      targetNodeId.value = filteredTargets.value[0].node_id
    }
  } else {
    targetNodeId.value = ""
  }
}

const fetchTargets = async () => {
  if (!props.taskId) return
  loadingTargets.value = true
  try {
    const { data } = await getRejectTargetsApi({
      ticket_id: props.ticketId,
      task_id: props.taskId
    })
    rejectTargets.value = data || []
    syncDefaultTarget()
  } catch (error) {
    console.error("获取可驳回目标失败:", error)
  } finally {
    loadingTargets.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      syncDefaultType()
      if (props.taskId && canReturn.value) {
        fetchTargets()
      }
    }
  }
)

watch(
  () => filteredTargets.value,
  () => {
    syncDefaultTarget()
  }
)

const submit = async () => {
  if (!props.taskId || !comment.value.trim() || submitting.value) return

  if (rejectType.value === "TERMINATE" && !canTerminate.value) {
    ElMessage.warning("当前工作流配置不支持直接否决操作")
    return
  }

  if (rejectType.value === "RETURN") {
    if (!canReturn.value) {
      ElMessage.warning("当前工作流配置不支持退回修改操作")
      return
    }
    if (!targetNodeId.value) {
      ElMessage.warning("请选择退回环节")
      return
    }
  }

  submitting.value = true
  try {
    await rejectTicketApi({
      ticket_id: props.ticketId,
      task_id: props.taskId,
      comment: comment.value.trim(),
      target_node_id: rejectType.value === "RETURN" ? targetNodeId.value : undefined,
      terminate: rejectType.value === "TERMINATE"
    })

    ElMessage.success(rejectType.value === "TERMINATE" ? "工单已直接否决" : "工单已退回修改")
    visible.value = false
    emit("submitted")
  } catch (error) {
    console.error("驳回失败:", error)
  } finally {
    submitting.value = false
  }
}

const reset = () => {
  comment.value = ""
  rejectType.value = "RETURN"
  targetNodeId.value = ""
  submitting.value = false
}
</script>

<style scoped lang="scss">
.reject-dialog-content {
  padding: 4px 0 0;

  :deep(.el-form-item) {
    margin-bottom: 18px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-form-item__label {
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      padding-bottom: 6px;
    }
  }
}

.intent-radio-group {
  width: 100%;
  display: flex;

  :deep(.el-radio-button) {
    flex: 1;

    .el-radio-button__inner {
      width: 100%;
      padding: 9px 15px;
      font-size: 13px;
    }
  }
}

.target-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.terminate-alert {
  margin-bottom: 18px;
  border-radius: 6px;
}
</style>
