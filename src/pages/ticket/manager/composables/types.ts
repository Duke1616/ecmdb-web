import type { Ticket } from "@/api/ticket/manager/types/manager"
import type { ButtonType } from "element-plus"

export enum TicketAction {
  Detail = "detail",
  Urge = "urge",
  Revoke = "revoke",
  Approve = "approve",
  Refresh = "refresh",
  View = "view"
}

export interface TicketOperateItem {
  name: string
  code: TicketAction
  type?: ButtonType
  icon?: unknown
  disabled?: boolean
  capability?: string | string[]
}

export type TicketFetcher = (params: { offset: number; limit: number }) => Promise<{
  data: {
    tasks?: Ticket[]
    total?: number
  }
}>
