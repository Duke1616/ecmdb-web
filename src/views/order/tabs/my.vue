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
      'span-method': objectSpanMethod,
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
      <OperateBtn :items="operateBtnItems" :operate-item="row" :max-length="2" @route-event="operateEvent" />
    </template>
  </DataTable>

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :orderInfo="orderInfo"
    @refresh-data="startByOrdersData"
    @close="onClosed"
  />
</template>

<script lang="ts" setup>
import { h, ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { order } from "@/api/order/types/order"
import { revokeOrderApi, startByOrderApi } from "@/api/order"
import { Column, ElMessage, ElMessageBox, TableColumnCtx } from "element-plus"
import Detail from "../approved/detail.vue"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { View, Bell, RefreshLeft } from "@element-plus/icons-vue"
const templateToolsStore = useTemplateToolsStore()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const action = ref<string>("my")
const orderInfo = ref<order>()
const loading = ref<boolean>(false)

// 表格列配置
const tableColumns = [
  { prop: "id", label: "工单号", align: "center" as const },
  { prop: "template_name", label: "工单名称", slot: "templateName", align: "center" as const },
  { prop: "provide", label: "来源", slot: "provide", align: "center" as const },
  { prop: "current_step", label: "当前步骤", align: "center" as const },
  { prop: "approved_by", label: "当前处理人", align: "center" as const },
  { prop: "proc_inst_create_time", label: "流程提交时间", align: "center" as const }
]

// 操作按钮配置
const operateBtnItems = [
  { name: "详情", code: "detail", type: "primary", icon: View },
  { name: "催办", code: "urge", type: "warning", icon: Bell },
  { name: "撤回", code: "revoke", type: "danger", icon: RefreshLeft }
]

/** 查询工单列表 */
const ordersData = ref<order[]>([])
const startByOrdersData = async () => {
  loading.value = true
  try {
    const { data } = await startByOrderApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      process_name: ""
    })

    paginationData.total = data.total
    ordersData.value = data.orders

    // 需要合并的字段名，按照合并登记来排序
    const colFields = ["id", "template_name", "withdraw", "current_step", "proc_inst_create_time", "active"]
    // 表格数据，表格字段
    setTableRowSpan(ordersData.value, colFields)

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
    case "detail":
      handleApproval(data)
      break
    case "urge":
      handleUrging(data)
      break
    case "revoke":
      handleRevoke(data)
      break
  }
}

const handleUrging = (row: order) => {
  ElMessage.error("暂不支持功能")
}

const handleRevoke = (row: order) => {
  ElMessageBox({
    title: "撤销工单",
    message: h("p", null, [
      h("span", null, "正在撤销工单: "),
      h("i", { style: "color: red" }, `${row.approved_by}的${templateToolsStore.getTemplateName(row.template_id)}`),
      h("span", null, " 确认？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await revokeOrderApi({
        instance_id: row.process_instance_id,
        force: true
      })
      startByOrdersData()
    } catch (error) {
      // 错误由后端处理
    }
  })
}

const handleApproval = (row: order) => {
  dialogVisible.value = true
  orderInfo.value = row
  action.value = "my-" + row.current_step
}

const onClosed = () => {
  dialogVisible.value = false
  orderInfo.value = undefined
}

// 设置合并的行和列
const setTableRowSpan = (tableData: any, colFields: string[]) => {
  let lastItem: any = []
  // 循环需要合并的列
  colFields.forEach((field: string, index: number) => {
    tableData.forEach((item: any) => {
      // 存值，把合并字段存入行，为了合并单元格时检索列是否含有该字段
      item.mergeCell = colFields
      // 合并的字段出现的次数
      const rowSpan = `rowspan_${field}`
      // 比较上一次的存值和该轮的合并字段，判断是否合并到上个单元格
      if (colFields.slice(0, index + 1).every((e: string | number) => lastItem[e] === item[e])) {
        // 如果是，合并行；
        item[rowSpan] = 0 // 该轮合并字段数量存0
        // 上轮合并字段数量+1
        lastItem[rowSpan] += 1
      } else {
        //初始化进入&& 如果不是，完成一次同类合并，lastItem重新赋值，进入下一次计算
        item[rowSpan] = 1 // 该轮合并字段第一次出现，数量存1
        // 改变比较对象，重新赋值，进行下一次计算
        lastItem = item
      }
    })
  })
}

// 类型定义
interface Row {
  mergeCell: string[]
  [key: `rowspan_${string}`]: number | undefined
}

// 列表合并单元格发方法
const objectSpanMethod = ({ row, column }: { row: Row; column: TableColumnCtx<Column> }) => {
  if (row.mergeCell.includes(column.property)) {
    const rowspan = row[`rowspan_${column.property}`]
    if (rowspan) {
      return { rowspan: rowspan, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], startByOrdersData, { immediate: true })

defineExpose({
  startByOrdersData
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

/* 使用全局样式强制覆盖 */
:global(.manager-content .content-card) {
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
}
</style>
