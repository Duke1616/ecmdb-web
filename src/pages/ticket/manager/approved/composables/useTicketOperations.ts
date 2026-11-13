import { ref, watch, type Ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus"
import type { Api } from "@form-create/element-ui"
import { passTicketApi, transferTicketApi, getTaskFormConfigApi } from "@/api/ticket/manager/index.js"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { TaskID, ProcessInstanceID, PassTicketReq } from "@/api/ticket/manager/types/manager"
import type {
  DynamicFormExpose,
  DynamicFormField,
  DynamicFormData,
  TicketFormData,
  TicketFormDraft,
  TransferAssignee
} from "../types"

interface UseTicketOperationsOptions {
  ticketId: Ref<number>
  taskId: Ref<TaskID | undefined>
  processInstId: Ref<ProcessInstanceID | undefined>
  mainFormData: Ref<TicketFormData>
  fApi: Ref<Api | undefined>
  onSuccess: () => void
}

const DEFAULT_FORM_DATA: PassTicketReq = {
  task_id: "",
  comment: ""
}

const CONFIRM_OPTIONS = {
  confirmButtonText: "确定",
  cancelButtonText: "取消",
  type: "warning"
} as const

/**
 * 工单审批、修改、转签、驳回及撤回操作 Composable
 */
export function useTicketOperations(options: UseTicketOperationsOptions) {
  const { hasPermission } = usePermission()

  // 表单状态
  const formData = ref<PassTicketReq>(cloneDeep(DEFAULT_FORM_DATA))
  const taskFormSchema = ref<DynamicFormField[]>([])
  const taskFormData = ref<DynamicFormData>({})
  const formRef = ref<FormInstance | null>(null)
  const dynamicFormRef = ref<DynamicFormExpose | null>(null)

  // 弹窗状态
  const transferVisible = ref(false)
  const transferLoading = ref(false)
  const revokeVisible = ref(false)
  const rejectVisible = ref(false)
  const usernameToDisplayName = ref<Record<string, string>>({})

  // 工单草稿缓存（按 processInstId 隔离）
  const formDrafts = ref(new Map<ProcessInstanceID, TicketFormDraft>())

  const saveDraft = (instId?: ProcessInstanceID) => {
    if (!instId) return
    formDrafts.value.set(instId, {
      formData: cloneDeep(formData.value),
      taskFormData: cloneDeep(taskFormData.value)
    })
  }

  const restoreDraft = (instId?: ProcessInstanceID) => {
    if (!instId) return
    const draft = formDrafts.value.get(instId)
    formData.value = draft ? cloneDeep(draft.formData) : cloneDeep(DEFAULT_FORM_DATA)
    taskFormData.value = draft ? cloneDeep(draft.taskFormData) : {}
    formRef.value?.clearValidate()
  }

  // 监听工单实例切换以自动保存和恢复草稿
  watch(
    () => options.processInstId.value,
    (newId, oldId) => {
      saveDraft(oldId)
      restoreDraft(newId)
    },
    { immediate: true }
  )

  const handleUpdateUserNames = (map: Record<string, string>) => {
    usernameToDisplayName.value = { ...usernameToDisplayName.value, ...map }
  }

  const canOperate = (capability: string) => {
    if (hasPermission(capability)) return true
    ElMessage.warning("暂无操作权限")
    return false
  }

  // 获取节点动态表单配置
  const handleGetTaskFormConfig = async (taskId: TaskID, workflowId: number) => {
    try {
      const { data } = await getTaskFormConfigApi({
        ticket_id: options.ticketId.value,
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

  // 重置表单状态
  const resetForm = () => {
    const instId = options.processInstId.value
    if (instId) {
      formDrafts.value.delete(instId)
    }

    formRef.value?.clearValidate()
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
    taskFormData.value = {}

    options.onSuccess()
  }

  const submitPassTicket = async (submitData: PassTicketReq, successMessage: string) => {
    try {
      await passTicketApi({ ...submitData, ticket_id: options.ticketId.value })
      ElMessage.success(successMessage)
      resetForm()
    } catch (error) {
      console.error("提交工单失败:", error)
    }
  }

  // 同意操作
  const handlePassConfirm = async () => {
    if (!canOperate(TICKET_CAPABILITIES.Manager.Pass)) return
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      if (dynamicFormRef.value) {
        await dynamicFormRef.value.validate()
      }
      await ElMessageBox.confirm("是否确认同意该工单？", "提示", CONFIRM_OPTIONS)
    } catch {
      // 校验失败或取消：保持当前输入
      return
    }

    if (options.taskId.value) {
      formData.value.task_id = options.taskId.value
    }
    await submitPassTicket({ ...formData.value, extra_data: taskFormData.value }, "工单已同意")
  }

  // 发起人修改后提交
  const handlePass = async () => {
    if (!canOperate(TICKET_CAPABILITIES.Manager.Pass)) return

    try {
      const valid = await options.fApi.value?.validate()
      if (!valid) return
      await ElMessageBox.confirm("确认修改并提交工单？", "提示", CONFIRM_OPTIONS)
      await submitPassTicket(
        {
          task_id: options.taskId.value || formData.value.task_id,
          comment: "修改并提交",
          ...options.mainFormData.value
        },
        "工单已提交"
      )
    } catch {
      // 校验失败或取消：保持当前输入
    }
  }

  // 3. 转签操作
  const openTransfer = () => {
    if (!canOperate(TICKET_CAPABILITIES.Manager.Transfer)) return
    transferVisible.value = true
  }

  const handleTransferConfirm = async (assignees: TransferAssignee[]) => {
    if (transferLoading.value) return
    if (!canOperate(TICKET_CAPABILITIES.Manager.Transfer)) return

    const usernames = assignees.filter((a) => a.rule === "appoint").flatMap((a) => a.values)
    if (usernames.length === 0) {
      ElMessage.warning("请选择转签用户")
      return
    }

    transferLoading.value = true
    try {
      await transferTicketApi({ ticket_id: options.ticketId.value, task_id: options.taskId.value!, usernames })
      ElMessage.success("转签成功")
      resetForm()
    } catch (error) {
      console.error("转签失败:", error)
    } finally {
      transferLoading.value = false
    }
  }

  // 驳回操作
  const handleRejectConfirm = () => {
    if (!canOperate(TICKET_CAPABILITIES.Manager.Reject)) return
    rejectVisible.value = true
  }

  // 撤单操作
  const handleRevoke = () => {
    if (!canOperate(TICKET_CAPABILITIES.Manager.Revoke)) return
    revokeVisible.value = true
  }

  return {
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
  }
}
