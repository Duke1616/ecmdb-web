<template>
  <div class="toolbar-container">
    <!-- 左侧控制组 -->
    <div class="toolbar-left">
      <!-- 数据源选择 -->
      <div class="control-group datasource-group">
        <label class="control-label">
          <el-icon class="label-icon"><DataLine /></el-icon>
          <span>数据源</span>
        </label>
        <el-select
          :model-value="datasourceId"
          placeholder="选择数据源"
          class="datasource-select"
          size="default"
          filterable
          @update:model-value="$emit('update:datasourceId', $event)"
        >
          <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
        </el-select>
      </div>

      <!-- 时间范围选择 -->
      <div class="control-group time-group">
        <label class="control-label">
          <el-icon class="label-icon"><Calendar /></el-icon>
          <span>时间范围</span>
        </label>
        <div class="time-controls">
          <el-date-picker
            :model-value="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :shortcuts="shortcuts"
            size="default"
            class="date-picker"
            @update:model-value="$emit('update:timeRange', $event)"
          />
          <el-tooltip content="自动刷新 (即将推出)" placement="top">
            <el-button circle size="small" class="refresh-btn">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 右侧操作按钮 -->
    <div class="toolbar-right">
      <el-button size="default" class="action-btn">
        <el-icon><Clock /></el-icon>
        <span>历史记录</span>
      </el-button>
      <el-button type="primary" size="default" class="action-btn primary-btn" @click="$emit('run-query')">
        <el-icon><Search /></el-icon>
        <span>查询</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Search, Clock, Refresh, DataLine } from "@element-plus/icons-vue"
import type { Datasource } from "@/api/alert/datasource/types/datasource"

interface QueryToolbarProps {
  datasourceId?: number
  datasources: Datasource[]
  timeRange: [Date, Date] | null
}

defineProps<QueryToolbarProps>()

defineEmits<{
  "update:datasourceId": [id: number]
  "update:timeRange": [range: [Date, Date]]
  "run-query": []
}>()

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
  padding: 1.25rem 1rem 0 1rem; // 底部 padding 设为 0
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: white; // 移除渐变，统一为纯白背景，与 QueryGroup 的白色背景融合（或者保持渐变但要连接）
  // 保持渐变可能更好看，但 border-bottom 必须去掉
  background: linear-gradient(to bottom, #fafbfc, #ffffff);
  border-bottom: none; // 移除分割线
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

// 控件组样式
.control-group {
  display: flex;
  align-items: stretch;
  gap: 0;
  height: 32px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px; // ✅ 只留这里
  overflow: hidden; // ✅ 非常关键
}

/* 🔥 核心：拍平所有中间控件的"根节点圆角" */
.control-group :deep(.el-select__wrapper),
.control-group :deep(.el-date-editor) {
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* 移除 focus 状态的所有视觉变化 */
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

// 标签样式
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
  // 左侧圆角与外部保持一致
  border-radius: 6px 0 0 6px;
}

.label-icon {
  font-size: 14px;
  color: #9ca3af;
}

// 数据源选择器
.datasource-select {
  width: 11rem;
  min-width: 9rem;
  flex: 1;
}

// 时间控件
.time-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  height: 100%;
  padding-right: 0.5rem; // 右侧留出间距给刷新按钮
}

.date-picker {
  flex: 1;
  min-width: 16rem;
  max-width: 24rem;
  height: 100%;
}

.refresh-btn {
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  min-height: 24px;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }

  :deep(i) {
    font-size: 12px;
  }
}

// 右侧按钮组
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;

  &:not(.primary-btn) {
    border: 1px solid #e5e7eb;

    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }
  }
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
