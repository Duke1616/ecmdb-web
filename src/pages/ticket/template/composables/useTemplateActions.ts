import { h, nextTick, ref } from "vue"
import { useRouter } from "vue-router"
import { Connection, CopyDocument, Delete, EditPen, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteTemplateApi, deleteTemplateGroupApi } from "@/api/ticket/template"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { createOrUpdateTemplateReq, template, templateGroupSummary } from "@/api/ticket/template/types/template"
import { TicketTemplateAction } from "../types"
import type { TemplateGroupFormExpose, TemplateThirdPartyFormExpose, TicketTemplateOperateItem } from "../types"

const isTemplateAction = (value: string): value is TicketTemplateAction => {
  return Object.values(TicketTemplateAction).includes(value as TicketTemplateAction)
}

export function useTemplateActions(options: {
  refresh: () => void
  handleUpdateTemplate: (row: template) => void
  handleCloneTemplate: (row: template) => void
}) {
  const router = useRouter()
  const { hasPermission } = usePermission()

  const groupDialogVisible = ref(false)
  const groupDialogTitle = ref("新增模板分组")
  const thirdpartyDialogVisible = ref(false)
  const groupFormRef = ref<TemplateGroupFormExpose>()
  const thirdPartyFormRef = ref<TemplateThirdPartyFormExpose>()

  const getOperateBtnItems = (row: template): TicketTemplateOperateItem[] => {
    const items: TicketTemplateOperateItem[] = []

    if (row.create_type === 1) {
      items.push({
        name: "修改",
        code: TicketTemplateAction.Edit,
        type: "primary",
        icon: EditPen,
        capability: TICKET_CAPABILITIES.Template.Edit
      })
    } else if (row.create_type === 2) {
      items.push({
        name: "流程",
        code: TicketTemplateAction.Sync,
        type: "warning",
        icon: Connection,
        capability: TICKET_CAPABILITIES.Template.Edit
      })
    }

    items.push(
      {
        name: "派发",
        code: TicketTemplateAction.Dispatch,
        icon: Search,
        capability: TICKET_CAPABILITIES.Dispatch.View
      },
      {
        name: "克隆",
        code: TicketTemplateAction.Clone,
        type: "success",
        icon: CopyDocument,
        capability: TICKET_CAPABILITIES.Template.Add
      },
      {
        name: "删除",
        code: TicketTemplateAction.Delete,
        type: "danger",
        icon: Delete,
        capability: TICKET_CAPABILITIES.Template.Delete
      }
    )

    return items
  }

  const openGroupDialog = () => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.AddGroup)) {
      ElMessage.warning("暂无新增模板分组权限")
      return
    }
    groupDialogTitle.value = "新增模板分组"
    groupDialogVisible.value = true
  }

  const openEditGroupDialog = (group: templateGroupSummary) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.EditGroup)) {
      ElMessage.warning("暂无修改模板分组权限")
      return
    }

    groupDialogTitle.value = "编辑模板分组"
    groupDialogVisible.value = true
    nextTick(() => {
      groupFormRef.value?.setForm(group)
    })
  }

  const onClosedTemplateGroup = () => {
    groupFormRef.value?.resetForm()
    groupDialogVisible.value = false
    groupDialogTitle.value = "新增模板分组"
  }

  const handleGroupSuccess = () => {
    options.refresh()
  }

  const handleCreateTemplateGroup = () => {
    groupFormRef.value?.handleCreate()
  }

  const handleDeleteTemplateGroup = async (group: templateGroupSummary) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.DeleteGroup)) {
      ElMessage.warning("暂无删除模板分组权限")
      return
    }

    try {
      await ElMessageBox({
        title: "删除确认",
        message: h("p", null, [
          h("span", null, "正在删除模板分组: "),
          h("i", { style: "color: red" }, `${group.name}`),
          h("span", null, " 确认删除？")
        ]),
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
      await deleteTemplateGroupApi(group.id)
      ElMessage.success("删除成功")
      options.refresh()
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error("删除失败，请确认分组下是否仍存在模板")
      }
    }
  }

  const onClosedThirdParty = () => {
    thirdPartyFormRef.value?.resetForm()
    thirdpartyDialogVisible.value = false
  }

  const handleThirdPartySuccess = () => {
    options.refresh()
  }

  const handleCreateThirdParty = () => {
    thirdPartyFormRef.value?.handleCreate()
  }

  const handleDispatch = (row: template) => {
    if (!hasPermission(TICKET_CAPABILITIES.Dispatch.View)) {
      ElMessage.warning("暂无查看自动派发权限")
      return
    }

    router.push({
      name: "ProcessTemplateDispatch",
      query: {
        id: row.id
      }
    })
  }

  const handleSync = (row: template) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.Edit)) {
      ElMessage.warning("暂无绑定第三方流程权限")
      return
    }

    thirdpartyDialogVisible.value = true
    nextTick(() => {
      thirdPartyFormRef.value?.setForm(row as createOrUpdateTemplateReq)
    })
  }

  const handleDelete = async (row: template) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.Delete)) {
      ElMessage.warning("暂无删除模板权限")
      return
    }

    try {
      await ElMessageBox({
        title: "删除确认",
        message: h("p", null, [
          h("span", null, "正在删除模板: "),
          h("i", { style: "color: red" }, `${row.name}`),
          h("span", null, " 确认删除？")
        ]),
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
      await deleteTemplateApi(row.id)
      ElMessage.success("删除成功")
      options.refresh()
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error("删除失败")
      }
    }
  }

  const operateEvent = (data: template, action: string) => {
    if (!isTemplateAction(action)) return

    switch (action) {
      case TicketTemplateAction.Edit:
        options.handleUpdateTemplate(data)
        break
      case TicketTemplateAction.Sync:
        handleSync(data)
        break
      case TicketTemplateAction.Dispatch:
        handleDispatch(data)
        break
      case TicketTemplateAction.Clone:
        options.handleCloneTemplate(data)
        break
      case TicketTemplateAction.Delete:
        handleDelete(data)
        break
    }
  }

  return {
    groupDialogVisible,
    groupDialogTitle,
    thirdpartyDialogVisible,
    groupFormRef,
    thirdPartyFormRef,
    getOperateBtnItems,
    openGroupDialog,
    openEditGroupDialog,
    onClosedTemplateGroup,
    handleGroupSuccess,
    handleCreateTemplateGroup,
    handleDeleteTemplateGroup,
    onClosedThirdParty,
    handleThirdPartySuccess,
    handleCreateThirdParty,
    operateEvent
  }
}
