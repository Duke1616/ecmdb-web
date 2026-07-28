<template>
  <div class="record-container">
    <div class="record-body" v-loading="loading">
      <el-timeline class="record-timeline" v-if="timelineEvents.length > 0">
        <el-timeline-item
          v-for="activity in timelineEvents"
          :key="activity.id"
          :timestamp="activity.occurred_at"
          placement="top"
          :type="getTimelineItemType(activity)"
          :color="getTimelineItemColor(activity)"
          :hollow="activity.summary.pending > 0"
        >
          <div class="timeline-card" :class="`status-${getTimelineTagType(activity)}`">
            <div class="record-heading">
              <div class="heading-main">
                <span class="node-name">{{ activity.node_name }}</span>
                <span class="operator">{{ activity.actors.length > 0 ? activity.actors.join("、") : "系统" }}</span>
              </div>
              <el-tag :type="getTimelineTagType(activity)" effect="light" size="small" round>
                {{ getTimelineTagLabel(activity) }}
              </el-tag>
            </div>

            <div class="record-summary">{{ getTimelineSummary(activity) }}</div>

            <el-collapse v-if="activity.members.length > 0" class="member-collapse">
              <el-collapse-item :name="activity.id">
                <template #title>查看 {{ activity.members.length }} 人处理明细</template>
                <div v-for="(member, index) in activity.members" :key="index" class="member-record">
                  <div class="record-heading">
                    <div class="heading-main">
                      <span class="operator">{{ member.approved_by || "-" }}</span>
                    </div>
                    <el-tag :type="getTaskTagType(member)" effect="light" size="small" round>
                      {{ getTaskTagLabel(member) }}
                    </el-tag>
                  </div>
                  <div class="record-comment" v-if="member.comment">{{ member.comment }}</div>
                  <div class="extra-data-section" v-if="member.form_values && member.form_values.length > 0">
                    <div class="data-title">表单数据</div>
                    <div class="data-content">
                      <div v-for="(item, itemIndex) in member.form_values" :key="itemIndex" class="data-item">
                        <span class="data-key">{{ item.name }}</span>
                        <span class="data-value">{{
                          Array.isArray(item.value) ? item.value.join(", ") : item.value
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无审批记录" />
    </div>

    <div class="pager-wrapper" v-if="timelineEvents.length > 0">
      <span class="pager-summary">共 {{ paginationData.total }} 个节点事件</span>
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
import { listTicketTaskTimelineApi } from "@/api/ticket/manager"
import { taskRecord, taskTimelineEvent } from "@/api/ticket/manager/types/manager"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

const timelineEvents = ref<taskTimelineEvent[]>([])
const loading = ref<boolean>(false)

const getTaskTagType = (row: taskRecord) => {
  if (row.status === 1 && row.is_finished === 1) return "success"
  if (row.status === 2) return "danger"
  if (row.status === 3 && row.is_finished === 1) return "success"
  if (row.status === 4 && row.is_finished === 1) return "danger"
  if (row.status === 5 && row.is_finished === 1) return "info"
  if (row.status === 0 && row.is_finished === 1) return "danger"
  return "warning"
}

const getTaskTagLabel = (row: taskRecord) => {
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
const getTimelineTagType = (event: taskTimelineEvent) => {
  const summary = event.summary
  if (summary.pending > 0) return "warning"
  if (summary.rejected > 0 || summary.system_rejected > 0) return "danger"
  if (summary.passed > 0 || summary.system_passed > 0) return "success"
  if (summary.skipped > 0) return "info"
  return "warning"
}

const getTimelineTagLabel = (event: taskTimelineEvent) => {
  const summary = event.summary
  if (summary.pending > 0) return "等待处理"
  if (summary.rejected > 0) return "手动驳回"
  if (summary.system_rejected > 0) return "系统驳回"
  if (summary.passed > 0) return "确认通过"
  if (summary.system_passed > 0) return "系统通过"
  if (summary.skipped > 0) return "系统跳过"
  return "已处理"
}

const getTimelineSummary = (event: taskTimelineEvent) => {
  const summary = event.summary
  const parts: string[] = []
  if (summary.passed > 0) parts.push(`${summary.passed} 人通过`)
  if (summary.rejected > 0) parts.push(`${summary.rejected} 人驳回`)
  if (summary.system_passed > 0) parts.push(`${summary.system_passed} 人系统通过`)
  if (summary.system_rejected > 0) parts.push(`${summary.system_rejected} 人系统驳回`)
  if (summary.linked > 0) parts.push(`${summary.linked} 人节点或签联动处理`)
  if (summary.skipped > 0) parts.push(`${summary.skipped} 人系统跳过`)
  if (summary.pending > 0) parts.push(`${summary.pending} 人待处理`)
  return parts.join("，") || (summary.total > 0 ? `${summary.total} 人已处理` : "暂无处理结果")
}

const getTimelineItemType = (event: taskTimelineEvent) => {
  const type = getTimelineTagType(event)
  return type === "danger" ? "danger" : type === "success" ? "success" : "primary"
}

const getTimelineItemColor = (event: taskTimelineEvent) => {
  if (event.summary.pending > 0) return "#909399"
  return "" // Default uses type color
}

/** 查询按节点批次聚合的审批时间线 */
const listTicketTaskTimelineData = async () => {
  if (!props.processInstId) return

  loading.value = true
  try {
    const { data } = await listTicketTaskTimelineApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      process_inst_id: props.processInstId
    })

    paginationData.total = data.total
    timelineEvents.value = data.events
  } catch (error) {
    timelineEvents.value = []
  } finally {
    loading.value = false
  }
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTicketTaskTimelineData, {
  immediate: true
})

defineExpose({
  listTicketTaskTimelineData
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

.record-summary {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.member-collapse {
  margin-top: 12px;
  border-top: 1px solid #edf2f7;
  border-bottom: 0;

  :global(.el-collapse-item__header) {
    height: 34px;
    color: #409eff;
    font-size: 13px;
    border-bottom: 0;
    background: transparent;
  }

  :global(.el-collapse-item__wrap) {
    border-bottom: 0;
    background: transparent;
  }

  :global(.el-collapse-item__content) {
    padding-bottom: 0;
  }
}

.member-record {
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #ebedf0;
  border-radius: 6px;
  background: #fff;
}

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
