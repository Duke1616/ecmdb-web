<script setup lang="ts">
/**
 * StatusBadge 状态圆点徽章组件
 * 职责：渲染高阶分布式监控级别的状态点与文本，取代过宽的药丸 Tag，保持列表界面的轻量化与高可读性
 */
export type StatusBadgeType = "success" | "primary" | "info" | "warning" | "danger"

interface Props {
  type: StatusBadgeType
  label?: string
}

withDefaults(defineProps<Props>(), {
  type: "info",
  label: ""
})
</script>

<template>
  <div class="status-badge" :class="type">
    <span class="dot" />
    <span class="text">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  vertical-align: middle;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .text {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &.success {
    .dot {
      background: #10b981;
    }
    .text {
      color: #059669;
    }
  }

  &.primary {
    .dot {
      background: #3b82f6;
    }
    .text {
      color: #2563eb;
    }
  }

  &.danger {
    .dot {
      background: #ef4444;
    }
    .text {
      color: #dc2626;
    }
  }

  &.warning {
    .dot {
      background: #f59e0b;
    }
    .text {
      color: #d97706;
    }
  }

  &.info {
    .dot {
      background: #94a3b8;
    }
    .text {
      color: #475569;
    }
  }
}
</style>
