<template>
  <div class="record-container">
    <el-timeline class="record-timeline" v-if="taskRecordsData.length > 0">
      <el-timeline-item
        v-for="(activity, index) in taskRecordsData"
        :key="index"
        :timestamp="activity.finished_time"
        placement="top"
        :type="getTimelineItemType(activity)"
        :color="getTimelineItemColor(activity)"
        :hollow="activity.is_finished !== 1"
      >
        <el-card class="timeline-card" shadow="hover">
          <div class="card-header">
            <span class="node-name">{{ activity.nodename }}</span>
            <el-tag :type="getTagType(activity)" effect="plain" size="small">
              {{ getTagLabel(activity) }}
            </el-tag>
          </div>
          <div class="card-content">
            <div class="info-row">
              <span class="label">操作人:</span>
              <span class="value">{{ activity.approved_by || "-" }}</span>
            </div>
            <div class="info-row" v-if="activity.comment">
              <span class="label">评论:</span>
              <span class="value comment">{{ activity.comment }}</span>
            </div>

            <div class="extra-data-section" v-if="activity.extra_data && Object.keys(activity.extra_data).length > 0">
              <div class="data-title">表单数据:</div>
              <div class="data-content">
                <div v-for="(value, key) in activity.extra_data" :key="key" class="data-item">
                  <span class="data-key">{{ key }}:</span>
                  <span class="data-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty v-else description="暂无审批记录" />

    <div class="pager-wrapper" v-if="taskRecordsData.length > 0">
      <el-pagination
        v-model:current-page="paginationData.currentPage"
        v-model:page-size="paginationData.pageSize"
        :page-sizes="paginationData.pageSizes"
        :layout="paginationData.layout"
        :total="paginationData.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { orderTaskRecordsApi } from "@/api/order"
import { taskRecord } from "@/api/order/types/order"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

const taskRecordsData = ref<taskRecord[]>([])
const loading = ref<boolean>(false)

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

// Timeline helpers
const getTimelineItemType = (row: taskRecord) => {
  const type = getTagType(row)
  return type === "danger" ? "danger" : type === "success" ? "success" : "primary"
}

const getTimelineItemColor = (row: taskRecord) => {
  if (row.is_finished === 0) return "#909399" // Info color for pending
  return "" // Default uses type color
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
.record-container {
  padding: 0 20px 20px 20px;
  height: 100%;
  overflow-y: auto;
}

.record-timeline {
  padding-top: 10px;
  padding-left: 2px;
}

.timeline-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  :deep(.el-card__body) {
    padding: 12px 16px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .node-name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}

.card-content {
  .info-row {
    display: flex;
    font-size: 13px;
    margin-bottom: 4px;
    line-height: 1.5;

    .label {
      color: #909399;
      min-width: 50px;
      margin-right: 8px;
    }

    .value {
      color: #606266;
    }

    .comment {
      color: #303133;
    }
  }

  .extra-data-section {
    margin-top: 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid #ebedf0;

    .data-title {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 4px;
    }

    .data-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px 16px;
    }

    .data-item {
      font-size: 13px;
      line-height: 1.6;
      display: flex;
      align-items: flex-start;

      .data-key {
        color: #909399;
        margin-right: 8px;
        white-space: nowrap;
        font-weight: 500;
      }

      .data-value {
        color: #303133;
        word-break: break-all;
      }
    }
  }
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-right: 20px;
}
</style>
