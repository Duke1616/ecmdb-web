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
      <el-tag v-else type="info" effect="plain" disable-transitions>未知</el-tag>
    </template>

    <template #status="{ row }">
      <el-tag v-if="row.status === 4" effect="plain" type="danger" disable-transitions>撤单</el-tag>
      <el-tag v-else-if="row.status === 3" effect="plain" type="success" disable-transitions>结单</el-tag>
      <el-tag v-else type="info" effect="plain" disable-transitions>未知</el-tag>
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
import { getHisotryOrderApi } from "@/api/order"
import Detail from "../approved/detail.vue"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { View } from "@element-plus/icons-vue"

const templateToolsStore = useTemplateToolsStore()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const orderInfo = ref<order>()
const action = ref<string>("history")
const loading = ref<boolean>(false)

// 表格列配置
const tableColumns = [
  { prop: "id", label: "工单号", align: "center" as const },
  { prop: "template_name", label: "工单名称", slot: "templateName", align: "center" as const },
  { prop: "provide", label: "来源", slot: "provide", align: "center" as const },
  { prop: "starter", label: "提单人", align: "center" as const },
  { prop: "status", label: "状态", slot: "status", align: "center" as const },
  { prop: "ctime", label: "工单提交时间", align: "center" as const },
  { prop: "wtime", label: "工单结束时间", align: "center" as const }
]

// 操作按钮配置
const getOperateBtnItems = (row: order) => {
  const items = []

  if (!row.current_step?.startsWith("自动化-")) {
    items.push({ name: "查看", code: "view", type: "success", icon: View })
  }

  return items
}

/** 查询工单列表 */
const ordersData = ref<order[]>([])
const listOrdersData = async () => {
  loading.value = true
  try {
    const { data } = await getHisotryOrderApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
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
    case "view":
      handleApproval(data)
      break
  }
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
