<template>
  <div class="toolbar-container">
    <div class="toolbar-left">
      <div class="control-group datasource-group">
        <label class="control-label">
          <el-icon class="label-icon"><DataLine /></el-icon>
          <span>数据源</span>
        </label>
        <el-select v-model="datasourceId" placeholder="选择数据源" class="datasource-select" size="default" filterable>
          <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
        </el-select>
      </div>

      <!-- 时间范围选择 -->
      <div class="control-group time-group">
        <label class="control-label">
          <el-icon class="label-icon"><Calendar /></el-icon>
          <span>时间范围</span>
        </label>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :shortcuts="shortcuts"
          size="default"
          class="date-picker"
        />
      </div>
    </div>

    <div class="toolbar-right">
      <AuthButton
        size="default"
        class="action-btn"
        :capability="ALERT_CAPABILITIES.Explore.HistoryView"
        disable-mode
        @click="historyVisible = true"
      >
        <el-icon><Clock /></el-icon>
        <span>历史记录</span>
      </AuthButton>
      <AuthButton
        type="primary"
        size="default"
        class="action-btn"
        :capability="ALERT_CAPABILITIES.Explore.Metrics"
        disable-mode
        @click="$emit('run-query')"
      >
        <el-icon><Search /></el-icon>
        <span>查询</span>
      </AuthButton>
    </div>

    <QueryHistory v-model="historyVisible" @apply="handleApplyHistory" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Calendar, Search, Clock, DataLine } from "@element-plus/icons-vue"
import type { Datasource } from "@/api/alert/datasource/types/datasource"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import QueryHistory from "./QueryHistory.vue"
import type { QueryHistoryItem } from "../composables/useQueryHistory"

interface QueryToolbarProps {
  datasources: Datasource[]
}

defineProps<QueryToolbarProps>()

// NOTE: datasourceId 是 Select 组件的单一值状态，使用 defineModel 进行双向绑定
const datasourceId = defineModel<number | undefined>("datasourceId")

// NOTE: timeRange 是 DatePicker 组件的时间范围状态，语义明确，使用 defineModel 进行双向绑定
const timeRange = defineModel<[Date, Date] | null>("timeRange", { required: true })

const emits = defineEmits<{
  "run-query": []
  "apply-history": [item: QueryHistoryItem]
}>()

// 历史记录弹窗显示状态
const historyVisible = ref(false)

/**
 * 处理应用历史记录
 */
const handleApplyHistory = (item: QueryHistoryItem) => {
  emits("apply-history", item)
}

// 时间快捷选项
const shortcuts = [
  { text: "15m", value: () => [new Date(Date.now() - 15 * 60 * 1000), new Date()] },
  { text: "1h", value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
  { text: "6h", value: () => [new Date(Date.now() - 6 * 3600 * 1000), new Date()] },
  { text: "24h", value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] },
  { text: "7d", value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] }
]
</script>

<style lang="scss" scoped>
.toolbar-container {
  padding: 16px 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: #ffffff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.control-group {
  display: flex;
  align-items: stretch;
  gap: 0;
  height: 36px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &:focus-within {
    border-color: #cbd5e1;
  }

  &:focus-within {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.control-group :deep(.el-select__wrapper),
.control-group :deep(.el-date-editor) {
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.control-group :deep(.el-select__wrapper.is-focus),
.control-group :deep(.el-date-editor.is-active) {
  background: transparent !important;
  box-shadow: none !important;
}

.datasource-group {
  flex-shrink: 0;
}

.time-group {
  flex: 1;
  min-width: 0;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  user-select: none;
  height: 100%;
  padding: 0 0.75rem;
  background-color: #f9fafb;
  flex-shrink: 0;
  border-radius: 6px 0 0 6px;
}

.label-icon {
  font-size: 14px;
  color: #9ca3af;
}

.datasource-select {
  width: 11rem;
  min-width: 9rem;
  flex: 1;
}

.date-picker {
  flex: 1;
  min-width: 20rem;
  max-width: 28rem;
  height: 100%;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  height: 36px;
  font-weight: 500;
}
</style>
