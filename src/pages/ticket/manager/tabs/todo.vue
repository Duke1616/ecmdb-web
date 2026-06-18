<template>
  <TicketTable
    :data="ticketsData"
    :columns="allTodoTicketColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="getAllTodoOperateItems"
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
import { listTodoTicketsApi } from "@/api/ticket/manager"
import Detail from "../approved/detail.vue"
import TicketTable from "../components/TicketTable.vue"
import { allTodoTicketColumns } from "../composables/useTicketColumns"
import { getAllTodoOperateItems, useTicketActions } from "../composables/useTicketActions"
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
    listTodoTicketsApi({
      offset,
      limit,
      sort_by_asc: true,
      process_name: "",
      user_id: ""
    })
})

const { dialogVisible, action, ticketInfo, openDetail, closeDetail } = useTicketDetail("todo")

const { operateEvent } = useTicketActions({
  refresh: listTicketsData,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  listTicketsData
})
</script>
