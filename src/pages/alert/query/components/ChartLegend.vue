<template>
  <div class="legend-container custom-scrollbar">
    <table class="legend-table">
      <thead class="legend-thead">
        <tr>
          <th class="legend-th">Metric Series</th>
          <th class="legend-th right">Last Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        <tr
          v-for="(item, index) in series"
          :key="index"
          @click="$emit('toggle', index)"
          class="hover:bg-blue-50/50 transition-colors group cursor-pointer"
          :class="{ 'opacity-40': !item.visible }"
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
/* Legend */
.legend-container {
  height: 12rem;
  margin-top: 0.5rem;
  overflow-y: auto;
  border: 1px solid #f3f4f6;
  border-radius: 0.375rem;
  background-color: white;
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

  tr:hover & {
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

/* Custom Scrollbar for Legend */
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
