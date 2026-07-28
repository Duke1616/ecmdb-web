<template>
  <TicketTable
    :data="ticketsData"
    :columns="myTicketColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="getMyTicketOperateItems"
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

  <RevokeTicketDialog
    v-model="revokeVisible"
    :instance-id="revokeTicket?.process_instance_id"
    :subject="revokeSubject"
    @submitted="listStartedTickets"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from "vue"
import { listStartedTicketsApi } from "@/api/ticket/manager"
import Detail from "../approved/detail.vue"
import TicketTable from "../components/TicketTable.vue"
import RevokeTicketDialog from "../components/RevokeTicketDialog.vue"
import type { Ticket } from "@/api/ticket/manager/types/manager"
import { myTicketColumns } from "../composables/useTicketColumns"
import { getMyTicketOperateItems, useTicketActions } from "../composables/useTicketActions"
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
const revokeVisible = ref(false)
const revokeTicket = ref<Ticket>()
const revokeSubject = computed(() => {
  if (!revokeTicket.value) return ""
  return `${templateToolsStore.getTemplateName(revokeTicket.value.template_id) || "未命名工单"} · #${revokeTicket.value.id}`
})

const openRevoke = (ticket: Ticket) => {
  revokeTicket.value = ticket
  revokeVisible.value = true
}

const { operateEvent } = useTicketActions({
  refresh: listStartedTickets,
  openDetail,
  openRevoke
})

defineExpose({
  listStartedTickets
})
</script>
