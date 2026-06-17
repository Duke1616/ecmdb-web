<template>
  <TicketOrderTable
    :data="ordersData"
    :columns="myOrderColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="() => myOrderOperateItems"
    span-method
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    @operate="operateEvent"
  />

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :orderInfo="orderInfo"
    @refresh-data="startByOrdersData"
    @close="closeDetail"
  />
</template>

<script lang="ts" setup>
import { startByOrderApi } from "@/api/ticket/order"
import Detail from "../approved/detail.vue"
import TicketOrderTable from "../components/TicketOrderTable.vue"
import { myOrderColumns } from "../composables/useTicketOrderColumns"
import { myOrderOperateItems, useTicketOrderActions } from "../composables/useTicketOrderActions"
import { useTicketOrderDetail } from "../composables/useTicketOrderDetail"
import { useTicketOrderList } from "../composables/useTicketOrderList"

const {
  templateToolsStore,
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  ordersData,
  loading,
  loadOrdersData: startByOrdersData
} = useTicketOrderList({
  fetcher: ({ offset, limit }) =>
    startByOrderApi({
      offset,
      limit,
      process_name: ""
    }),
  mergeFields: ["id", "template_name", "withdraw", "current_step", "proc_inst_create_time", "active"]
})

const { dialogVisible, action, orderInfo, openDetail, closeDetail } = useTicketOrderDetail("my")

const { operateEvent } = useTicketOrderActions({
  refresh: startByOrdersData,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  startByOrdersData
})
</script>
