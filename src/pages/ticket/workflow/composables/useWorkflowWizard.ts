import { computed, nextTick, ref } from "vue"
import { v4 as uuidv4 } from "uuid"
import { ElMessage } from "element-plus"
import { createWorkflowApi, updateWorkflowApi } from "@/api/ticket/workflow/workflow"
import { getFormRulesByStep } from "@/common/constants/form-rules"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { createDefaultWorkflowFormData } from "../types"
import type { WorkflowFormData, WorkflowWizardExpose } from "../types"

export const useWorkflowWizard = (options: { refresh: () => void }) => {
  const { hasPermission } = usePermission()
  const workflowWizardRef = ref<WorkflowWizardExpose>()
  const workflowFormData = ref<WorkflowFormData>(createDefaultWorkflowFormData(uuidv4))
  const isListVisible = ref(true)
  const isWizardVisible = ref(false)

  const workflowFormRules = computed(() => {
    return getFormRulesByStep("WORKFLOW_INFO", workflowWizardRef.value?.currentStep.value || 0)
  })

  const showWizard = (data?: Partial<WorkflowFormData>) => {
    isListVisible.value = false
    isWizardVisible.value = true

    nextTick(() => {
      workflowWizardRef.value?.setStep(0)
      workflowFormData.value = data
        ? { ...createDefaultWorkflowFormData(uuidv4), ...data }
        : createDefaultWorkflowFormData(uuidv4)
    })
  }

  const openCreate = () => {
    if (!hasPermission(TICKET_CAPABILITIES.Workflow.Add)) {
      ElMessage.warning("暂无新增流程权限")
      return
    }

    showWizard()
  }

  const closeWizard = () => {
    isWizardVisible.value = false
    isListVisible.value = true
  }

  const updateWorkflowFormData = (data: WorkflowFormData) => {
    workflowFormData.value = { ...workflowFormData.value, ...data }
  }

  const saveWorkflow = async () => {
    const capability = workflowFormData.value.id ? TICKET_CAPABILITIES.Workflow.Edit : TICKET_CAPABILITIES.Workflow.Add
    if (!hasPermission(capability)) {
      ElMessage.warning(workflowFormData.value.id ? "暂无修改流程权限" : "暂无新增流程权限")
      return
    }

    try {
      if (workflowFormData.value.id) {
        await updateWorkflowApi(workflowFormData.value)
        ElMessage.success("流程更新成功")
      } else {
        await createWorkflowApi(workflowFormData.value)
        ElMessage.success("流程创建成功")
      }

      closeWizard()
      options.refresh()
    } catch {}
  }

  return {
    workflowWizardRef,
    workflowFormData,
    workflowFormRules,
    isListVisible,
    isWizardVisible,
    showWizard,
    openCreate,
    closeWizard,
    updateWorkflowFormData,
    saveWorkflow
  }
}
