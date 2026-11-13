<template>
  <div class="form-container">
    <div class="form-scroll-area">
      <!-- 审批驳回说明：置于顶部高亮警示，确保用户第一时间掌握驳回背景与修改要求 -->
      <div v-if="latestReject" ref="rejectBannerRef" class="ticket-reject-reason ticket-reject-reason--top">
        <div class="ticket-reject-reason__head">
          <span class="reject-title">
            <el-icon class="warning-icon"><WarningFilled /></el-icon>
            审批驳回说明
          </span>
          <small class="reject-time">{{ formatRejectTime(latestReject.rejected_at) }}</small>
        </div>
        <p class="reject-meta">
          由 <strong>{{ latestReject.rejected_by_name || latestReject.rejected_by }}</strong> 在 [{{ latestReject.node_name }}] 环节驳回
        </p>
        <p class="reject-desc">修改意见：{{ latestReject.reason }}</p>
      </div>

      <!-- 撤单原因全局警示 -->
      <div v-if="revokeReason" class="ticket-revoke-reason ticket-revoke-reason--top">
        <div class="ticket-revoke-reason__head">撤单原因</div>
        <p>{{ revokeReason }}</p>
      </div>

      <!-- 前序审批意见：只读上下文置于顶部、驳回横幅之下，阅读顺序即决策顺序。
           默认折叠成一行摘要，避免把表单推下首屏；被驳回工单自动展开（此时历史是决策关键）。
           门禁与「操作信息」段一致：发起人视图与历史视图不展示 -->
      <div v-if="showPriorComments" class="prior-comments">
        <button
          type="button"
          class="prior-comments__head"
          :aria-expanded="priorCommentsExpanded"
          @click="priorCommentsExpanded = !priorCommentsExpanded"
        >
          <span class="prior-comments__title">
            <el-icon class="prior-comments__caret" :class="{ 'is-expanded': priorCommentsExpanded }">
              <ArrowRight />
            </el-icon>
            前序审批意见
            <!-- 计数必须等于展开后实际渲染的行数：后端 total 含被顶部横幅剔除的那条驳回，
                 直接用 total 会出现「3 条」却只列 2 行的错位；横幅那条已在横幅展示，不重复计 -->
            <small>（{{ visiblePriorComments.length }} 条）</small>
          </span>
          <small v-if="hiddenPriorCommentCount > 0">
            另有 {{ hiddenPriorCommentCount }} 条更早意见，完整链路见「审批记录」
          </small>
        </button>
        <el-collapse-transition>
          <ul v-show="priorCommentsExpanded" class="prior-comments__list">
            <li
              v-for="(item, index) in visiblePriorComments"
              :key="`${item.node_id}-${item.approved_by}-${item.occurred_at}-${index}`"
              class="prior-comments__item"
            >
              <div class="prior-comments__meta">
                <span class="prior-comments__node">{{ item.node_name }}</span>
                <el-tag :type="priorCommentVerdict(item.status).type" size="small" effect="light">
                  {{ priorCommentVerdict(item.status).label }}
                </el-tag>
                <span>{{ item.approved_by_name }}</span>
                <small class="prior-comments__time">{{ item.occurred_at }}</small>
              </div>
              <p class="prior-comments__text">{{ item.comment }}</p>
            </li>
          </ul>
        </el-collapse-transition>
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

          <!-- 驳回回声：顶部横幅与评论框之间隔整张表单，落笔处再给一行修改意见，避免来回滚动；
               单行截断保持紧凑，完整上下文点链接跳回顶部横幅 -->
          <div v-if="latestReject" class="reject-echo">
            <span class="reject-echo__label">驳回修改意见</span>
            <span class="reject-echo__text" :title="latestReject.reason">{{ latestReject.reason }}</span>
            <button type="button" class="reject-echo__link" @click="scrollToRejectBanner">查看完整说明</button>
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
import { Document, Setting, EditPen, RefreshLeft, Check, Close, Switch, WarningFilled, ArrowRight } from "@element-plus/icons-vue"
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
const priorCommentTotal = ref(0)
// 默认折叠成一行摘要；加载到被驳回工单时自动展开，见 handleGetTicketData
const priorCommentsExpanded = ref(false)
const currentFlowPolicy = ref<FlowPolicy>()
const allowTransfer = computed(() => currentFlowPolicy.value?.allow_transfer ?? false)
const allowReject = computed(() => currentFlowPolicy.value?.allow_reject ?? true)

// 顶部驳回横幅已完整展示最近一次驳回，面板剔除同一条，避免审批人读到重复意见；
// 会签可能同节点同秒多人驳回，故账号也参与比对，只精确命中横幅那一条
const visiblePriorComments = computed(() => {
  const banner = latestReject.value
  if (!banner) return priorComments.value
  return priorComments.value.filter(
    (item) =>
      !(
        item.status === 2 &&
        item.node_id === banner.node_id &&
        item.approved_by === banner.rejected_by &&
        item.occurred_at === banner.rejected_at
      )
  )
})
// 折叠数按后端返回页大小算，而非去重后的展示数：被剔除的那条已在顶部横幅展示，不算遗漏
const hiddenPriorCommentCount = computed(() => Math.max(priorCommentTotal.value - priorComments.value.length, 0))
// 与「操作信息」段同一门禁：发起人视图与历史视图不展示前序意见
const showPriorComments = computed(
  () => visiblePriorComments.value.length > 0 && !/^my-/.test(props.action) && props.action !== "history"
)
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

const rejectBannerRef = ref<HTMLElement | null>(null)
const scrollToRejectBanner = () => {
  rejectBannerRef.value?.scrollIntoView({ behavior: "smooth", block: "start" })
}

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
  priorCommentTotal.value = 0
  priorCommentsExpanded.value = false
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
    // 被驳回工单的历史意见是决策关键，默认展开；其余工单保持折叠以免把表单推下首屏
    priorCommentsExpanded.value = !!ticketInfo.latest_reject
    priorComments.value = ticketInfo.prior_comments?.items ?? []
    priorCommentTotal.value = ticketInfo.prior_comments?.total ?? 0
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
    priorCommentTotal.value = 0
    priorCommentsExpanded.value = false
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

.reject-echo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  background: #fff7ed;
  font-size: 12px;
  color: #9a3412;
}

.reject-echo__label {
  flex-shrink: 0;
  font-weight: 600;
  color: #ea580c;
}

.reject-echo__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reject-echo__link {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  color: #b45309;
  text-decoration: underline;
}

.prior-comments {
  max-width: 960px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.prior-comments__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;

  small {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 400;
  }
}

.prior-comments__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.prior-comments__caret {
  transition: transform 0.2s;

  &.is-expanded {
    transform: rotate(90deg);
  }
}

.prior-comments__list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.prior-comments__item {
  padding: 8px 0;
  border-top: 1px dashed #e2e8f0;

  &:first-child {
    padding-top: 0;
    border-top: none;
  }
}

.prior-comments__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #475569;
}

.prior-comments__node {
  font-weight: 600;
  color: #1e293b;
}

.prior-comments__time {
  margin-left: auto;
  color: #94a3b8;
  font-size: 11px;
}

.prior-comments__text {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.ticket-rating-summary {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid #f1e3b8;
  border-radius: 8px;
  background: #fffbeb;

  p {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.ticket-revoke-reason {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;

  p {
    margin: 7px 0 0;
    color: #7f1d1d;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.ticket-revoke-reason__head {
  color: #991b1b;
  font-size: 13px;
  font-weight: 600;
}

.ticket-reject-reason {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid #fed7aa;
  border-left: 4px solid #ea580c;
  border-radius: 8px;
  background: #fff7ed;
  box-shadow: 0 1px 2px rgba(234, 88, 12, 0.05);

  &.ticket-reject-reason--top {
    margin-top: 0;
    margin-bottom: 18px;
  }

  .reject-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #ea580c;

    .warning-icon {
      font-size: 15px;
    }
  }

  .reject-meta {
    margin: 6px 0 2px;
    font-size: 13px;
    color: #9a3412;
  }

  .reject-desc {
    margin: 6px 0 0;
    color: #c2410c;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    background: #ffedd5;
    padding: 8px 12px;
    border-radius: 6px;
  }
}

.ticket-reject-reason__head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  small {
    color: #9a3412;
    font-size: 11px;
    font-weight: 400;
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
