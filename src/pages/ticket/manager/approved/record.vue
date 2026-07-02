<template>
  <div class="record-container">
    <div class="record-body" v-loading="loading">
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
          <div class="timeline-card" :class="`status-${getTagType(activity)}`">
            <div class="record-heading">
              <div class="heading-main">
                <span class="node-name">{{ activity.node_name }}</span>
                <span class="operator">{{ activity.approved_by || "-" }}</span>
              </div>
              <el-tag :type="getTagType(activity)" effect="light" size="small" round>
                {{ getTagLabel(activity) }}
              </el-tag>
            </div>

            <div class="record-comment" v-if="activity.comment">
              {{ activity.comment }}
            </div>

            <div class="card-content">
              <div class="extra-data-section" v-if="activity.form_values && activity.form_values.length > 0">
                <div class="data-title">表单数据</div>
                <div class="data-content">
                  <div v-for="(item, idx) in activity.form_values" :key="idx" class="data-item">
                    <span class="data-key">{{ item.name }}</span>
                    <span class="data-value">
                      {{ Array.isArray(item.value) ? item.value.join(", ") : item.value }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无审批记录" />
    </div>

    <div class="pager-wrapper" v-if="taskRecordsData.length > 0">
      <span class="pager-summary">共 {{ paginationData.total }} 条记录</span>
      <el-pagination
        background
        v-model:current-page="paginationData.currentPage"
        v-model:page-size="paginationData.pageSize"
        :page-sizes="paginationData.pageSizes"
        layout="sizes, prev, pager, next, jumper"
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
import { listTicketTaskRecordsApi } from "@/api/ticket/manager"
import { taskRecord } from "@/api/ticket/manager/types/manager"

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
  if (row.status === 5 && row.is_finished === 1) return "info"
  if (row.status === 0 && row.is_finished === 1) return "danger"
  return "warning"
}

const getTagLabel = (row: taskRecord) => {
  const isAutomation = row.node_name?.startsWith("自动化-") ?? false
  if (row.status === 1 && !isAutomation && row.is_finished === 1) return "确认通过"
  if (row.status === 1 && isAutomation && row.is_finished === 1) return "自动通过"
  if (row.status === 3 && row.is_finished === 1) return "系统通过"
  if (row.status === 4 && row.is_finished === 1) return "系统驳回"
  if (row.status === 2 && row.is_finished === 1) return "手动驳回"
  if (row.status === 5 && row.is_finished === 1) return "系统跳过"
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
const listTicketTaskRecordsData = async () => {
  if (!props.processInstId) return

  loading.value = true
  try {
    const { data } = await listTicketTaskRecordsApi({
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
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTicketTaskRecordsData, { immediate: true })

defineExpose({
  listTicketTaskRecordsData
})
</script>

<style lang="scss" scoped>
.record-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
}

.record-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 8px 18px;
}

.record-timeline {
  padding: 0;
}

.record-timeline :global(.el-timeline-item) {
  padding-bottom: 16px;
}

.record-timeline :global(.el-timeline-item__timestamp) {
  color: #8a93a3;
  font-size: 13px;
}

.timeline-card {
  padding: 14px 16px;
  background: #fbfdff;
  border: 1px solid #e5eaf3;
  border-left: 3px solid #409eff;
  border-radius: 6px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bdd7f5;
  }

  &.status-success {
    border-left-color: #67c23a;
  }

  &.status-danger {
    border-left-color: #f56c6c;
  }

  &.status-warning {
    border-left-color: #e6a23c;
  }

  &.status-info {
    border-left-color: #909399;
  }
}

.record-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.heading-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.node-name {
  color: #1f2937;
  font-size: 15px;
  font-weight: 700;
}

.operator {
  color: #7b8494;
  font-size: 13px;
}

.record-comment {
  margin-top: 8px;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}

.card-content {
  .extra-data-section {
    margin-top: 10px;
    background-color: #ffffff;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebedf0;

    .data-title {
      font-size: 12px;
      font-weight: 600;
      color: #7b8494;
      margin-bottom: 6px;
    }

    .data-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px 14px;
    }

    .data-item {
      font-size: 12px;
      line-height: 1.6;
      display: flex;
      align-items: flex-start;

      .data-key {
        color: #909399;
        margin-right: 8px;
        white-space: nowrap;
      }

      .data-value {
        color: #374151;
        word-break: break-all;
      }
    }
  }
}

.pager-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 24px;
  border-top: 1px solid #edf2f7;
  background: #fbfdff;

  .el-pagination {
    margin-left: auto;
  }
}

.pager-summary {
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}
</style>
