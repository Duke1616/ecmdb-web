<script setup lang="ts">
import { computed } from "vue"
import type { Policy, ServiceSummary } from "@/api/iam/policy/type"

const props = defineProps<{
  policy?: Policy | null
  services: ServiceSummary[]
}>()

// 计算总权限数
const totalGranted = computed(() => {
  return props.services.reduce((acc, svc) => acc + svc.granted_count, 0)
})

// 计算平均覆盖率
const avgCoverage = computed(() => {
  if (props.services.length === 0) return 0
  const total = props.services.reduce((acc, svc) => acc + svc.total_count, 0)
  return Math.round((totalGranted.value / total) * 100)
})
</script>

<template>
  <div class="governance-status-bar">
    <!-- 策略状态 -->
    <div class="status-item">
      <div class="dot" :class="policy?.type === 1 ? 'info' : 'success'" />
      <span class="label">策略状态:</span>
      <span class="value" :class="policy?.type === 1 ? 'info' : 'success'">
        {{ policy?.type === 1 ? "系统预置" : "动态生效" }}
      </span>
    </div>
    <div class="divider" />

    <!-- 影响范围 -->
    <div class="status-item">
      <span class="label">影响服务:</span>
      <span class="value tint"> {{ services.length }} 个 </span>
    </div>
    <div class="divider" />

    <!-- 授权热度 -->
    <div class="status-item">
      <span class="label">关联主体:</span>
      <span class="value" :class="policy?.assignment_count ? 'success' : 'tint'">
        {{ policy?.assignment_count || 0 }} 个
      </span>
    </div>
    <div class="divider" />

    <!-- 权限负载 -->
    <div class="status-item">
      <span class="label">权限负载:</span>
      <span class="value tint">{{ totalGranted }} 项</span>
    </div>
    <div class="divider" />

    <!-- 治理覆盖率 -->
    <div class="status-item">
      <div class="dot" :class="avgCoverage > 80 ? 'success' : 'warning'" />
      <span class="label">治理覆盖率:</span>
      <span class="value" :class="avgCoverage > 80 ? 'success' : 'warning'"> {{ avgCoverage }}% </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.governance-status-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;

  .status-item {
    display: flex;
    align-items: center;
    font-size: 13px;
    gap: 8px;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.success {
        background: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
      }
      &.info {
        background: #6366f1;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
      &.warning {
        background: #f59e0b;
      }
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      font-weight: 700;
      &.success {
        color: #10b981;
      }
      &.info {
        color: #6366f1;
      }
      &.warning {
        color: #f59e0b;
      }
      &.tint {
        color: #475569;
      }
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
  }
}
</style>
