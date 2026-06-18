import { ref } from "vue"
import type { Ticket } from "@/api/ticket/manager/types/manager"

export const useTicketDetail = (defaultAction: string) => {
  const dialogVisible = ref(false)
  const action = ref(defaultAction)
  const ticketInfo = ref<Ticket>()

  const openDetail = (row: Ticket, nextAction = defaultAction) => {
    dialogVisible.value = true
    ticketInfo.value = row
    action.value = nextAction
  }

  const closeDetail = () => {
    dialogVisible.value = false
    ticketInfo.value = undefined
    action.value = defaultAction
  }

  return {
    dialogVisible,
    action,
    ticketInfo,
    openDetail,
    closeDetail
  }
}
