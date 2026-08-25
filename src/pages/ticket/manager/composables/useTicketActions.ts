import { markRaw } from "vue"
import { Bell, Check, Refresh, RefreshLeft, Star, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { TicketStatus, type Ticket } from "@/api/ticket/manager/types/manager"
import { restartProcessApi } from "@/api/ticket/manager"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TicketAction } from "./types"
import type { TicketOperateItem } from "./types"

const viewIcon = markRaw(View)
const bellIcon = markRaw(Bell)
const revokeIcon = markRaw(RefreshLeft)
const checkIcon = markRaw(Check)
const refreshIcon = markRaw(Refresh)
const rateIcon = markRaw(Star)

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
  },
  {
    name: "重新启动",
    code: TicketAction.Restart,
    type: "warning",
    icon: refreshIcon,
    capability: TICKET_CAPABILITIES.Manager.ProcessRestart
  }
]

export const getMyTicketOperateItems = (row: Ticket): TicketOperateItem[] => {
  if (row.status === TicketStatus.StartFailed) {
    return myTicketOperateItems.filter((item) => item.code === TicketAction.Restart)
  }
  return myTicketOperateItems.map((item) =>
    item.code === TicketAction.Revoke
      ? {
          ...item,
          name: row.status === TicketStatus.Withdrawing ? "撤回中" : item.name,
          disabled: row.status === TicketStatus.Withdrawing
        }
      : item
  )
}

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
  if (row.status === TicketStatus.Start) return []

  if (row.status === TicketStatus.StartFailed) {
    return [
      {
        name: "重新启动",
        code: TicketAction.Restart,
        type: "warning",
        icon: refreshIcon,
        capability: TICKET_CAPABILITIES.Manager.ProcessRestart
      }
    ]
  }

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

  const items: TicketOperateItem[] = [
    {
      name: "查看",
      code: TicketAction.View,
      type: "success",
      icon: viewIcon,
      capability: TICKET_CAPABILITIES.Manager.Detail
    }
  ]
  if (row.can_rate || row.rating) {
    items.push({
      name: row.rating ? "查看评价" : "评价",
      code: TicketAction.Rate,
      type: "warning",
      icon: rateIcon,
      capability: TICKET_CAPABILITIES.Manager.History
    })
  }
  return items
}

export const useTicketActions = (options: {
  refresh: () => void
  openDetail: (row: Ticket, action?: string) => void
  openRating?: (row: Ticket) => void
  openRevoke?: (row: Ticket) => void
}) => {
  const handleUrging = () => {
    ElMessage.error("暂不支持功能")
  }

  const handleRevoke = (row: Ticket) => {
    if (row.status === TicketStatus.Withdrawing) {
      ElMessage.info("工单正在撤回处理中")
      return
    }
    options.openRevoke?.(row)
  }

  const handleRestart = async (row: Ticket) => {
    try {
      await ElMessageBox.confirm(`确定重新启动工单 #${row.id} 的流程吗？`, "重新启动流程", {
        type: "warning",
        confirmButtonText: "重新启动",
        cancelButtonText: "取消"
      })
      await restartProcessApi({ ticket_id: row.id })
      ElMessage.success("已提交流程重启请求")
      options.refresh()
    } catch (error: any) {
      if (error === "cancel" || error === "close") return
      ElMessage.error(error?.message || "流程重启失败")
    }
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
      case TicketAction.Rate:
        options.openRating?.(data)
        break
      case TicketAction.Restart:
        void handleRestart(data)
        break
    }
  }

  return {
    operateEvent,
    handleRevoke
  }
}
