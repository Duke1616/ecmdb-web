import { h, markRaw } from "vue"
import { Bell, Check, Refresh, RefreshLeft, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { revokeTicketApi } from "@/api/ticket/manager"
import type { Ticket } from "@/api/ticket/manager/types/manager"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TicketAction } from "./types"
import type { TicketOperateItem } from "./types"

const viewIcon = markRaw(View)
const bellIcon = markRaw(Bell)
const revokeIcon = markRaw(RefreshLeft)
const checkIcon = markRaw(Check)
const refreshIcon = markRaw(Refresh)

export const myTicketOperateItems: TicketOperateItem[] = [
  {
    name: "详情",
    code: TicketAction.Detail,
    type: "primary",
    icon: viewIcon,
    capability: TICKET_CAPABILITIES.Manager.Detail
  },
  {
    name: "催办",
    code: TicketAction.Urge,
    type: "warning",
    icon: bellIcon,
    capability: TICKET_CAPABILITIES.Manager.MyStart
  },
  {
    name: "撤回",
    code: TicketAction.Revoke,
    type: "danger",
    icon: revokeIcon,
    capability: TICKET_CAPABILITIES.Manager.Revoke
  }
]

export const userTodoOperateItems: TicketOperateItem[] = [
  {
    name: "处理",
    code: TicketAction.Approve,
    type: "success",
    icon: checkIcon,
    capability: TICKET_CAPABILITIES.Manager.Pass
  }
]

export const getAllTodoOperateItems = (row: Ticket): TicketOperateItem[] => {
  const items: TicketOperateItem[] = [
    {
      name: "处理",
      code: TicketAction.Approve,
      type: "success",
      icon: checkIcon,
      capability: TICKET_CAPABILITIES.Manager.Pass
    }
  ]

  if (row.current_step?.startsWith("自动化-") && row.approved_by?.includes("automation")) {
    items.push({
      name: "刷新",
      code: TicketAction.Refresh,
      type: "primary",
      icon: refreshIcon,
      capability: TICKET_CAPABILITIES.Manager.Todo
    })
  }

  return items
}

export const getHistoryOperateItems = (row: Ticket): TicketOperateItem[] => {
  if (row.current_step?.startsWith("自动化-")) return []

  return [
    {
      name: "查看",
      code: TicketAction.View,
      type: "success",
      icon: viewIcon,
      capability: TICKET_CAPABILITIES.Manager.Detail
    }
  ]
}

export const useTicketActions = (options: {
  refresh: () => void
  getTemplateName: (templateId: number) => string | undefined
  openDetail: (row: Ticket, action?: string) => void
}) => {
  const handleUrging = () => {
    ElMessage.error("暂不支持功能")
  }

  const handleRevoke = (row: Ticket) => {
    ElMessageBox({
      title: "撤销工单",
      message: h("p", null, [
        h("span", null, "正在撤销工单: "),
        h("i", { style: "color: red" }, `${row.approved_by}的${options.getTemplateName(row.template_id) || "-"}`),
        h("span", null, " 确认？")
      ]),
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(async () => {
      await revokeTicketApi({
        instance_id: row.process_instance_id,
        force: true
      })
      options.refresh()
    })
  }

  const operateEvent = (data: Ticket, action: TicketAction) => {
    switch (action) {
      case TicketAction.Detail:
        options.openDetail(data, `my-${data.current_step}`)
        break
      case TicketAction.Urge:
        handleUrging()
        break
      case TicketAction.Revoke:
        handleRevoke(data)
        break
      case TicketAction.Approve:
        options.openDetail(data, "todo")
        break
      case TicketAction.Refresh:
        options.refresh()
        break
      case TicketAction.View:
        options.openDetail(data, "history")
        break
    }
  }

  return {
    operateEvent,
    handleRevoke
  }
}
