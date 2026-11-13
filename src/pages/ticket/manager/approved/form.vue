<template>
  <div class="form-container">
    <div class="form-scroll-area">
      <!-- 审批反馈与前序意见融合栏：默认单行紧凑展示，首屏优先呈现表单信息，可一键展开完整审批历史 -->
      <div
        v-if="hasFeedbackBanner"
        class="feedback-banner"
        :class="{
          'is-reject': !!latestReject,
          'is-expanded': feedbackExpanded
        }"
      >
        <div class="feedback-banner__bar" @click="feedbackExpanded = !feedbackExpanded">
          <div class="feedback-banner__left">
            <span class="feedback-banner__icon">
              <el-icon v-if="latestReject"><WarningFilled /></el-icon>
              <el-icon v-else><ChatDotRound /></el-icon>
            </span>

            <el-tag
              :type="latestReject ? 'warning' : 'info'"
              size="small"
              effect="light"
              round
              class="feedback-banner__tag"
            >
              {{ latestReject ? "驳回修改" : (isHistoryMode ? "审批留言" : "审批意见") }}
            </el-tag>

            <span class="feedback-banner__summary" :title="feedbackSummaryText">
              {{ feedbackSummaryText }}
            </span>
          </div>

          <div class="feedback-banner__right">
            <span v-if="historyCountText" class="feedback-banner__count">
              {{ historyCountText }}
            </span>
            <span class="feedback-banner__toggle">
              <span>{{ feedbackExpanded ? "收起" : "展开详情" }}</span>
              <el-icon class="toggle-icon" :class="{ 'is-expanded': feedbackExpanded }">
                <ArrowRight />
              </el-icon>
            </span>
          </div>
        </div>

        <!-- 折叠展开详情区 -->
        <el-collapse-transition>
          <div v-show="feedbackExpanded" class="feedback-banner__content">
            <!-- 详细驳回修改意见卡片 (存在驳回时醒目呈现) -->
            <div v-if="latestReject" class="reject-detail-card">
              <div class="reject-detail-card__header">
                <div class="node-meta">
                  <span class="node-tag">[{{ latestReject.node_name }}] 环节驳回</span>
                  <span class="user-info">
                    处理人：<strong>{{ latestReject.rejected_by_name || latestReject.rejected_by }}</strong>
                  </span>
                </div>
                <span class="time">{{ formatRejectTime(latestReject.rejected_at) }}</span>
              </div>
              <div class="reject-detail-card__body">
                <span class="label">修改意见：</span>
                <span class="text">{{ latestReject.reason }}</span>
              </div>
            </div>

            <!-- 前序历史审批意见时间线 -->
            <div v-if="visiblePriorComments.length > 0" class="flow-history">
              <div v-if="latestReject || isHistoryMode" class="flow-history__title">
                {{ isHistoryMode ? "流转留言记录" : "前序流转记录" }}
              </div>
              <div class="flow-history__timeline">
                <div
                  v-for="(item, index) in visiblePriorComments"
                  :key="`${item.node_id}-${item.approved_by}-${item.occurred_at}-${index}`"
                  class="flow-history__item"
                >
                  <div class="flow-history__dot" :class="`is-${priorCommentVerdict(item.status).type}`" />
                  <div class="flow-history__main">
                    <div class="flow-history__meta">
                      <span class="node-name">{{ item.node_name }}</span>
                      <el-tag :type="priorCommentVerdict(item.status).type" size="small" effect="plain" class="verdict-tag">
                        {{ priorCommentVerdict(item.status).label }}
                      </el-tag>
                      <span class="user-name">{{ item.approved_by_name }}</span>
                      <span class="time-stamp">{{ item.occurred_at }}</span>
                    </div>
                    <p v-if="item.comment" class="flow-history__comment">{{ item.comment }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 撤单原因全局警示 -->
      <div v-if="revokeReason" class="ticket-revoke-reason ticket-revoke-reason--top">
        <div class="ticket-revoke-reason__head">撤单原因</div>
        <p>{{ revokeReason }}</p>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>表单信息</span>
        </div>

        <div v-if="props.action != 'my-Start'">
          <FormCreate
            :rule="rule"
            :option="options"
            v-model="data"
            :disabled="props.action != 'my'"
            v-model:api="fApi"
          />
        </div>

        <div v-if="props.action == 'my-Start'">
          <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
          <div class="form-actions">
            <AuthButton
              type="primary"
              :icon="EditPen"
              :capability="TICKET_CAPABILITIES.Manager.Pass"
              @click="handlePass"
            >
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
          </div>
        </div>

        <div v-if="ticketRating" class="ticket-rating-summary">
          <div class="ticket-rating-summary__head">
            <span>工单评价</span>
            <small>{{ dayjs(ticketRating.rated_at).format("YYYY-MM-DD HH:mm") }}</small>
          </div>
          <el-rate :model-value="ticketRating.score" disabled />
          <p>{{ ticketRating.comment || "未填写评价内容" }}</p>
        </div>
      </div>

      <div v-if="!/^my-/.test(props.action) && props.action !== 'history'" class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>操作信息</span>
        </div>

        <el-form ref="formRef" :model="formData" label-position="top" class="operation-form">
          <div v-if="taskFormSchema && taskFormSchema.length > 0" class="dynamic-form-section">
            <DynamicForm ref="dynamicFormRef" :schema="taskFormSchema" v-model="taskFormData" :compact="false" />
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

        <div class="form-actions">
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
        </div>
      </div>
    </div>
  </div>

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

  <RevokeTicketDialog
    v-model="revokeVisible"
    :instance-id="props.processInstId"
    subject="当前工单"
    @submitted="handleRevokeSubmitted"
  />

  <RejectTicketDialog
    v-model="rejectVisible"
    :ticket-id="currentTicketId"
    :task-id="props.taskId"
    :policy="currentFlowPolicy"
    @submitted="handleRejectSubmitted"
  />
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import formCreate, { Api, FormRule } from "@form-create/element-ui"
import { ref, watch } from "vue"
import dayjs from "dayjs"
import {
  getTicketByProcessInstIdApi,
  passTicketApi,
  rejectTicketApi,
  transferTicketApi
} from "@/api/ticket/manager/index.js"
import type { PassTicketReq, TicketRating } from "@/api/ticket/manager/types/manager.js"
import { cloneDeep } from "lodash-es"
import { FormInstance, ElMessageBox, ElMessage } from "element-plus"
import {
  Document,
  Setting,
  EditPen,
  RefreshLeft,
  Check,
  Close,
  Switch,
  WarningFilled,
  ArrowRight,
  ChatDotRound
} from "@element-plus/icons-vue"
import DynamicForm from "./components/DynamicForm.vue"
import { getTaskFormConfigApi } from "@/api/ticket/manager/index"
import { removeFetchFromRules } from "@/common/utils/form-create"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import RevokeTicketDialog from "../components/RevokeTicketDialog.vue"
import RejectTicketDialog from "../components/RejectTicketDialog.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type {
  TaskID,
  ProcessInstanceID,
  LatestReject,
  PriorComment,
  FlowPolicy
} from "@/api/ticket/manager/types/manager"
import type {
  DynamicFormExpose,
  DynamicFormField,
  DynamicFormData,
  FormCreateOptions,
  TicketFormData,
  TicketFormDraft,
  TransferAssignee
} from "./types"

interface Props {
  ticketId?: number
  templateId: number | undefined
  processInstId: ProcessInstanceID | undefined
  taskId: TaskID | undefined
  action: string
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "refresh-data"])
const { hasPermission } = usePermission()

// 当前工单 ID（优先取 props.ticketId，也可由流程实例反查补充）
const currentTicketId = ref<number>(props.ticketId || 0)
watch(
  () => props.ticketId,
  (val) => {
    if (val) currentTicketId.value = val
  }
)

//获取 formCreate 组件
const FormCreate = formCreate.$form()
const fApi = ref<Api>()
const data = ref<TicketFormData>({})
const ticketRating = ref<TicketRating>()
const revokeReason = ref("")
const latestReject = ref<LatestReject>()
const priorComments = ref<PriorComment[]>([])
// 审批反馈与前序意见融合栏：默认折叠，保持单行紧凑展示，保障用户首屏快速查看表单信息
const feedbackExpanded = ref(false)
const currentFlowPolicy = ref<FlowPolicy>()
const allowTransfer = computed(() => currentFlowPolicy.value?.allow_transfer ?? false)
const allowReject = computed(() => currentFlowPolicy.value?.allow_reject ?? true)

// 是否为历史或发起人只读查看模式（该模式下重点聚焦于审批留言与意见，全量流程事件由「审批记录」Tab 承载）
const isHistoryMode = computed(() => props.action === "history" || /^my-/.test(props.action))

// 辅助方法：判断是否存在实质性留言内容
const hasSubstantiveComment = (text?: string) => Boolean(text && text.trim().length > 0)

// 顶部驳回信息与流转留言统一在融合栏展示；
// 1. 当存在驳回时，自动过滤同一次驳回记录，避免同屏重复；
// 2. 针对历史模式（及只读工单），严格只筛选真正填有留言/意见的审批记录（comment 非空），
//    不含留言的常规流转事件保留在【审批记录】Tab 中查看，确保首屏横幅纯粹聚焦在“留言与修改建议”
const visiblePriorComments = computed(() => {
  const banner = latestReject.value
  return priorComments.value.filter((item) => {
    // 剔除与顶部 latestReject 重复的那条驳回记录
    if (
      banner &&
      item.status === 2 &&
      item.node_id === banner.node_id &&
      item.approved_by === banner.rejected_by &&
      item.occurred_at === banner.rejected_at
    ) {
      return false
    }

    // 历史及发起人模式：只提取有实际留言内容的审批条目
    if (isHistoryMode.value) {
      return hasSubstantiveComment(item.comment)
    }

    // 待办模式：保留前序流转（包含驳回与普通前序审批）
    return true
  })
})

// 是否展示前序留言或前序流转
const showPriorComments = computed(() => visiblePriorComments.value.length > 0)

// 是否展示审批反馈融合栏（存在驳回或存在有效留言/前序意见时展示）
const hasFeedbackBanner = computed(() => {
  return !!latestReject.value || showPriorComments.value
})

// 单行横幅的摘要说明文字（超出单行时通过省略号截断并支持 title 提示）
const feedbackSummaryText = computed(() => {
  if (latestReject.value) {
    const operator = latestReject.value.rejected_by_name || latestReject.value.rejected_by || "处理人"
    const node = latestReject.value.node_name ? `在 [${latestReject.value.node_name}] 环节` : ""
    const reason = latestReject.value.reason ? ` · 修改意见：${latestReject.value.reason}` : ""
    return `由 ${operator} ${node}驳回${reason}`
  }
  if (visiblePriorComments.value.length > 0) {
    const latest = visiblePriorComments.value[0]
    const user = latest.approved_by_name || latest.approved_by
    const reason = latest.comment ? ` · ${latest.comment}` : " · 无附加意见"

    if (isHistoryMode.value) {
      return `审批留言：${user} (${latest.node_name})${reason}`
    }

    const action = latest.status === 2 ? "驳回" : "通过"
    return `前序审批：[${action}] ${user} (${latest.node_name})${reason}`
  }
  return ""
})

// 历史留言/记录条数描述
const historyCountText = computed(() => {
  const count = visiblePriorComments.value.length
  if (count > 0) {
    return isHistoryMode.value ? `共 ${count} 条留言` : `共 ${count} 条记录`
  }
  return ""
})
const priorCommentVerdict = (status: number): { label: string; type: "success" | "danger" } =>
  status === 2 ? { label: "驳回", type: "danger" } : { label: "通过", type: "success" }
const rule = ref<FormRule[]>()
const options = ref<FormCreateOptions>()

const DEFAULT_FORM_DATA: PassTicketReq = {
  task_id: "",
  comment: ""
}
const formData = ref<PassTicketReq>(cloneDeep(DEFAULT_FORM_DATA))
const taskFormSchema = ref<DynamicFormField[]>([])
const taskFormData = ref<DynamicFormData>({})
const formRef = ref<FormInstance | null>(null)
const dynamicFormRef = ref<DynamicFormExpose | null>(null)

// 转签与操作对话框
const transferVisible = ref(false)
const transferLoading = ref(false)
const revokeVisible = ref(false)
const rejectVisible = ref(false)
const usernameToDisplayName = ref<Record<string, string>>({})

const formatRejectTime = (timeStr?: string) => {
  if (!timeStr) return ""
  const d = dayjs(timeStr)
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : timeStr
}

const handleUpdateUserNames = (map: Record<string, string>) => {
  usernameToDisplayName.value = { ...usernameToDisplayName.value, ...map }
}

const canOperate = (capability: string) => {
  if (hasPermission(capability)) return true

  ElMessage.warning("暂无操作权限")
  return false
}

const openTransfer = () => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Transfer)) return
  transferVisible.value = true
}

const handleTransferConfirm = async (assignees: TransferAssignee[]) => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Transfer)) return

  const usernames = assignees.filter((a) => a.rule === "appoint").flatMap((a) => a.values)

  if (usernames.length === 0) {
    ElMessage.warning("请选择转签用户")
    return
  }

  transferLoading.value = true
  try {
    await transferTicketApi({ ticket_id: currentTicketId.value, task_id: props.taskId!, usernames })
    ElMessage.success("转签成功")
    resetForm()
  } catch (error) {
    console.error("转签失败:", error)
  } finally {
    transferLoading.value = false
  }
}

// 用于缓存每个工单的操作信息（草稿），key 为 processInstId
const formDrafts = ref(new Map<ProcessInstanceID, TicketFormDraft>())

const saveDraft = (processInstId?: ProcessInstanceID) => {
  if (!processInstId) return

  formDrafts.value.set(processInstId, {
    formData: cloneDeep(formData.value),
    taskFormData: cloneDeep(taskFormData.value)
  })
}

const restoreDraft = (processInstId?: ProcessInstanceID) => {
  if (!processInstId) return

  const draft = formDrafts.value.get(processInstId)
  formData.value = draft ? cloneDeep(draft.formData) : cloneDeep(DEFAULT_FORM_DATA)
  taskFormData.value = draft ? cloneDeep(draft.taskFormData) : {}
  formRef.value?.clearValidate()
}

watch(
  () => props.processInstId,
  (newId, oldId) => {
    saveDraft(oldId)
    restoreDraft(newId)
  },
  { immediate: true }
)

const isReadonlyTemplateMode = () => props.action !== "my" && props.action !== "my-Start"

const handleDetail = async (id: number) => {
  try {
    const { data: template } = await detailTemplateApi(id)
    const parsedOptions = formCreate.parseJson(template.options) as FormCreateOptions
    parsedOptions.submitBtn = false

    const parsedRules = formCreate.parseJson(template.rules) as FormRule[]

    if (isReadonlyTemplateMode()) {
      removeFetchFromRules(parsedRules)
      removeFetchFromRules(parsedOptions)
    }

    options.value = parsedOptions
    rule.value = parsedRules
  } catch (error) {
    options.value = undefined
    rule.value = []
    ElMessage.error("获取工单模板失败")
  }
}

const handleGetTicketData = async (processInstId: ProcessInstanceID) => {
  ticketRating.value = undefined
  revokeReason.value = ""
  latestReject.value = undefined
  priorComments.value = []
  feedbackExpanded.value = false
  currentFlowPolicy.value = undefined
  taskFormData.value = {}
  try {
    const { data: ticketInfo } = await getTicketByProcessInstIdApi(processInstId)
    if (ticketInfo.id) {
      currentTicketId.value = ticketInfo.id
    }
    data.value = ticketInfo.data as TicketFormData
    ticketRating.value = ticketInfo.rating
    revokeReason.value = ticketInfo.revoke_reason || ""
    latestReject.value = ticketInfo.latest_reject
    // 审批反馈融合栏默认保持单行紧凑展示，首屏优先呈现表单业务信息；用户可按需点击展开
    feedbackExpanded.value = false
    priorComments.value = ticketInfo.prior_comments?.items ?? []
    currentFlowPolicy.value = ticketInfo.flow_policy

    const taskId = props.taskId || ticketInfo.task_id
    if (taskId && ticketInfo.workflow_id) {
      await handleGetTaskFormConfig(taskId, ticketInfo.workflow_id)
    } else {
      taskFormSchema.value = []
    }

    if (!props.templateId && ticketInfo.template_id) {
      await handleDetail(ticketInfo.template_id)
    }
  } catch (error) {
    data.value = {}
    ticketRating.value = undefined
    revokeReason.value = ""
    latestReject.value = undefined
    priorComments.value = []
    feedbackExpanded.value = false
    currentFlowPolicy.value = undefined
    taskFormSchema.value = []
    ElMessage.error("获取工单详情失败")
  }
}

// 获取任务表单配置
const handleGetTaskFormConfig = async (taskId: TaskID, workflowId: number) => {
  try {
    const { data } = await getTaskFormConfigApi({
      ticket_id: currentTicketId.value,
      task_id: taskId,
      workflow_id: workflowId
    })

    if (Array.isArray(data)) {
      taskFormSchema.value = data as DynamicFormField[]
    } else if (data && typeof data === "object") {
      const configRes = data as { fields: DynamicFormField[]; values?: Record<string, any> }
      taskFormSchema.value = configRes.fields || []
      // 历史数据自动回填回显 (Prefill)
      if (configRes.values && typeof configRes.values === "object") {
        taskFormData.value = { ...configRes.values, ...taskFormData.value }
      }
    } else {
      taskFormSchema.value = []
    }
  } catch (error) {
    taskFormSchema.value = []
    ElMessage.error("获取节点表单配置失败")
  }
}

// 同意确认弹窗
const handlePassConfirm = async () => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Pass)) return
  if (!formRef.value) return

  try {
    // 1. 验证基本表单 (评论)
    await formRef.value.validate()

    // 2. 验证动态表单 (如果存在)
    if (dynamicFormRef.value) {
      await dynamicFormRef.value.validate()
    }

    ElMessageBox.confirm("是否确认同意该工单？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        handlePassTicket()
      })
      .catch(() => undefined)
  } catch (error) {
    // 表单校验失败时保持当前输入状态
  }
}

const handlePass = () => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Pass)) return

  fApi.value?.validate((valid: boolean) => {
    if (!valid) return

    ElMessageBox.confirm("确认修改并提交工单？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        const submitData = {
          task_id: props.taskId || formData.value.task_id,
          comment: "修改并提交",
          ...data.value
        }

        handleSubmitChangedTicket(submitData)
      })
      .catch(() => undefined)
  })
}

const handleSubmitChangedTicket = async (submitData: PassTicketReq) => {
  try {
    await passTicketApi({
      ...submitData,
      ticket_id: currentTicketId.value
    })
    ElMessage.success("工单已提交")
    resetForm()
  } catch (error) {
    console.error("提交工单失败:", error)
  }
}

const handlePassTicket = async () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  const submitData = {
    ...formData.value,
    ticket_id: currentTicketId.value,
    extra_data: taskFormData.value
  }
  try {
    await passTicketApi(submitData)
    ElMessage.success("工单已同意")
    resetForm()
  } catch (error) {
    console.error("同意工单失败:", error)
  }
}

// 驳回确认弹窗
const handleRejectConfirm = () => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Reject)) return
  rejectVisible.value = true
}

const handleRejectSubmitted = () => {
  resetForm()
}

const handleRevoke = () => {
  if (!canOperate(TICKET_CAPABILITIES.Manager.Revoke)) return
  revokeVisible.value = true
}

const handleRevokeSubmitted = () => {
  resetForm()
}

const resetForm = () => {
  // 提交成功后清除当前工单的草稿
  if (props.processInstId) {
    formDrafts.value.delete(props.processInstId)
  }

  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  taskFormData.value = {}

  emits("close")
  emits("refresh-data")
}

const syncTicketContext = async () => {
  if (props.templateId && props.processInstId) {
    await handleDetail(props.templateId)
  }

  if (props.processInstId) {
    await handleGetTicketData(props.processInstId)
  }
}

watch([() => props.templateId, () => props.processInstId], syncTicketContext, { immediate: true })

defineExpose({})
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
  height: 100%;
  overflow-y: auto;
  padding: 18px 24px 84px;
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

// 审批反馈与前序意见融合栏（单行轻量展示，支持展开折叠）
.feedback-banner {
  max-width: 960px;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #3b82f6;
  background: #f8fafc;
  transition: all 0.2s ease;
  overflow: hidden;

  &.is-reject {
    border-color: #fde68a;
    border-left-color: #f59e0b;
    background: #fffbeb;

    &:hover {
      background: #fef3c7;
    }
  }

  &:not(.is-reject):hover {
    background: #f1f5f9;
  }

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 38px;
    padding: 5px 12px;
    cursor: pointer;
    user-select: none;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #3b82f6;
  }

  &.is-reject &__icon {
    color: #d97706;
  }

  &__tag {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 500;
  }

  &__summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: #374151;
    line-height: 20px;
  }

  &.is-reject &__summary {
    color: #92400e;
    font-weight: 500;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__count {
    font-size: 12px;
    color: #64748b;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    transition: color 0.15s ease;

    &:hover {
      color: #2563eb;
    }

    .toggle-icon {
      font-size: 12px;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-expanded {
        transform: rotate(90deg);
      }
    }
  }

  &.is-reject &__toggle {
    color: #b45309;

    &:hover {
      color: #d97706;
    }
  }

  &__content {
    padding: 12px 14px 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: #ffffff;
  }
}

// 驳回修改卡片
.reject-detail-card {
  padding: 10px 12px;
  background: #fffdfa;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  margin-bottom: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .node-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;

      .node-tag {
        font-weight: 600;
        color: #c2410c;
      }

      .user-info {
        color: #9a3412;

        strong {
          font-weight: 600;
          color: #7c2d12;
        }
      }
    }

    .time {
      font-size: 11px;
      color: #a8a29e;
    }
  }

  &__body {
    font-size: 12px;
    line-height: 1.6;

    .label {
      font-weight: 600;
      color: #ea580c;
    }

    .text {
      color: #374151;
      white-space: pre-wrap;
    }
  }
}

// 前序流转记录时间线
.flow-history {
  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin: 8px 0 10px;
  }

  &__timeline {
    display: flex;
    flex-direction: column;
  }

  &__item {
    position: relative;
    display: flex;
    gap: 10px;
    padding-bottom: 12px;

    &:last-child {
      padding-bottom: 0;

      &::before {
        display: none;
      }
    }

    &::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 14px;
      bottom: 0;
      width: 1px;
      background: #e2e8f0;
    }
  }

  &__dot {
    position: relative;
    top: 5px;
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #94a3b8;

    &.is-success {
      background: #10b981;
    }

    &.is-danger {
      background: #ef4444;
    }

    &.is-info {
      background: #3b82f6;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 4px;

    .node-name {
      font-weight: 600;
      color: #1e293b;
    }

    .verdict-tag {
      padding: 0 6px;
      height: 20px;
      font-size: 11px;
    }

    .user-name {
      color: #475569;
    }

    .time-stamp {
      margin-left: auto;
      color: #94a3b8;
      font-size: 11px;
    }
  }

  &__comment {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
    background: #f8fafc;
    border-radius: 4px;
    padding: 6px 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.ticket-revoke-reason {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #9ca3af;
  border-radius: 8px;
  background: #f9fafb;

  &.ticket-revoke-reason--top {
    margin-top: 0;
    margin-bottom: 18px;
  }
}

.ticket-rating-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;

  small {
    color: #a8a29e;
    font-size: 11px;
    font-weight: 400;
  }
}

.form-textarea {
  max-width: 960px;
}

.form-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.04);
  z-index: 10;

  .el-button {
    font-size: 14px;
    font-weight: 600;
    min-width: 92px;
    height: 36px;
  }
}
</style>
