<template>
  <TicketTable
    :data="ticketsData"
    :columns="myTicketColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="() => myTicketOperateItems"
    span-method
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    @operate="operateEvent"
  />

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :ticketInfo="ticketInfo"
    @refresh-data="listStartedTickets"
    @close="closeDetail"
  />
</template>

<script lang="ts" setup>
import { listStartedTicketsApi } from "@/api/ticket/manager"
import Detail from "../approved/detail.vue"
import TicketTable from "../components/TicketTable.vue"
import { myTicketColumns } from "../composables/useTicketColumns"
import { myTicketOperateItems, useTicketActions } from "../composables/useTicketActions"
import { useTicketDetail } from "../composables/useTicketDetail"
import { useTicketList } from "../composables/useTicketList"

const {
  templateToolsStore,
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  ticketsData,
  loading,
  loadTicketsData: listStartedTickets
} = useTicketList({
  fetcher: ({ offset, limit }) =>
    listStartedTicketsApi({
      offset,
      limit,
      process_name: ""
    }),
  mergeFields: ["id", "template_name", "withdraw", "current_step", "proc_inst_create_time", "active"]
})

const { dialogVisible, action, ticketInfo, openDetail, closeDetail } = useTicketDetail("my")

const { operateEvent } = useTicketActions({
  refresh: listStartedTickets,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  listStartedTickets
})
</script>
