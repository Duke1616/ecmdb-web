<template>
  <DataTable
    :data="ordersData"
    :columns="tableColumns"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    :loading="loading"
    :table-props="{
      stripe: false,
      border: true,
      'header-cell-style': { background: '#F6F6F6', height: '10px', 'text-align': 'center' }
    }"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  >
    <template #templateName="{ row }">
      {{ templateToolsStore.getTemplateName(row.template_id) }}
    </template>

    <template #provide="{ row }">
      <el-tag v-if="row.provide === 1" effect="plain" type="primary" disable-transitions>本系统</el-tag>
      <el-tag v-else-if="row.provide === 2" effect="plain" type="warning" disable-transitions>企业微信</el-tag>
      <el-tag v-else-if="row.provide === 3" effect="plain" type="warning" disable-transitions>告警平台</el-tag>
      <el-tag v-else type="info" effect="plain">未知类型</el-tag>
    </template>

    <template #actions="{ row }">
      <OperateBtn :items="getOperateBtnItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
    </template>
  </DataTable>

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :orderInfo="orderInfo"
    @refresh-data="listOrdersData"
    @close="onClosed"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { order } from "@/api/order/types/order"
import { todoOrderApi } from "@/api/order"
import Detail from "../approved/detail.vue"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { Check, Refresh } from "@element-plus/icons-vue"
const templateToolsStore = useTemplateToolsStore()

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const action = ref<string>("todo")
const orderInfo = ref<order>()
const loading = ref<boolean>(false)

// 表格列配置
const tableColumns = [
  { prop: "id", label: "工单号", align: "center" as const },
  { prop: "task_id", label: "流程任务号", align: "center" as const },
  { prop: "template_name", label: "工单名称", slot: "templateName", align: "center" as const },
  { prop: "provide", label: "来源", slot: "provide", align: "center" as const },
  { prop: "starter", label: "提单人", align: "center" as const },
  { prop: "current_step", label: "当前步骤", align: "center" as const },
  { prop: "approved_by", label: "当前处理人", align: "center" as const },
  { prop: "proc_inst_create_time", label: "流程提交时间", align: "center" as const }
]

// 操作按钮配置
const getOperateBtnItems = (row: order) => {
  const items = [{ name: "处理", code: "approve", type: "success", icon: Check }]

  if (row.current_step?.startsWith("自动化-") && row.approved_by?.includes("automation")) {
    items.push({ name: "刷新", code: "refresh", type: "primary", icon: Refresh })
  }

  return items
}

/** 查询工单列表 */
const ordersData = ref<order[]>([])
const listOrdersData = async () => {
  loading.value = true
  try {
    const { data } = await todoOrderApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      sort_by_asc: true,
      process_name: "",
      user_id: ""
    })

    paginationData.total = data.total
    ordersData.value = data.orders

    // 根据模版ID获取模版名称
    const templateIds = ordersData.value.map((item) => item.template_id)
    if (templateIds.length > 0) {
      templateToolsStore.setByTemplateIds(templateIds)
    }
  } catch (error) {
    ordersData.value = []
  } finally {
    loading.value = false
  }
}

// 操作事件处理
const operateEvent = (data: order, action: string) => {
  switch (action) {
    case "approve":
      handleApproval(data)
      break
    case "refresh":
      refreshHandler()
      break
  }
}

const refreshHandler = () => {
  listOrdersData()
}

const handleApproval = (row: order) => {
  dialogVisible.value = true
  orderInfo.value = row
}

const onClosed = () => {
  dialogVisible.value = false
  orderInfo.value = undefined
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listOrdersData, { immediate: true })

defineExpose({
  listOrdersData
})
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}

/* 使用全局样式强制覆盖 DataTable 的圆角 */
:global(.manager-content .content-card) {
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
}
</style>
