import { h, markRaw, ref } from "vue"
import { CopyDocument, Delete, EditPen, Open, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteWorkflowApi, deployWorkflowApi, getWorkflowDetailApi } from "@/api/ticket/workflow/workflow"
import type { Workflow, WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { refreshGraphId } from "@/common/utils/logicflow"
import { WorkflowAction } from "../types"
import type { WorkflowFormData, WorkflowOperateItem } from "../types"

const confirmAction = (title: string, actionText: string, name: string) =>
  ElMessageBox({
    title,
    message: h("p", null, [
      h("span", null, `正在${actionText}名称: `),
      h("i", { style: "color: red" }, name),
      h("span", null, ` 确认${actionText}？`)
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

export const workflowOperateItems: WorkflowOperateItem[] = [
  {
    name: "部署",
    code: WorkflowAction.Deploy,
    icon: markRaw(Open),
    capability: TICKET_CAPABILITIES.Workflow.Deploy
  },
  {
    name: "编辑",
    code: WorkflowAction.Edit,
    icon: markRaw(EditPen),
    capability: TICKET_CAPABILITIES.Workflow.Edit
  },
  {
    name: "克隆",
    code: WorkflowAction.Clone,
    icon: markRaw(CopyDocument),
    type: "success",
    capability: TICKET_CAPABILITIES.Workflow.Add
  },
  {
    name: "预览",
    code: WorkflowAction.Preview,
    icon: markRaw(View),
    capability: TICKET_CAPABILITIES.Workflow.Detail
  },
  {
    name: "删除",
    code: WorkflowAction.Delete,
    icon: markRaw(Delete),
    type: "danger",
    capability: TICKET_CAPABILITIES.Workflow.Delete
  }
]

export const useWorkflowActions = (options: {
  refresh: () => void
  showWizard: (data?: Partial<WorkflowFormData>) => void
}) => {
  const { hasPermission } = usePermission()
  const previewVisible = ref(false)
  const previewData = ref<WorkflowGraphData>()

  const guardPermission = (capability: string, message: string) => {
    if (hasPermission(capability)) return true

    ElMessage.warning(message)
    return false
  }

  const handleEdit = async (row: Workflow) => {
    if (!guardPermission(TICKET_CAPABILITIES.Workflow.Edit, "暂无修改流程权限")) return

    try {
      const { data } = await getWorkflowDetailApi(row.id)
      options.showWizard(data)
    } catch (error) {
      ElMessage.error("获取流程详情失败")
    }
  }

  const handleClone = async (row: Workflow) => {
    if (!guardPermission(TICKET_CAPABILITIES.Workflow.Add, "暂无新增流程权限")) return

    try {
      const { data } = await getWorkflowDetailApi(row.id)
      options.showWizard({
        ...data,
        id: undefined,
        name: `${row.name}_copy`,
        flow_data: data.flow_data ? refreshGraphId(data.flow_data) : data.flow_data
      })
    } catch (error) {
      ElMessage.error("获取流程详情失败")
    }
  }

  const handlePreview = async (row: Workflow) => {
    if (!guardPermission(TICKET_CAPABILITIES.Workflow.Detail, "暂无流程详情权限")) return

    try {
      const { data } = await getWorkflowDetailApi(row.id)
      previewData.value = data.flow_data
      previewVisible.value = true
    } catch (error) {
      ElMessage.error("获取流程预览失败")
    }
  }

  const handleDelete = async (row: Workflow) => {
    if (!guardPermission(TICKET_CAPABILITIES.Workflow.Delete, "暂无删除流程权限")) return

    try {
      await confirmAction("删除确认", "删除", row.name)
      await deleteWorkflowApi(row.id)
      ElMessage.success("删除成功")
      options.refresh()
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error("删除失败")
      }
    }
  }

  const handleDeploy = async (row: Workflow) => {
    if (!guardPermission(TICKET_CAPABILITIES.Workflow.Deploy, "暂无发布流程权限")) return

    try {
      await confirmAction("部署确认", "部署", row.name)
      await deployWorkflowApi(row.id)
      ElMessage.success("部署成功")
      options.refresh()
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error("部署失败")
      }
    }
  }

  const operateEvent = (data: Workflow, action: string) => {
    switch (action) {
      case WorkflowAction.Preview:
        handlePreview(data)
        break
      case WorkflowAction.Deploy:
        handleDeploy(data)
        break
      case WorkflowAction.Edit:
        handleEdit(data)
        break
      case WorkflowAction.Delete:
        handleDelete(data)
        break
      case WorkflowAction.Clone:
        handleClone(data)
        break
    }
  }

  const closePreview = () => {
    previewVisible.value = false
  }

  return {
    previewVisible,
    previewData,
    operateEvent,
    closePreview
  }
}
