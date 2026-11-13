<template>
  <FormDialog
    v-model="visible"
    title="审批驳回"
    width="520px"
    :header-icon="WarningFilled"
    :confirm-text="actionType === 'TERMINATE' ? '确认直接否决' : '确认退回'"
    :confirm-type="actionType === 'TERMINATE' ? 'danger' : 'primary'"
    :confirm-loading="submitting"
    :confirm-disabled="isConfirmDisabled"
    :show-footer-info="false"
    @confirm="submit"
    @cancel="visible = false"
    @closed="reset"
  >
    <div class="reject-dialog-content">
      <el-form label-position="top" @submit.prevent="submit">
        <!-- 驳回处理方式：高级 Bento 交互决策卡片组 -->
        <el-form-item v-if="availableActions.length > 1" label="处理方式" required class="action-tiles-item">
          <div class="action-tiles" :class="`grid-${availableActions.length}`">
            <div
              v-for="tile in actionTiles"
              :key="tile.type"
              class="action-tile"
              :class="{ 'is-selected': actionType === tile.type, 'is-danger-tile': tile.danger }"
              @click="actionType = tile.type"
            >
              <div class="tile-icon-wrap" :class="`is-${tile.tone}`">
                <el-icon><component :is="tile.icon" /></el-icon>
              </div>
              <div class="tile-info">
                <div class="tile-title">{{ tile.title }}</div>
                <div class="tile-desc">{{ tile.desc }}</div>
              </div>
              <div class="tile-check">
                <el-icon><Select /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 模式对应的辅助区域 -->
        <!-- 1. 自动回退说明 -->
        <div v-if="actionType === 'AUTO' && !noReturnTarget" class="mode-banner is-info">
          <el-icon class="banner-icon"><InfoFilled /></el-icon>
          <span v-if="filteredTargets.length === 1">
            工单将退回至唯一上游环节：<strong>{{ filteredTargets[0].node_name }}</strong>
          </span>
          <span v-else>由流程引擎自动按执行轨迹回溯至紧邻上游审批环节或发起人</span>
        </div>

        <!-- 2. 自主指定环节选择器 -->
        <el-form-item v-if="actionType === 'CUSTOM'" label="退回环节" required class="target-select-item">
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
                <span class="target-name">{{ target.node_name }}</span>
                <el-tag v-if="target.is_starter" size="small" type="warning" effect="light" round>
                  提单人
                </el-tag>
                <el-tag v-else size="small" type="info" effect="light" round>
                  上一环节
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 3. 直接否决终止警示 -->
        <div v-if="actionType === 'TERMINATE'" class="mode-banner is-danger">
          <el-icon class="banner-icon"><WarningFilled /></el-icon>
          <span>否决后流程将直接终止并作废归档，工单无法再次修改或提审。</span>
        </div>

        <!-- 驳回说明 / 修改意见 -->
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="comment"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="请详细说明驳回原因或修改要求，以便相关人员知晓并调整..."
            autofocus
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue"
import { WarningFilled, InfoFilled, RefreshLeft, Operation, CircleClose, Select } from "@element-plus/icons-vue"
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

type RejectActionType = "AUTO" | "CUSTOM" | "TERMINATE"

const comment = ref("")
const actionType = ref<RejectActionType>("AUTO")
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

const noReturnTarget = computed(() => !loadingTargets.value && filteredTargets.value.length === 0)

// 可用的处理方式选项列表（并列展示）
const availableActions = computed<RejectActionType[]>(() => {
  const actions: RejectActionType[] = []
  if (canReturn.value) {
    actions.push("AUTO")
    if (hasMultipleTargets.value) {
      actions.push("CUSTOM")
    }
  }
  if (canTerminate.value) {
    actions.push("TERMINATE")
  }
  return actions
})

const TILE_META: Record<RejectActionType, { title: string; desc: string; icon: Component; tone: string; danger?: boolean }> = {
  AUTO: { title: "自动回退", desc: "回溯至上一审批人", icon: RefreshLeft, tone: "blue" },
  CUSTOM: { title: "指定环节", desc: "精准自选回退节点", icon: Operation, tone: "indigo" },
  TERMINATE: { title: "直接否决", desc: "一票否决终止流程", icon: CircleClose, tone: "red", danger: true }
}

const actionTiles = computed(() => availableActions.value.map((type) => ({ type, ...TILE_META[type] })))

const isConfirmDisabled = computed(() => {
  if (!comment.value.trim() || submitting.value) return true
  if (actionType.value === "CUSTOM") {
    if (!targetNodeId.value) return true
  }
  if (actionType.value === "AUTO") {
    if (!loadingTargets.value && filteredTargets.value.length === 0) return true
  }
  return false
})

const syncDefaultAction = () => {
  if (!canReturn.value && canTerminate.value) {
    actionType.value = "TERMINATE"
  } else {
    actionType.value = "AUTO"
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
      syncDefaultAction()
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
    if (actionType.value === "CUSTOM" && !hasMultipleTargets.value) {
      actionType.value = "AUTO"
    }
  }
)

watch(
  availableActions,
  (actions) => {
    if (actions.length > 0 && !actions.includes(actionType.value)) {
      actionType.value = actions[0]
    }
  }
)

const submit = async () => {
  if (!props.taskId || !comment.value.trim() || submitting.value) return

  if (actionType.value === "TERMINATE" && !canTerminate.value) {
    ElMessage.warning("当前工作流配置不支持直接否决操作")
    return
  }

  if (actionType.value !== "TERMINATE") {
    if (!canReturn.value) {
      ElMessage.warning("当前工作流配置不支持退回修改操作")
      return
    }
    if (actionType.value === "CUSTOM" && !targetNodeId.value) {
      ElMessage.warning("请选择退回环节")
      return
    }
  }

  submitting.value = true
  try {
    let targetId: string | undefined
    if (actionType.value === "CUSTOM") {
      targetId = targetNodeId.value
    } else if (actionType.value === "AUTO" && filteredTargets.value.length === 1) {
      targetId = filteredTargets.value[0].node_id
    }

    await rejectTicketApi({
      ticket_id: props.ticketId,
      task_id: props.taskId,
      comment: comment.value.trim(),
      target_node_id: targetId,
      terminate: actionType.value === "TERMINATE"
    })

    ElMessage.success(actionType.value === "TERMINATE" ? "工单已直接否决" : "工单已退回修改")
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
  syncDefaultAction()
  targetNodeId.value = ""
  submitting.value = false
}
</script>

<style scoped lang="scss">
.reject-dialog-content {
  padding: 4px 4px 0;

  :deep(.el-form-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-form-item__label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      padding-bottom: 8px;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    padding: 10px 12px;
    background: #fbfdff;
    border-color: #cbd5e1;
    transition: all 0.2s ease;

    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

// 决策卡片网格
.action-tiles {
  display: grid;
  gap: 10px;
  width: 100%;

  &.grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &.grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.grid-1 {
    grid-template-columns: 1fr;
  }
}

.action-tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-sizing: border-box;

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.05);
  }

  &.is-selected {
    border-color: #3b82f6;
    background: #f0f7ff;
    box-shadow: 0 0 0 1px #3b82f6, 0 3px 10px rgba(59, 130, 246, 0.12);

    .tile-title {
      color: #1d4ed8;
      font-weight: 600;
    }

    .tile-check {
      opacity: 1;
      transform: scale(1);
      background: #3b82f6;
      color: #ffffff;
    }
  }

  &.is-danger-tile.is-selected {
    border-color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 0 0 1px #ef4444, 0 3px 10px rgba(239, 68, 68, 0.12);

    .tile-title {
      color: #b91c1c;
      font-weight: 600;
    }

    .tile-check {
      opacity: 1;
      transform: scale(1);
      background: #ef4444;
      color: #ffffff;
    }
  }
}

.tile-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &.is-blue {
    background: #eff6ff;
    color: #2563eb;
  }

  &.is-indigo {
    background: #eef2ff;
    color: #4f46e5;
  }

  &.is-red {
    background: #fef2f2;
    color: #dc2626;
  }
}

.tile-info {
  flex: 1;
  min-width: 0;

  .tile-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    line-height: 1.3;
    margin-bottom: 2px;
    transition: color 0.15s ease;
  }

  .tile-desc {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tile-check {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  opacity: 0;
  transform: scale(0.6);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.target-select-item {
  margin-top: 4px;
}

.target-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.mode-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: -4px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 6px;

  .banner-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  &.is-info {
    color: #0369a1;
    background: #f0f9ff;
    border: 1px solid #e0f2fe;

    .banner-icon {
      color: #0284c7;
    }
  }

  &.is-danger {
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fee2e2;

    .banner-icon {
      color: #ef4444;
    }
  }
}
</style>
