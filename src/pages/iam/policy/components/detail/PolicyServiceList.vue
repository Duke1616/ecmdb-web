<script setup lang="ts">
import type { ServiceSummary } from "@/api/iam/policy/type"
import PremiumList from "@/common/components/PremiumList/index.vue"

interface Props {
  services: ServiceSummary[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: "drillDown", service: ServiceSummary): void
}>()

/**
 * 计算权限覆盖率颜色
 */
const getProgressColor = (percent: number) => {
  if (percent === 100) return "#10b981"
  if (percent > 50) return "#6366f1"
  return "#94a3b8"
}

/**
 * 格式化治理等级显示 (本地化)
 */
const formatLevel = (level: string) => {
  const l = (level || "").toUpperCase()
  if (l === "ALL") return "全部"
  if (l === "PARTIAL") return "部分"
  return l || "无"
}

/**
 * 格式化资源范围显示
 */
const formatResource = (res: string) => {
  if (res === "*") return "所有资源"
  if ((res || "").toUpperCase() === "SPECIFIC") return "特定资源"
  return res
}

/**
 * 格式化效力显示
 */
const formatEffect = (effect: string) => {
  const e = (effect || "").toUpperCase()
  if (e === "ALLOW") return "允许"
  if (e === "DENY") return "拒绝"
  return e
}
</script>

<template>
  <div class="policy-service-list">
    <PremiumList :data="services" hide-header hide-pagination show-selection disabled indicator-color="#3b82f6">
      <!-- 表头定义：统一字体样式 -->
      <template #column-header>
        <div class="svc-cols header-label-font">
          <span>目标子系统</span>
          <span>策略属性</span>
          <span>访问级别</span>
          <span>权限覆盖</span>
          <span>目标资源</span>
          <span>生效条件</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="svc-grid-row">
          <!-- 1. 目标子系统 -->
          <div class="cell-service">
            <div class="asset-identity link" @click="emit('drillDown', row)">
              <div class="asset-info">
                <div class="name">{{ row.service_name }}</div>
                <div class="code-tag">{{ row.service_code }}</div>
              </div>
            </div>
          </div>

          <!-- 2. 策略属性 (Effect) -->
          <div class="cell-effect">
            <span class="effect-tag" :class="row.effect?.toLowerCase()">
              {{ formatEffect(row.effect) }}
            </span>
          </div>

          <!-- 2. 治理等级 -->
          <div class="cell-level">
            <div class="risk-indicator" :class="row.level.toLowerCase()">
              <span class="dot" />
              <span class="label">{{ formatLevel(row.level) }}</span>
            </div>
          </div>

          <!-- 3. 授权覆盖进度 -->
          <div class="cell-coverage">
            <div class="governance-gauge">
              <div class="gauge-bar">
                <el-progress
                  :percentage="(row.granted_count / row.total_count) * 100"
                  :show-text="false"
                  :stroke-width="5"
                  :color="getProgressColor((row.granted_count / row.total_count) * 100)"
                />
              </div>
              <div class="gauge-stats">
                <span class="current">{{ row.granted_count }}</span>
                <span class="separator">/</span>
                <span class="total">{{ row.total_count }}</span>
              </div>
            </div>
          </div>

          <!-- 4. 目标资源 -->
          <div class="cell-scope">
            <div class="scope-fragment" :class="{ global: row.resource_scope === '*' }">
              <code>{{ formatResource(row.resource_scope) }}</code>
            </div>
          </div>

          <!-- 5. 额外约束条件 -->
          <div class="cell-condition">
            <div class="governance-snippet" :class="{ empty: row.condition === '-' }">
              <code>{{ row.condition === "-" ? "无限制条件" : row.condition }}</code>
            </div>
          </div>
        </div>
      </template>
    </PremiumList>
  </div>
</template>

<style lang="scss" scoped>
.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.svc-cols {
  display: grid;
  grid-template-columns: 200px 80px 100px 1.4fr 0.8fr 1.2fr;
  gap: 20px;
  width: 100%;
  align-items: center;
}

.svc-grid-row {
  display: grid;
  grid-template-columns: 200px 80px 100px 1.4fr 0.8fr 1.2fr;
  align-items: center;
  gap: 20px;
  min-height: 68px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #f8fafc;
  }
}

.asset-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  &.link {
    cursor: pointer;
    &:hover .name {
      color: #3b82f6;
    }
  }

  .asset-info {
    .name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .code-tag {
      font-size: 11px;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
  }
}

.risk-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 10px;
  border-radius: 99px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
  }
  .label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
  }

  &.all {
    background: #f0fdf4;
    border-color: #bbf7d0;
    .dot {
      background: #10b981;
    }
    .label {
      color: #15803d;
    }
  }
  &.partial {
    background: #fffbeb;
    border-color: #fed7aa;
    .dot {
      background: #f59e0b;
    }
    .label {
      color: #b45309;
    }
  }
}

.effect-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;

  &.allow {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.deny {
    background: #fef2f2;
    color: #dc2626;
  }
}

.governance-gauge {
  display: flex;
  align-items: center;
  gap: 16px;
  .gauge-bar {
    flex: 1;
    max-width: 160px;
  }
  .gauge-stats {
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
    .separator,
    .total {
      color: #64748b;
      font-weight: 400;
    }
  }
}

.scope-fragment {
  code {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: #475569;
    padding: 2px 6px;
    background: #f1f5f9;
    border-radius: 4px;
  }
  &.global code {
    background: #eef2ff;
    color: #6366f1;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
}

.governance-snippet {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  display: inline-flex;
  min-width: 60px;

  code {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: #475569;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &.empty {
    background: transparent;
    border: none;
    padding-left: 0;
    code {
      color: #94a3b8;
      font-style: italic;
      font-weight: 400;
      &::before {
        content: "•";
        margin-right: 6px;
        color: #e2e8f0;
      }
    }
  }
}
</style>
