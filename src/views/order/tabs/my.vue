<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table
        :data="ordersData"
        :span-method="objectSpanMethod"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="process_instance_id" label="流程单号" align="center" />
        <el-table-column prop="template_name" label="工单名称" align="center" />
        <el-table-column prop="current_step" label="当前步骤" align="center" />
        <el-table-column prop="approved_by" label="当前处理人" align="center" />
        <el-table-column prop="proc_inst_create_time" label="流程提交时间" align="center" />
        <el-table-column prop="withdraw" fixed="right" label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" text bg size="small" @click="handleDelete(scope.row)">详情</el-button>
            <el-button type="warning" text bg size="small" @click="handleDelete(scope.row)">催办</el-button>
            <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">撤回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :currentPage="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { order } from "@/api/order/types/order"
import { startByOrderApi } from "@/api/order"
import { Column, TableColumnCtx } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

/** 查询模版列表 */
const ordersData = ref<order[]>([])
const startByOrdersData = () => {
  startByOrderApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    process_name: ""
  })
    .then(({ data }) => {
      paginationData.total = data.total
      ordersData.value = data.orders
      // 需要合并的字段名，按照合并登记来排序
      const colFields = [
        "process_instance_id",
        "template_name",
        "withdraw",
        "current_step",
        "proc_inst_create_time",
        "active"
      ]
      // 表格数据，表格字段
      setTableRowSpan(ordersData.value, colFields)
    })
    .catch(() => {
      ordersData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: order) => {
  console.log(row)
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
</style>
