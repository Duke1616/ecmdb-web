<template>
  <FormDialog
    v-model="visible"
    title="审批驳回"
    width="480px"
    :header-icon="WarningFilled"
    :confirm-text="rejectType === 'TERMINATE' ? '确认否决' : '确认退回'"
    :confirm-type="rejectType === 'TERMINATE' ? 'danger' : 'primary'"
    :confirm-loading="submitting"
    :confirm-disabled="isConfirmDisabled"
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

        <!-- 退回修改模式下的目标模式选择 -->
        <template v-if="rejectType === 'RETURN'">
          <!-- 若有多个上游候选环节，支持在自动回退与自主选择特定环节间切换 -->
          <el-form-item v-if="hasMultipleTargets" label="退回目标">
            <el-radio-group v-model="targetMode" class="intent-radio-group">
              <el-radio-button value="AUTO">自动回退（默认）</el-radio-button>
              <el-radio-button value="CUSTOM">指定环节</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 自动回退提示（多候选时由引擎在许可类别内决策） -->
          <div v-if="targetMode === 'AUTO' && filteredTargets.length > 1" class="auto-return-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            <span>由流程引擎按实际执行路径自动回溯至紧邻上游审批环节或发起人</span>
          </div>

          <!-- 单一许可目标：显式退回，无需选择 -->
          <div v-if="filteredTargets.length === 1" class="auto-return-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            <span>将退回至唯一许可环节：{{ filteredTargets[0].node_name }}</span>
          </div>

          <!-- 无合法退回目标 -->
          <el-alert
            v-if="filteredTargets.length === 0 && !loadingTargets"
            title="当前策略下无可退回的目标环节，无法执行退回修改。"
            type="warning"
            :closable="false"
            show-icon
            class="terminate-alert"
          />

          <!-- 自主指定环节选择器 -->
          <el-form-item v-if="targetMode === 'CUSTOM'" label="退回环节" required>
            <el-select
              v-model="targetNodeId"
              placeholder="请自主选择退回环节"
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
        </template>

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
import { WarningFilled, InfoFilled } from "@element-plus/icons-vue"
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
const targetMode = ref<"AUTO" | "CUSTOM">("AUTO")
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

const hasMultipleTargets = computed(() => filteredTargets.value.length > 1)

const isConfirmDisabled = computed(() => {
  if (!comment.value.trim() || submitting.value) return true
  if (rejectType.value === "RETURN") {
    if (targetMode.value === "CUSTOM" && !targetNodeId.value) return true
    // 无合法退回目标时禁用，避免提交后才被引擎拒绝
    if (!loadingTargets.value && filteredTargets.value.length === 0) return true
  }
  return false
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
      targetMode.value = "AUTO"
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
    if (targetMode.value === "CUSTOM" && !targetNodeId.value) {
      ElMessage.warning("请选择退回环节")
      return
    }
  }

  submitting.value = true
  try {
    let targetId: string | undefined
    if (rejectType.value === "RETURN") {
      if (targetMode.value === "CUSTOM") {
        targetId = targetNodeId.value
      } else if (filteredTargets.value.length === 1) {
        // 单一许可目标显式下推，避免 AUTO 在收窄策略下落到非许可类别
        targetId = filteredTargets.value[0].node_id
      }
    }

    await rejectTicketApi({
      ticket_id: props.ticketId,
      task_id: props.taskId,
      comment: comment.value.trim(),
      target_node_id: targetId,
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
  targetMode.value = "AUTO"
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

.auto-return-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;

  .hint-icon {
    font-size: 14px;
    color: #3b82f6;
    flex-shrink: 0;
  }
}
</style>
