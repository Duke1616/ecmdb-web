<template>
  <div class="record-container">
    <div class="record-body" v-loading="loading">
      <el-timeline v-if="timelineEvents.length > 0" class="record-timeline">
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
                <span class="operator">
                  {{ activity.actors.length > 0 ? activity.actors.map(formatOperator).join("、") : "系统" }}
                </span>
              </div>
              <el-tag :type="getTimelineTagType(activity)" effect="light" size="small" round>
                {{ getTimelineTagLabel(activity) }}
              </el-tag>
            </div>

            <div class="record-summary">{{ getTimelineSummary(activity) }}</div>

            <!-- 多人/明细处理折叠区 -->
            <el-collapse v-if="activity.members.length > 0" class="member-collapse">
              <el-collapse-item :name="activity.id">
                <template #title>查看 {{ activity.members.length }} 人处理明细</template>
                <div v-for="(member, index) in activity.members" :key="index" class="member-record">
                  <div class="record-heading">
                    <div class="heading-main">
                      <span class="operator">{{ formatOperator(member.approved_by) }}</span>
                    </div>
                    <el-tag :type="getTaskTagType(member)" effect="light" size="small" round>
                      {{ getTaskTagLabel(member) }}
                    </el-tag>
                  </div>

                  <div v-if="member.comment" class="record-comment">{{ member.comment }}</div>

                  <!-- 表单动态数据呈现 -->
                  <div v-if="member.form_values && member.form_values.length > 0" class="extra-data-section">
                    <div class="data-title">表单数据</div>
                    <div class="data-content">
                      <div v-for="(item, itemIndex) in member.form_values" :key="itemIndex" class="data-item">
                        <span class="data-key">{{ item.name }}</span>
                        <span class="data-value">
                          {{ Array.isArray(item.value) ? item.value.join(", ") : item.value }}
                        </span>
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

    <!-- 分页器 -->
    <div v-if="timelineEvents.length > 0" class="pager-wrapper">
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
import type { taskTimelineEvent, ProcessInstanceID } from "@/api/ticket/manager/types/manager"
import {
  formatOperator,
  getTaskTagType,
  getTaskTagLabel,
  resolveTimelineSummary,
  getTimelineTagType,
  getTimelineTagLabel,
  getTimelineSummary,
  getTimelineItemType,
  getTimelineItemColor
} from "./utils/recordHelpers"

interface Props {
  processInstId: ProcessInstanceID | undefined
}

const props = defineProps<Props>()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const timelineEvents = ref<taskTimelineEvent[]>([])
const loading = ref<boolean>(false)

/**
 * 查询按节点批次聚合的审批时间线数据
 */
const listTicketTaskTimelineData = async () => {
  if (!props.processInstId) {
    timelineEvents.value = []
    paginationData.total = 0
    return
  }

  loading.value = true
  try {
    const { data } = await listTicketTaskTimelineApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      process_inst_id: props.processInstId
    })

    paginationData.total = data.total
    timelineEvents.value = (data.events || []).map((event) => ({
      ...event,
      summary: resolveTimelineSummary(event)
    }))
  } catch (error) {
    timelineEvents.value = []
  } finally {
    loading.value = false
  }
}

// 监听工单实例 ID 切换时重置分页并刷新
watch(
  () => props.processInstId,
  () => {
    paginationData.currentPage = 1
    listTicketTaskTimelineData()
  }
)

// 监听分页参数变化刷新
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
