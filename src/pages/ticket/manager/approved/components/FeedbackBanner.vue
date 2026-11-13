<template>
  <!-- 审批反馈与前序意见融合栏：默认单行紧凑展示，首屏优先呈现表单信息，可一键展开完整审批历史 -->
  <div
    v-if="hasFeedbackBanner"
    class="feedback-banner"
    :class="{
      'is-reject': isRejectState,
      'is-expanded': feedbackExpanded
    }"
  >
    <div class="feedback-banner__bar" @click="feedbackExpanded = !feedbackExpanded">
      <div class="feedback-banner__left">
        <span class="feedback-banner__icon">
          <el-icon v-if="isRejectState"><WarningFilled /></el-icon>
          <el-icon v-else><ChatDotRound /></el-icon>
        </span>

        <el-tag
          :type="isRejectState ? 'warning' : 'info'"
          size="small"
          effect="light"
          round
          class="feedback-banner__tag"
        >
          {{ isRejectState ? "审批驳回" : props.isHistoryMode ? "审批留言" : "审批意见" }}
        </el-tag>

        <span class="feedback-banner__summary" :title="feedbackSummaryText">
          {{ feedbackSummaryText }}
        </span>
      </div>

      <div class="feedback-banner__right">
        <span v-if="historyCountText" class="feedback-banner__count">
          {{ historyCountText }}
        </span>
        <span class="feedback-banner__toggle">
          <span>{{ feedbackExpanded ? "收起" : "展开详情" }}</span>
          <el-icon class="toggle-icon" :class="{ 'is-expanded': feedbackExpanded }">
            <ArrowRight />
          </el-icon>
        </span>
      </div>
    </div>

    <!-- 折叠展开详情区 -->
    <el-collapse-transition>
      <div v-show="feedbackExpanded" class="feedback-banner__content">
        <!-- 详细驳回修改意见卡片 (存在有效活动驳回时醒目呈现) -->
        <div v-if="effectiveLatestReject" class="reject-detail-card">
          <div class="reject-detail-card__header">
            <div class="node-meta">
              <span class="node-tag">[{{ effectiveLatestReject.node_name }}] 环节驳回</span>
              <span class="user-info">
                处理人：<strong>{{
                  effectiveLatestReject.rejected_by_name || effectiveLatestReject.rejected_by
                }}</strong>
              </span>
            </div>
            <span class="time">{{ formatRejectTime(effectiveLatestReject.rejected_at) }}</span>
          </div>
          <div class="reject-detail-card__body">
            <span class="label">修改意见：</span>
            <span class="text">{{ effectiveLatestReject.reason }}</span>
          </div>
        </div>

        <!-- 前序历史审批意见时间线 -->
        <div v-if="visiblePriorComments.length > 0" class="flow-history">
          <div v-if="effectiveLatestReject || props.isHistoryMode" class="flow-history__title">
            {{ props.isHistoryMode ? "流转留言记录" : "前序流转记录" }}
          </div>
          <div class="flow-history__timeline">
            <div
              v-for="(item, index) in visiblePriorComments"
              :key="`${item.node_id}-${item.approved_by}-${item.occurred_at}-${index}`"
              class="flow-history__item"
            >
              <div class="flow-history__dot" :class="`is-${priorCommentVerdict(item.status).type}`" />
              <div class="flow-history__main">
                <div class="flow-history__meta">
                  <span class="node-name">{{ item.node_name }}</span>
                  <el-tag :type="priorCommentVerdict(item.status).type" size="small" effect="plain" class="verdict-tag">
                    {{ priorCommentVerdict(item.status).label }}
                  </el-tag>
                  <span class="user-name">{{ item.approved_by_name }}</span>
                  <span class="time-stamp">{{ item.occurred_at }}</span>
                </div>
                <p v-if="item.comment" class="flow-history__comment">{{ item.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import dayjs from "dayjs"
import { WarningFilled, ChatDotRound, ArrowRight } from "@element-plus/icons-vue"
import type { LatestReject, PriorComment } from "@/api/ticket/manager/types/manager"
import { TicketStatus } from "@/api/ticket/manager/types/manager"

interface FeedbackBannerProps {
  ticketStatus?: TicketStatus
  latestReject?: LatestReject
  priorComments?: PriorComment[]
  isHistoryMode?: boolean
}

const props = withDefaults(defineProps<FeedbackBannerProps>(), {
  ticketStatus: undefined,
  latestReject: undefined,
  priorComments: () => [],
  isHistoryMode: false
})

// 折叠展开状态：默认单行紧凑展示
const feedbackExpanded = ref(false)

// 格式化驳回时间
const formatRejectTime = (timeStr?: string) => {
  if (!timeStr) return ""
  const d = dayjs(timeStr)
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : timeStr
}

// 辅助方法：判断是否存在实质性留言内容
const hasSubstantiveComment = (text?: string) => Boolean(text && text.trim().length > 0)

// 有效的最新活动驳回信息：
// 核心状态防护：当工单已结单（TicketStatus.End），说明历史上哪怕经历过驳回插曲，也已经被后续审核通过解决；
// 此时接口残留的 latest_reject 属于未被后端及时清空的过期/历史脏数据，前端坚决不做为顶层活动驳回展示
const effectiveLatestReject = computed<LatestReject | undefined>(() => {
  if (props.ticketStatus === TicketStatus.End) {
    return undefined
  }
  return props.latestReject
})

// 顶部驳回信息与流转留言统一在融合栏展示：
// 1. 当存在有效活动驳回时，自动过滤同一次驳回记录，避免同屏重复；
// 2. 针对历史模式（及只读工单），严格只筛选真正填有留言/意见的审批记录（comment 非空），
//    不含留言的常规流转事件保留在【审批记录】Tab 中查看，确保首屏横幅纯粹聚焦在“留言与修改建议”
const visiblePriorComments = computed(() => {
  const banner = effectiveLatestReject.value
  return (props.priorComments || []).filter((item) => {
    // 剔除与顶部 latestReject 重复的那条驳回记录
    if (
      banner &&
      item.status === 2 &&
      item.node_id === banner.node_id &&
      item.approved_by === banner.rejected_by &&
      item.occurred_at === banner.rejected_at
    ) {
      return false
    }

    // 历史及发起人模式：只提取有实际留言内容的审批条目
    if (props.isHistoryMode) {
      return hasSubstantiveComment(item.comment)
    }

    // 待办模式：保留前序流转（包含驳回与普通前序审批）
    return true
  })
})

// 是否处于驳回反馈态：
// 1. 若工单已结单（TicketStatus.End），坚决不允许标黄为驳回态；
// 2. 存在有效的待办驳回，或工单处于撤单态且最新流转动作为驳回否决
const isRejectState = computed(() => {
  if (props.ticketStatus === TicketStatus.End) {
    return false
  }
  if (effectiveLatestReject.value) return true
  if (visiblePriorComments.value.length > 0 && visiblePriorComments.value[0].status === 2) {
    return true
  }
  return false
})

// 是否展示审批反馈融合栏（存在有效驳回或存在有效留言/前序意见时展示）
const hasFeedbackBanner = computed(() => {
  return !!effectiveLatestReject.value || visiblePriorComments.value.length > 0
})

// 单行横幅的摘要说明文字（超出单行时通过省略号截断并支持 title 提示）
const feedbackSummaryText = computed(() => {
  if (effectiveLatestReject.value) {
    const operator = effectiveLatestReject.value.rejected_by_name || effectiveLatestReject.value.rejected_by || "处理人"
    const node = effectiveLatestReject.value.node_name ? `在 [${effectiveLatestReject.value.node_name}] 环节` : ""
    const reason = effectiveLatestReject.value.reason ? ` · 修改意见：${effectiveLatestReject.value.reason}` : ""
    return `由 ${operator} ${node}驳回${reason}`
  }
  if (visiblePriorComments.value.length > 0) {
    const latest = visiblePriorComments.value[0]
    const user = latest.approved_by_name || latest.approved_by

    // 若最新记录为驳回（例如驳回撤单归档场景）
    if (latest.status === 2) {
      const reason = latest.comment ? ` · 驳回原因：${latest.comment}` : ""
      return `由 ${user} 在 [${latest.node_name}] 环节驳回${reason}`
    }

    // 普通通过留言：直接展示处理人与内容，不再重复拼接“审批留言：”前缀
    const reason = latest.comment ? ` · ${latest.comment}` : " · 无附加意见"
    return `${user} (${latest.node_name})${reason}`
  }
  return ""
})

// 历史留言/记录条数描述
const historyCountText = computed(() => {
  const count = visiblePriorComments.value.length
  if (count > 0) {
    return props.isHistoryMode ? `共 ${count} 条留言` : `共 ${count} 条记录`
  }
  return ""
})

const priorCommentVerdict = (status: number): { label: string; type: "success" | "danger" } =>
  status === 2 ? { label: "驳回", type: "danger" } : { label: "通过", type: "success" }
</script>

<style scoped lang="scss">
// 审批反馈与前序意见融合栏（单行轻量展示，支持展开折叠）
.feedback-banner {
  max-width: 960px;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #3b82f6;
  background: #f8fafc;
  transition: all 0.2s ease;
  overflow: hidden;

  &.is-reject {
    border-color: #fde68a;
    border-left-color: #f59e0b;
    background: #fffbeb;

    &:hover {
      background: #fef3c7;
    }
  }

  &:not(.is-reject):hover {
    background: #f1f5f9;
  }

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 38px;
    padding: 5px 12px;
    cursor: pointer;
    user-select: none;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #3b82f6;
  }

  &.is-reject &__icon {
    color: #d97706;
  }

  &__tag {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 500;
  }

  &__summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: #374151;
    line-height: 20px;
  }

  &.is-reject &__summary {
    color: #92400e;
    font-weight: 500;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__count {
    font-size: 12px;
    color: #64748b;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    transition: color 0.15s ease;

    &:hover {
      color: #2563eb;
    }

    .toggle-icon {
      font-size: 12px;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-expanded {
        transform: rotate(90deg);
      }
    }
  }

  &.is-reject &__toggle {
    color: #b45309;

    &:hover {
      color: #d97706;
    }
  }

  &__content {
    padding: 12px 14px 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: #ffffff;
  }
}

// 驳回修改卡片
.reject-detail-card {
  padding: 10px 12px;
  background: #fffdfa;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  margin-bottom: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .node-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;

      .node-tag {
        font-weight: 600;
        color: #c2410c;
      }

      .user-info {
        color: #9a3412;

        strong {
          font-weight: 600;
          color: #7c2d12;
        }
      }
    }

    .time {
      font-size: 11px;
      color: #a8a29e;
    }
  }

  &__body {
    font-size: 12px;
    line-height: 1.6;

    .label {
      font-weight: 600;
      color: #ea580c;
    }

    .text {
      color: #374151;
      white-space: pre-wrap;
    }
  }
}

// 前序流转记录时间线
.flow-history {
  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin: 8px 0 10px;
  }

  &__timeline {
    display: flex;
    flex-direction: column;
  }

  &__item {
    position: relative;
    display: flex;
    gap: 10px;
    padding-bottom: 12px;

    &:last-child {
      padding-bottom: 0;

      &::before {
        display: none;
      }
    }

    &::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 14px;
      bottom: 0;
      width: 1px;
      background: #e2e8f0;
    }
  }

  &__dot {
    position: relative;
    top: 5px;
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #94a3b8;

    &.is-success {
      background: #10b981;
    }

    &.is-danger {
      background: #ef4444;
    }

    &.is-info {
      background: #3b82f6;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 4px;

    .node-name {
      font-weight: 600;
      color: #1e293b;
    }

    .verdict-tag {
      padding: 0 6px;
      height: 20px;
      font-size: 11px;
    }

    .user-name {
      color: #475569;
    }

    .time-stamp {
      margin-left: auto;
      color: #94a3b8;
      font-size: 11px;
    }
  }

  &__comment {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
    background: #f8fafc;
    border-radius: 4px;
    padding: 6px 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
