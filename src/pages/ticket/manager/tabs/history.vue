<template>
  <TicketTable
    :data="ticketsData"
    :columns="historyTicketColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="getHistoryOperateItems"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    @operate="operateEvent"
  />

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :ticketInfo="ticketInfo"
    @refresh-data="listTicketsData"
    @close="closeDetail"
  />

  <TicketRatingDialog v-model="ratingVisible" :ticket="ratingTicket" @submitted="handleRatingSubmitted" />
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { listHistoryTicketsApi } from "@/api/ticket/manager"
import type { Ticket } from "@/api/ticket/manager/types/manager"
import Detail from "../approved/detail.vue"
import TicketTable from "../components/TicketTable.vue"
import TicketRatingDialog from "../components/TicketRatingDialog.vue"
import { historyTicketColumns } from "../composables/useTicketColumns"
import { getHistoryOperateItems, useTicketActions } from "../composables/useTicketActions"
import { useTicketDetail } from "../composables/useTicketDetail"
import { useTicketList } from "../composables/useTicketList"

const {
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  ticketsData,
  loading,
  loadTicketsData: listTicketsData
} = useTicketList({
  fetcher: ({ offset, limit }) =>
    listHistoryTicketsApi({
      offset,
      limit,
      user_id: ""
    })
})

const { dialogVisible, action, ticketInfo, openDetail, closeDetail } = useTicketDetail("history")

const ratingVisible = ref(false)
const ratingTicket = ref<Ticket>()

const openRating = (ticket: Ticket) => {
  ratingTicket.value = ticket
  ratingVisible.value = true
}

const handleRatingSubmitted = async () => {
  await listTicketsData()
  ratingTicket.value = undefined
}

const { operateEvent } = useTicketActions({
  refresh: listTicketsData,
  openDetail,
  openRating
})

defineExpose({
  listTicketsData
})
</script>
