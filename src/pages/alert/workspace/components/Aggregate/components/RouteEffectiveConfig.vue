<template>
  <section class="effective-panel">
    <div class="effective-card">
      <div class="card-header">
        <div class="header-left">
          <el-icon class="pulse-icon"><Compass /></el-icon>
          <span class="title">当前路由最终生效策略</span>
        </div>
        <el-tag size="small" type="info" effect="plain" class="inherit-badge">继承自父级与当前合并</el-tag>
      </div>

      <div class="effective-content">
        <!-- 路由路径 -->
        <div class="effective-row path-row">
          <div class="row-label">
            <el-icon><Share /></el-icon>
            <span>生效路径</span>
          </div>
          <div class="row-value">
            <div class="path-breadcrumbs">
              <template v-for="(node, index) in breadcrumbs" :key="node.id">
                <span class="path-node" :class="{ 'is-last': index === breadcrumbs.length - 1 }">
                  {{ node.name }}
                </span>
                <el-icon v-if="index < breadcrumbs.length - 1" class="separator-icon"><ArrowRight /></el-icon>
              </template>
            </div>
          </div>
        </div>

        <!-- 详细项 Grid -->
        <div class="info-grid">
          <!-- 分组标签 -->
          <div class="grid-card">
            <div class="card-label">
              <el-icon><PriceTag /></el-icon>
              <span>分组标签 (group_by)</span>
            </div>
            <div class="card-value tags-list">
              <template v-if="effective.group_by && effective.group_by.length > 0">
                <el-tag
                  v-for="tag in effective.group_by"
                  :key="tag"
                  size="small"
                  class="group-tag"
                  type="primary"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </template>
              <span v-else class="empty-text">未指定（不分组）</span>
            </div>
          </div>

          <!-- 数据源区分 -->
          <div class="grid-card">
            <div class="card-label">
              <el-icon><Connection /></el-icon>
              <span>区分数据源</span>
            </div>
            <div class="card-value">
              <el-tag :type="effective.is_diff_data_source ? 'warning' : 'info'" size="small" effect="light">
                {{ effective.is_diff_data_source ? "是 (各数据源独立聚合)" : "否 (跨数据源混合聚合)" }}
              </el-tag>
            </div>
          </div>

          <!-- 通知节奏 (时间策略) -->
          <div class="grid-card double-column">
            <div class="card-label">
              <el-icon><Clock /></el-icon>
              <span>合并与发送节奏</span>
            </div>
            <div class="card-value timing-badges">
              <div class="timing-badge wait">
                <span class="badge-label">组等待</span>
                <span class="badge-val">{{ formatSeconds(effective.group_wait) }}</span>
              </div>
              <div class="timing-badge interval">
                <span class="badge-label">组间隔</span>
                <span class="badge-val">{{ formatSeconds(effective.group_interval) }}</span>
              </div>
              <div class="timing-badge repeat">
                <span class="badge-label">重复间隔</span>
                <span class="badge-val">{{ formatSeconds(effective.repeat_interval) }}</span>
              </div>
            </div>
          </div>

          <div class="grid-card double-column">
            <div class="card-label">
              <el-icon><Bell /></el-icon>
              <span>通知策略</span>
            </div>
            <div class="card-value notify-summary">
              <div class="receiver-list">
                <template v-if="effective.receivers && effective.receivers.length > 0">
                  <el-tag
                    v-for="receiver in effective.receivers"
                    :key="`${receiver.type}-${receiver.id}`"
                    size="small"
                    type="primary"
                    effect="plain"
                    class="receiver-tag"
                  >
                    {{ getReceiverTypeLabel(receiver.type) }} / {{ receiver.display_name || receiver.id }}
                  </el-tag>
                </template>
                <span v-else class="empty-text">继承工作空间默认团队</span>
              </div>
              <el-tag size="small" type="info" effect="plain">
                {{
                  effective.template_id ? alertTemplateName || `模板 #${effective.template_id}` : "继承工作空间默认模板"
                }}
              </el-tag>
            </div>
          </div>

          <div class="grid-card double-column">
            <div class="card-label">
              <el-icon><Tickets /></el-icon>
              <span>工单动作</span>
            </div>
            <div class="card-value ticket-summary">
              <template v-if="effective.ticket_policy?.enabled">
                <el-tag size="small" type="success" effect="light">{{
                  ticketModeLabel(effective.ticket_policy.mode)
                }}</el-tag>
                <el-tag size="small" type="info" effect="plain">
                  {{ ticketTemplateName || `模板 #${effective.ticket_policy.template_id}` }}
                </el-tag>
                <el-tag size="small" type="info" effect="plain">
                  持续 {{ formatSeconds(effective.ticket_policy.duration) }}
                </el-tag>
                <el-tag size="small" type="info" effect="plain">次数 {{ effective.ticket_policy.eval_count }}</el-tag>
              </template>
              <el-tag v-else-if="effective.ticket_policy" size="small" type="info" effect="plain">已禁用</el-tag>
              <span v-else class="empty-text">未启用</span>
            </div>
          </div>

          <div class="grid-card double-column">
            <div class="card-label">
              <el-icon><Promotion /></el-icon>
              <span>升级动作</span>
            </div>
            <div class="card-value ticket-summary">
              <template v-if="effective.escalation_policy?.enabled">
                <el-tag size="small" type="warning" effect="light">已启用</el-tag>
                <el-tag size="small" type="info" effect="plain">
                  {{ escalationConfigName || `配置 #${effective.escalation_policy.config_id}` }}
                </el-tag>
              </template>
              <el-tag v-else-if="effective.escalation_policy" size="small" type="info" effect="plain">已禁用</el-tag>
              <span v-else class="empty-text">未启用</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import {
  ArrowRight,
  Bell,
  Clock,
  Compass,
  Connection,
  PriceTag,
  Promotion,
  Share,
  Tickets
} from "@element-plus/icons-vue"
import type { AggregateGroupRule } from "@/api/alert/aggregate/types"
import { getConfigApi } from "@/api/alert/escalation"
import { getTemplateDetailApi } from "@/api/alert/template"
import { detailTemplateApi } from "@/api/ticket/template"

const props = defineProps<{
  effective: NonNullable<AggregateGroupRule["effective"]>
  routes: AggregateGroupRule[]
}>()

const alertTemplateName = ref("")
const ticketTemplateName = ref("")
const escalationConfigName = ref("")

watch(
  () => props.effective.template_id,
  async (id) => {
    if (!id) {
      alertTemplateName.value = ""
      return
    }
    try {
      const res = await getTemplateDetailApi(id)
      alertTemplateName.value = res.data?.name || `模板 #${id}`
    } catch {
      alertTemplateName.value = `模板 #${id}`
    }
  },
  { immediate: true }
)

watch(
  () => props.effective.ticket_policy?.template_id,
  async (id) => {
    if (!id) {
      ticketTemplateName.value = ""
      return
    }
    try {
      const res = await detailTemplateApi(id)
      ticketTemplateName.value = res.data?.name || `模板 #${id}`
    } catch {
      ticketTemplateName.value = `模板 #${id}`
    }
  },
  { immediate: true }
)

watch(
  () => props.effective.escalation_policy?.config_id,
  async (id) => {
    if (!id) {
      escalationConfigName.value = ""
      return
    }
    try {
      const { data } = await getConfigApi(id)
      escalationConfigName.value = data?.config?.name || `配置 #${id}`
    } catch {
      escalationConfigName.value = `配置 #${id}`
    }
  },
  { immediate: true }
)

const breadcrumbs = computed(() => {
  const path = props.effective.route_path
  if (!path || path.length === 0) return []
  return path.map((id: number) => {
    const route = props.routes.find((r) => r.id === id)
    return {
      id,
      name: route ? route.name : `#${id}`
    }
  })
})

function formatSeconds(s: number) {
  if (s === 0) return "0s"
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (s % 60 !== 0) return `${s}s`
  if (m < 60) return `${m}分钟`
  const h = Math.floor(m / 60)
  if (m % 60 !== 0) return `${m}分钟`
  if (h < 24) return `${h}小时`
  const d = Math.floor(h / 24)
  if (h % 24 !== 0) return `${h}小时`
  return `${d}天`
}

function getReceiverTypeLabel(type: string) {
  const labels: Record<string, string> = {
    user: "用户",
    team: "团队",
    oncall: "排班"
  }
  return labels[type] || type
}

function ticketModeLabel(mode?: string) {
  const labels: Record<string, string> = {
    ticket_only: "仅创建工单",
    ticket_and_notify: "工单并通知"
  }
  return labels[mode || "ticket_only"] || mode
}
</script>

<style lang="scss" scoped>
.effective-panel {
  padding: 20px 16px;
  background-color: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.effective-card {
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: visible;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 12px 0;
  background: transparent;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;

    .pulse-icon {
      color: #3b82f6;
      font-size: 15px;
      animation: gentle-pulse 2s infinite ease-in-out;
    }
  }

  .inherit-badge {
    font-size: 11px;
    border-radius: 4px;
    background-color: #f1f5f9;
  }
}

.effective-content {
  padding: 0;
}

.effective-row {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  margin-bottom: 12px;

  .row-label {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100px;
    flex-shrink: 0;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;

    .el-icon {
      font-size: 14px;
      color: #94a3b8;
    }
  }

  .row-value {
    flex: 1;
    min-width: 0;
  }
}

.path-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.path-node {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
  white-space: nowrap;

  &.is-last {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.05);
  }
}

.separator-icon {
  font-size: 11px;
  color: #cbd5e1;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.grid-card {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }

  &.double-column {
    grid-column: span 2;
  }

  .card-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;

    .el-icon {
      font-size: 13px;
      color: #94a3b8;
    }
  }

  .card-value {
    min-height: 24px;
    display: flex;
    align-items: center;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.group-tag {
  border-radius: 4px;
}

.empty-text {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

.timing-badges {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.notify-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  gap: 8px;
}

.ticket-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.receiver-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.receiver-tag {
  border-radius: 4px;
}

.timing-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  &.wait {
    border-left: 3px solid #6366f1;
    .badge-val {
      color: #4f46e5;
    }
  }
  &.interval {
    border-left: 3px solid #06b6d4;
    .badge-val {
      color: #0891b2;
    }
  }
  &.repeat {
    border-left: 3px solid #10b981;
    .badge-val {
      color: #059669;
    }
  }

  .badge-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
  }

  .badge-val {
    font-size: 12px;
    font-weight: 700;
    margin-left: auto;
  }
}

@keyframes gentle-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  .grid-card.double-column {
    grid-column: span 1;
  }
  .timing-badges {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
