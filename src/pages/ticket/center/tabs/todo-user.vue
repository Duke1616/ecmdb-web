<template>
  <TicketOrderTable
    :data="ordersData"
    :columns="userTodoOrderColumns"
    :pagination-data="paginationData"
    :loading="loading"
    :get-operate-items="() => userTodoOperateItems"
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
import { todoOrderByUserApi } from "@/api/ticket/order"
import Detail from "../approved/detail.vue"
import TicketOrderTable from "../components/TicketOrderTable.vue"
import { userTodoOrderColumns } from "../composables/useTicketOrderColumns"
import { userTodoOperateItems, useTicketOrderActions } from "../composables/useTicketOrderActions"
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
    todoOrderByUserApi({
      offset,
      limit,
      sort_by_asc: true,
      process_name: "",
      user_id: ""
    })
})

const { dialogVisible, action, orderInfo, openDetail, closeDetail } = useTicketOrderDetail("todo")

const { operateEvent } = useTicketOrderActions({
  refresh: listOrdersData,
  getTemplateName: templateToolsStore.getTemplateName,
  openDetail
})

defineExpose({
  listOrdersData
})
</script>
