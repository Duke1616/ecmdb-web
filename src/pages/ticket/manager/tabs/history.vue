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
</template>

<script lang="ts" setup>
import { listHistoryTicketsApi } from "@/api/ticket/manager"
import Detail from "../approved/detail.vue"
import TicketTable from "../components/TicketTable.vue"
import { historyTicketColumns } from "../composables/useTicketColumns"
import { getHistoryOperateItems, useTicketActions } from "../composables/useTicketActions"
import { useTicketDetail } from "../composables/useTicketDetail"
import { useTicketList } from "../composables/useTicketList"

const {
  templateToolsStore,
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

const { operateEvent } = useTicketActions({
  refresh: listTicketsData,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  listTicketsData
})
</script>
