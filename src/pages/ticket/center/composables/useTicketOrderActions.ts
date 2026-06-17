import { h, markRaw } from "vue"
import { Bell, Check, Refresh, RefreshLeft, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { revokeOrderApi } from "@/api/ticket/order"
import type { order } from "@/api/ticket/order/types/order"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TicketOrderAction } from "./types"
import type { TicketOperateItem } from "./types"

const viewIcon = markRaw(View)
const bellIcon = markRaw(Bell)
const revokeIcon = markRaw(RefreshLeft)
const checkIcon = markRaw(Check)
const refreshIcon = markRaw(Refresh)

export const myOrderOperateItems: TicketOperateItem[] = [
  {
    name: "详情",
    code: TicketOrderAction.Detail,
    type: "primary",
    icon: viewIcon,
    capability: TICKET_CAPABILITIES.Center.Detail
  },
  {
    name: "催办",
    code: TicketOrderAction.Urge,
    type: "warning",
    icon: bellIcon,
    capability: TICKET_CAPABILITIES.Center.MyStart
  },
  {
    name: "撤回",
    code: TicketOrderAction.Revoke,
    type: "danger",
    icon: revokeIcon,
    capability: TICKET_CAPABILITIES.Center.Revoke
  }
]

export const userTodoOperateItems: TicketOperateItem[] = [
  {
    name: "处理",
    code: TicketOrderAction.Approve,
    type: "success",
    icon: checkIcon,
    capability: TICKET_CAPABILITIES.Center.Pass
  }
]

export const getAllTodoOperateItems = (row: order): TicketOperateItem[] => {
  const items: TicketOperateItem[] = [
    {
      name: "处理",
      code: TicketOrderAction.Approve,
      type: "success",
      icon: checkIcon,
      capability: TICKET_CAPABILITIES.Center.Pass
    }
  ]

  if (row.current_step?.startsWith("自动化-") && row.approved_by?.includes("automation")) {
    items.push({
      name: "刷新",
      code: TicketOrderAction.Refresh,
      type: "primary",
      icon: refreshIcon,
      capability: TICKET_CAPABILITIES.Center.Todo
    })
  }

  return items
}

export const getHistoryOperateItems = (row: order): TicketOperateItem[] => {
  if (row.current_step?.startsWith("自动化-")) return []

  return [
    {
      name: "查看",
      code: TicketOrderAction.View,
      type: "success",
      icon: viewIcon,
      capability: TICKET_CAPABILITIES.Center.Detail
    }
  ]
}

export const useTicketOrderActions = (options: {
  refresh: () => void
  getTemplateName: (templateId: number) => string | undefined
  openDetail: (row: order, action?: string) => void
}) => {
  const handleUrging = () => {
    ElMessage.error("暂不支持功能")
  }

  const handleRevoke = (row: order) => {
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
      await revokeOrderApi({
        instance_id: row.process_instance_id,
        force: true
      })
      options.refresh()
    })
  }

  const operateEvent = (data: order, action: TicketOrderAction) => {
    switch (action) {
      case TicketOrderAction.Detail:
        options.openDetail(data, `my-${data.current_step}`)
        break
      case TicketOrderAction.Urge:
        handleUrging()
        break
      case TicketOrderAction.Revoke:
        handleRevoke(data)
        break
      case TicketOrderAction.Approve:
        options.openDetail(data, "todo")
        break
      case TicketOrderAction.Refresh:
        options.refresh()
        break
      case TicketOrderAction.View:
        options.openDetail(data, "history")
        break
    }
  }

  return {
    operateEvent,
    handleRevoke
  }
}
