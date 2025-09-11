<template>
  <DataTable
    :data="taskRecordsData"
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
    <template #action="{ row }">
      <el-tag :type="getTagType(row)" effect="plain">
        {{ getTagLabel(row) }}
      </el-tag>
    </template>
  </DataTable>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { orderTaskRecordsApi } from "@/api/order"
import DataTable from "@@/components/DataTable/index.vue"
import { taskRecord } from "@/api/order/types/order"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

const taskRecordsData = ref<taskRecord[]>([])
const loading = ref<boolean>(false)

// 表格列配置
const tableColumns = [
  { prop: "nodename", label: "节点名称", align: "center" as const },
  { prop: "approved_by", label: "操作人", align: "center" as const },
  { prop: "action", label: "任务动作", slot: "action", align: "center" as const },
  { prop: "comment", label: "评论", align: "center" as const },
  { prop: "finished_time", label: "处理时间", align: "center" as const }
]

const getTagType = (row: taskRecord) => {
  if (row.status === 1 && row.is_finished === 1) return "success"
  if (row.status === 2) return "danger"
  if (row.status === 3 && row.is_finished === 1) return "success"
  if (row.status === 4 && row.is_finished === 1) return "danger"
  if (row.status === 0 && row.is_finished === 1) return "danger"
  return "warning"
}

const getTagLabel = (row: taskRecord) => {
  if (row.status === 1 && !row.nodename.startsWith("自动化-") && row.is_finished === 1) return "确认通过"
  if (row.status === 1 && row.nodename.startsWith("自动化-") && row.is_finished === 1) return "自动通过"
  if (row.status === 3 && row.is_finished === 1) return "系统通过"
  if (row.status === 4 && row.is_finished === 1) return "系统驳回"
  if (row.status === 2 && row.is_finished === 1) return "手动驳回"
  if (row.status === 0 && row.is_finished === 1) return "节点或签联动处理"
  return "等待处理"
}
/** 查询审批记录列表 */
const listOrderTaskRecordsData = async () => {
  if (!props.processInstId) return

  loading.value = true
  try {
    const { data } = await orderTaskRecordsApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      process_inst_id: props.processInstId
    })

    paginationData.total = data.total
    taskRecordsData.value = data.task_records
  } catch (error) {
    taskRecordsData.value = []
  } finally {
    loading.value = false
  }
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listOrderTaskRecordsData, { immediate: true })

defineExpose({
  listOrderTaskRecordsData
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
