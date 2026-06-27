<template>
  <div class="legend-container custom-scrollbar">
    <table class="legend-table">
      <thead class="legend-thead">
        <tr>
          <th class="legend-th">指标序列</th>
          <th class="legend-th right">最新值</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in series"
          :key="index"
          class="legend-row"
          :class="{ 'is-hidden': !item.visible }"
          @click="$emit('toggle', index)"
        >
          <td class="legend-td-name">
            <span class="legend-color-dot" :style="{ backgroundColor: item.color }" />
            <div class="legend-metric-name">
              {{ item.name }}
            </div>
          </td>
          <td class="legend-td-value">
            {{ formatValue(item.lastValue) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface ChartLegendProps {
  series: any[]
}

defineProps<ChartLegendProps>()

defineEmits<{
  toggle: [index: number]
}>()

/**
 * 格式化数值
 */
const formatValue = (val: any) => {
  if (val === null || val === undefined) return "-"
  return parseFloat(val).toFixed(5)
}
</script>

<style lang="scss" scoped>
.legend-container {
  height: 12rem;
  margin-top: 0.5rem;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
}

.legend-table {
  width: 100%;
  font-size: 0.75rem;
}

.legend-thead {
  background-color: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.legend-row {
  cursor: pointer;
  transition: background-color 0.15s ease;

  & + .legend-row {
    border-top: 1px solid #f3f4f6;
  }

  &:hover {
    background: #f8fafc;
  }

  &.is-hidden {
    opacity: 0.45;
  }
}

.legend-th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #1f2937;

  &.right {
    text-align: right;
    width: 6rem;
  }
}

.legend-td-name {
  padding: 0.375rem 0.75rem;
  display: flex;
  align-items: start;
}

.legend-color-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  margin-top: 0.375rem;
  margin-right: 0.5rem;
}

.legend-metric-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #374151;
  word-break: break-all;
  line-height: 1.25;
  transition: color 0.15s;

  .legend-row:hover & {
    color: #2563eb;
  }
}

.legend-td-value {
  padding: 0.375rem 0.75rem;
  text-align: right;
  font-family: monospace;
  color: #111827;
  font-weight: 500;
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #d1d5db;
  }
}
</style>
