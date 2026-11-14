<template>
  <div class="form-container">
    <div class="form-scroll-area">
      <!-- 审批反馈与前序意见融合栏（已组件化隔离） -->
      <FeedbackBanner
        :ticket-status="ticketStatus"
        :latest-reject="latestReject"
        :prior-comments="priorComments"
        :is-history-mode="isHistoryMode"
      />

      <!-- 撤单原因全局警示 -->
      <div v-if="revokeReason" class="ticket-revoke-reason ticket-revoke-reason--top">
        <div class="ticket-revoke-reason__head">撤单原因</div>
        <p>{{ revokeReason }}</p>
      </div>

      <!-- 表单核心信息区 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>表单信息</span>
        </div>

        <div v-if="props.action !== 'my-Start'">
          <FormCreate
            :rule="rule"
            :option="options"
            v-model="data"
            :disabled="props.action !== 'my'"
            v-model:api="fApi"
          />
        </div>

        <div v-if="props.action === 'my-Start'">
          <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
        </div>

        <!-- 工单评价卡片 -->
        <div v-if="ticketRating" class="ticket-rating-summary">
          <div class="ticket-rating-summary__head">
            <span>工单评价</span>
            <small>{{ dayjs(ticketRating.rated_at).format("YYYY-MM-DD HH:mm") }}</small>
          </div>
          <el-rate :model-value="ticketRating.score" disabled />
          <p>{{ ticketRating.comment || "未填写评价内容" }}</p>
        </div>
      </div>

      <!-- 操作与审批信息区 -->
      <div v-if="!isHistoryModeAction(props.action)" class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>操作信息</span>
        </div>

        <el-form ref="formRef" :model="formData" label-position="top" class="operation-form">
          <div v-if="taskFormSchema && taskFormSchema.length > 0" class="dynamic-form-section">
            <DynamicForm ref="dynamicFormRef" :schema="taskFormSchema" v-model="taskFormData" />
          </div>

          <el-form-item prop="comment" label="评论" class="form-item required">
            <el-input
              v-model="formData.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入评论内容"
              maxlength="200"
              show-word-limit
              class="form-textarea"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="showActionFooter" class="form-footer">
      <template v-if="props.action === 'my-Start'">
        <AuthButton type="primary" :icon="EditPen" :capability="TICKET_CAPABILITIES.Manager.Pass" @click="handlePass">
          修改
        </AuthButton>
        <AuthButton
          type="danger"
          :icon="RefreshLeft"
          :capability="TICKET_CAPABILITIES.Manager.Revoke"
          @click="handleRevoke"
        >
          撤回
        </AuthButton>
      </template>
      <template v-else>
        <AuthButton
          type="primary"
          :icon="Check"
          :capability="TICKET_CAPABILITIES.Manager.Pass"
          @click="handlePassConfirm"
        >
          同意
        </AuthButton>
        <AuthButton
          v-if="allowReject"
          type="danger"
          :icon="Close"
          :capability="TICKET_CAPABILITIES.Manager.Reject"
          @click="handleRejectConfirm"
        >
          驳回
        </AuthButton>
        <AuthButton
          v-if="allowTransfer"
          :icon="Switch"
          :capability="TICKET_CAPABILITIES.Manager.Transfer"
          @click="openTransfer"
        >
          转签
        </AuthButton>
      </template>
    </div>
  </div>

  <!-- 转签接收人弹窗 -->
  <ReceiverSelector
    v-if="transferVisible"
    v-model:visible="transferVisible"
    title="工单转签"
    result-panel-title="已选接收人"
    empty-text="请从左侧选择转签目标"
    :modes="['user']"
    hide-single-tab
    expand-assignees
    :username-to-display-name="usernameToDisplayName"
    @update-user-names="handleUpdateUserNames"
    @confirm="handleTransferConfirm"
  />

  <!-- 撤单确认弹窗 -->
  <RevokeTicketDialog
    v-model="revokeVisible"
    :instance-id="props.processInstId"
    subject="当前工单"
    @submitted="resetForm"
  />

  <!-- 驳回决策弹窗 -->
  <RejectTicketDialog
    v-model="rejectVisible"
    :ticket-id="currentTicketId"
    :task-id="props.taskId"
    :policy="currentFlowPolicy"
    @submitted="resetForm"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from "vue"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { Document, Setting, Check, Close, Switch, EditPen, RefreshLeft } from "@element-plus/icons-vue"
import formCreate, { Api } from "@form-create/element-ui"
import { getTicketByProcessInstIdApi } from "@/api/ticket/manager/index.js"
import type {
  TaskID,
  ProcessInstanceID,
  LatestReject,
  PriorComment,
  FlowPolicy,
  TicketRating
} from "@/api/ticket/manager/types/manager"
import { TicketStatus } from "@/api/ticket/manager/types/manager"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import RevokeTicketDialog from "../components/RevokeTicketDialog.vue"
import RejectTicketDialog from "../components/RejectTicketDialog.vue"
import FeedbackBanner from "./components/FeedbackBanner.vue"
import DynamicForm from "./components/DynamicForm.vue"
import { useTicketTemplate } from "./composables/useTicketTemplate"
import { useTicketOperations } from "./composables/useTicketOperations"
import { isHistoryModeAction } from "../utils"
import type { TicketFormData } from "./types"

interface Props {
  ticketId?: number
  templateId: number | undefined
  processInstId: ProcessInstanceID | undefined
  taskId: TaskID | undefined
  action: string
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: "close"): void
  (e: "refresh-data"): void
}>()

// 当前工单 ID（优先取 props.ticketId，也可由流程实例反查补充）
const currentTicketId = ref<number>(props.ticketId || 0)
watch(
  () => props.ticketId,
  (val) => {
    if (val) currentTicketId.value = val
  }
)

// formCreate 初始化
const FormCreate = formCreate.$form()
const fApi = ref<Api>()
const data = ref<TicketFormData>({})

// 工单状态与详细反馈信息
const ticketRating = ref<TicketRating>()
const revokeReason = ref("")
const ticketStatus = ref<TicketStatus>()
const latestReject = ref<LatestReject>()
const priorComments = ref<PriorComment[]>([])
const currentFlowPolicy = ref<FlowPolicy>()

// 权限策略计算
const allowTransfer = computed(() => currentFlowPolicy.value?.allow_transfer ?? false)
const allowReject = computed(() => currentFlowPolicy.value?.allow_reject ?? true)

// 是否为历史或发起人只读查看模式
const isHistoryMode = computed(() => isHistoryModeAction(props.action))

// 底部操作栏仅在可操作模式显示（审批 / 发起人修改撤回）
const showActionFooter = computed(() => props.action === "my-Start" || !isHistoryModeAction(props.action))

// 1. 抽离的工单模板加载逻辑
const { rule, options, handleDetail, resetTemplate } = useTicketTemplate({
  action: () => props.action
})

// 2. 抽离的工单审批、修改、转签、驳回操作逻辑
const {
  formData,
  taskFormSchema,
  taskFormData,
  formRef,
  dynamicFormRef,
  transferVisible,
  revokeVisible,
  rejectVisible,
  usernameToDisplayName,
  handleUpdateUserNames,
  handleGetTaskFormConfig,
  handlePassConfirm,
  handlePass,
  openTransfer,
  handleTransferConfirm,
  handleRejectConfirm,
  handleRevoke,
  resetForm
} = useTicketOperations({
  ticketId: currentTicketId,
  taskId: toRef(props, "taskId"),
  processInstId: toRef(props, "processInstId"),
  mainFormData: data,
  fApi,
  onSuccess: () => {
    emits("close")
    emits("refresh-data")
  }
})

// 加载工单详情数据
const resetTicketFeedback = () => {
  ticketRating.value = undefined
  revokeReason.value = ""
  ticketStatus.value = undefined
  latestReject.value = undefined
  priorComments.value = []
  currentFlowPolicy.value = undefined
}

const handleGetTicketData = async (processInstId: ProcessInstanceID) => {
  resetTicketFeedback()

  try {
    const { data: ticketInfo } = await getTicketByProcessInstIdApi(processInstId)
    if (ticketInfo.id) {
      currentTicketId.value = ticketInfo.id
    }
    ticketStatus.value = ticketInfo.status
    data.value = (ticketInfo.data as TicketFormData) || {}
    ticketRating.value = ticketInfo.rating
    revokeReason.value = ticketInfo.revoke_reason || ""
    latestReject.value = ticketInfo.latest_reject
    priorComments.value = ticketInfo.prior_comments?.items ?? []
    currentFlowPolicy.value = ticketInfo.flow_policy

    const taskId = props.taskId || ticketInfo.task_id
    if (taskId && ticketInfo.workflow_id) {
      await handleGetTaskFormConfig(taskId, ticketInfo.workflow_id)
    }

    if (!props.templateId && ticketInfo.template_id) {
      await handleDetail(ticketInfo.template_id)
    }
  } catch (error) {
    data.value = {}
    resetTicketFeedback()
    ElMessage.error("获取工单详情失败")
  }
}

// 深度同步上下文
const syncTicketContext = async () => {
  if (props.templateId && props.processInstId) {
    await handleDetail(props.templateId)
  }

  if (props.processInstId) {
    await handleGetTicketData(props.processInstId)
  } else {
    resetTemplate()
  }
}

watch([() => props.templateId, () => props.processInstId], syncTicketContext, { immediate: true })
</script>

<style lang="scss" scoped>
.form-container {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.form-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px;
}

.form-section {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #edf2f7;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 14px;

  .el-icon {
    display: inline-flex;
    color: #409eff;
    font-size: 18px;
  }

  span {
    font-size: 15px;
  }
}

.operation-form {
  max-width: 960px;
}

.dynamic-form-section {
  margin-bottom: 4px;
}

.form-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.form-item {
  &.required :deep(.el-form-item__label) {
    position: relative;

    &::before {
      content: "*";
      color: #f56c6c;
      margin-right: 4px;
    }
  }
}

.form-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 6px;
    resize: vertical;
  }
}

.ticket-revoke-reason {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  color: #f56c6c;

  &__head {
    font-weight: 600;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }
}

.ticket-rating-summary {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    span {
      font-weight: 600;
      color: #334155;
    }

    small {
      color: #94a3b8;
      font-size: 12px;
    }
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }
}
</style>
