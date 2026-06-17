import type { order } from "@/api/ticket/order/types/order"
import type { ButtonType } from "element-plus"

export enum TicketOrderAction {
  Detail = "detail",
  Urge = "urge",
  Revoke = "revoke",
  Approve = "approve",
  Refresh = "refresh",
  View = "view"
}

export interface TicketOperateItem {
  name: string
  code: TicketOrderAction
  type?: ButtonType
  icon?: unknown
  disabled?: boolean
  capability?: string | string[]
}

export type TicketOrderFetcher = (params: { offset: number; limit: number }) => Promise<{
  data: {
    tasks?: order[]
    total?: number
  }
}>
