<template>
  <div class="form-container">
    <div class="form-scroll-area">
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
              :capability="TICKET_CAPABILITIES.Center.Pass"
              @click="handlePass"
            >
              修改
            </AuthButton>
            <AuthButton
              type="danger"
              :icon="RefreshLeft"
              :capability="TICKET_CAPABILITIES.Center.Revoke"
              @click="handleRevoke"
            >
              撤回
            </AuthButton>
          </div>
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
            :capability="TICKET_CAPABILITIES.Center.Pass"
            @click="handlePassConfirm"
          >
            同意
          </AuthButton>
          <AuthButton
            type="danger"
            :icon="Close"
            :capability="TICKET_CAPABILITIES.Center.Reject"
            @click="handleRejectConfirm"
          >
            驳回
          </AuthButton>
          <AuthButton :icon="Switch" :capability="TICKET_CAPABILITIES.Center.Transfer" @click="openTransfer">
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
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import formCreate, { Api, FormRule } from "@form-create/element-ui"
import { ref, watch } from "vue"
import {
  getOrderByProcessInstIdApi,
  passOrderApi,
  rejectOrderApi,
  revokeOrderApi,
  transferOrderApi
} from "@/api/ticket/order/index.js"
import { passOrder } from "@/api/ticket/order/types/order.js"
import { cloneDeep } from "lodash-es"
import { FormInstance, ElMessageBox, ElMessage } from "element-plus"
import { Document, Setting, EditPen, RefreshLeft, Check, Close, Switch } from "@element-plus/icons-vue"
import DynamicForm from "./components/DynamicForm.vue"
import { getTaskFormConfigApi } from "@/api/ticket/order/index"
import { removeFetchFromRules } from "@/common/utils/form-create"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
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
  templateId: number | undefined
  processInstId: number | undefined
  taskId: number | undefined
  action: string
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "refresh-data"])
const { hasPermission } = usePermission()

//获取 formCreate 组件
const FormCreate = formCreate.$form()
const fApi = ref<Api>()
const data = ref<TicketFormData>({})
const rule = ref<FormRule[]>()
const options = ref<FormCreateOptions>()

const DEFAULT_FORM_DATA: passOrder = {
  task_id: 0,
  comment: ""
}
const formData = ref<passOrder>(cloneDeep(DEFAULT_FORM_DATA))
const taskFormSchema = ref<DynamicFormField[]>([])
const taskFormData = ref<DynamicFormData>({})
const formRef = ref<FormInstance | null>(null)
const dynamicFormRef = ref<DynamicFormExpose | null>(null)

// 转签
const transferVisible = ref(false)
const transferLoading = ref(false)
const usernameToDisplayName = ref<Record<string, string>>({})

const handleUpdateUserNames = (map: Record<string, string>) => {
  usernameToDisplayName.value = { ...usernameToDisplayName.value, ...map }
}

const canOperate = (capability: string) => {
  if (hasPermission(capability)) return true

  ElMessage.warning("暂无操作权限")
  return false
}

const openTransfer = () => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Transfer)) return
  transferVisible.value = true
}

const handleTransferConfirm = async (assignees: TransferAssignee[]) => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Transfer)) return

  const usernames = assignees.filter((a) => a.rule === "appoint").flatMap((a) => a.values)

  if (usernames.length === 0) {
    ElMessage.warning("请选择转签用户")
    return
  }

  transferLoading.value = true
  try {
    await transferOrderApi({ task_id: props.taskId!, usernames })
    ElMessage.success("转签成功")
    resetForm()
  } catch (error) {
    ElMessage.error("转签失败，请重试")
  } finally {
    transferLoading.value = false
  }
}

// 用于缓存每个工单的操作信息（草稿），key 为 processInstId
const formDrafts = ref(new Map<number, TicketFormDraft>())

const saveDraft = (processInstId?: number) => {
  if (!processInstId) return

  formDrafts.value.set(processInstId, {
    formData: cloneDeep(formData.value),
    taskFormData: cloneDeep(taskFormData.value)
  })
}

const restoreDraft = (processInstId?: number) => {
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

const handleGetOrderData = async (processInstId: number) => {
  try {
    const { data: orderInfo } = await getOrderByProcessInstIdApi(processInstId)
    data.value = orderInfo.data as TicketFormData

    const taskId = props.taskId || orderInfo.task_id
    if (taskId && orderInfo.workflow_id) {
      await handleGetTaskFormConfig(taskId, orderInfo.workflow_id)
    } else {
      taskFormSchema.value = []
    }

    if (!props.templateId && orderInfo.template_id) {
      await handleDetail(orderInfo.template_id)
    }
  } catch (error) {
    data.value = {}
    taskFormSchema.value = []
    ElMessage.error("获取工单详情失败")
  }
}

// 获取任务表单配置
const handleGetTaskFormConfig = async (taskId: number, workflowId: number) => {
  try {
    const { data } = await getTaskFormConfigApi({
      task_id: taskId,
      workflow_id: workflowId
    })

    taskFormSchema.value = Array.isArray(data) ? (data as DynamicFormField[]) : []
  } catch (error) {
    taskFormSchema.value = []
    ElMessage.error("获取节点表单配置失败")
  }
}

// 同意确认弹窗
const handlePassConfirm = async () => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Pass)) return
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
        handlePassOrder()
      })
      .catch(() => {})
  } catch (error) {
    // 表单校验失败时保持当前输入状态
  }
}

const handlePass = () => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Pass)) return

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

        handleSubmitChangedOrder(submitData)
      })
      .catch(() => {})
  })
}

const handleSubmitChangedOrder = async (submitData: passOrder) => {
  try {
    await passOrderApi(submitData)
    ElMessage.success("工单已提交")
    resetForm()
  } catch (error) {
    ElMessage.error("操作失败")
  }
}

const handlePassOrder = async () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  const submitData = {
    ...formData.value,
    extra_data: taskFormData.value
  }
  try {
    await passOrderApi(submitData)
    ElMessage.success("工单已同意")
    resetForm()
  } catch (error) {
    ElMessage.error("操作失败，请重试")
  }
}

// 驳回确认弹窗
const handleRejectConfirm = async () => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Reject)) return

  try {
    await ElMessageBox.confirm("确定要驳回此工单吗？此操作不可撤销。", "确认驳回", {
      confirmButtonText: "确定驳回",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
      cancelButtonClass: "el-button--default"
    })
    handleReject()
  } catch (error) {
    // 用户取消操作
  }
}

const handleReject = async () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 驳回审批
  const submitData = { ...formData.value, ...taskFormData.value }
  try {
    await rejectOrderApi(submitData)
    ElMessage.success("工单已驳回")
    resetForm()
  } catch (error) {
    ElMessage.error("操作失败，请重试")
  }
}

const handleRevoke = async () => {
  if (!canOperate(TICKET_CAPABILITIES.Center.Revoke)) return

  if (!props.processInstId) {
    return
  }

  try {
    await revokeOrderApi({
      instance_id: props.processInstId,
      force: true
    })
    ElMessage.success("工单已撤回")
    resetForm()
  } catch (error) {
    ElMessage.error("撤回失败，请重试")
  }
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

const syncOrderContext = async () => {
  if (props.templateId && props.processInstId) {
    await handleDetail(props.templateId)
  }

  if (props.processInstId) {
    await handleGetOrderData(props.processInstId)
  }
}

watch([() => props.templateId, () => props.processInstId], syncOrderContext, { immediate: true })

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
