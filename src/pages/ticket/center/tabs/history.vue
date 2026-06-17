<template>
  <TicketOrderTable
    :data="ordersData"
    :columns="historyOrderColumns"
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
    :orderInfo="orderInfo"
    @refresh-data="listOrdersData"
    @close="closeDetail"
  />
</template>

<script lang="ts" setup>
import { getHisotryOrderApi } from "@/api/ticket/order"
import Detail from "../approved/detail.vue"
import TicketOrderTable from "../components/TicketOrderTable.vue"
import { historyOrderColumns } from "../composables/useTicketOrderColumns"
import { getHistoryOperateItems, useTicketOrderActions } from "../composables/useTicketOrderActions"
import { useTicketOrderDetail } from "../composables/useTicketOrderDetail"
import { useTicketOrderList } from "../composables/useTicketOrderList"

const {
  templateToolsStore,
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  ordersData,
  loading,
  loadOrdersData: listOrdersData
} = useTicketOrderList({
  fetcher: ({ offset, limit }) =>
    getHisotryOrderApi({
      offset,
      limit,
      user_id: ""
    })
})

const { dialogVisible, action, orderInfo, openDetail, closeDetail } = useTicketOrderDetail("history")

const { operateEvent } = useTicketOrderActions({
  refresh: listOrdersData,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  listOrdersData
})
</script>
