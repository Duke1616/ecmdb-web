import { ref } from "vue"
import type { order } from "@/api/ticket/order/types/order"

export const useTicketOrderDetail = (defaultAction: string) => {
  const dialogVisible = ref(false)
  const action = ref(defaultAction)
  const orderInfo = ref<order>()

  const openDetail = (row: order, nextAction = defaultAction) => {
    dialogVisible.value = true
    orderInfo.value = row
    action.value = nextAction
  }

  const closeDetail = () => {
    dialogVisible.value = false
    orderInfo.value = undefined
    action.value = defaultAction
  }

  return {
    dialogVisible,
    action,
    orderInfo,
    openDetail,
    closeDetail
  }
}
