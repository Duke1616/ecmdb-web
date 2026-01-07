<template>
  <CustomDrawer
    v-model="visible"
    title="查询历史"
    subtitle="查看和管理历史查询记录"
    size="40%"
    direction="rtl"
    header-icon="Clock"
    confirm-button-text="清空所有"
    confirm-button-type="danger"
    :show-confirm-button="historyList.length > 0"
    :show-footer="true"
    @cancel="visible = false"
    @confirm="handleClearAll"
  >
    <!-- 历史记录列表 -->
    <div class="history-container" v-loading="loading">
      <div v-if="historyList.length > 0" class="history-list">
        <div v-for="item in historyList" :key="item.timestamp" class="history-item">
          <div class="history-content">
            <!-- 查询语句 -->
            <div class="query-text">
              <el-icon class="query-icon"><TrendCharts /></el-icon>
              <el-tooltip :content="item.query" placement="top-start">
                <span class="query-code">{{ item.query }}</span>
              </el-tooltip>
            </div>

            <!-- 元信息 -->
            <div class="meta-info">
              <span class="meta-item">
                <el-icon><DataLine /></el-icon>
                {{ item.datasourceName }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatTime(item.timestamp) }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatTimeRange(item.time_range) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="history-actions">
            <el-button type="primary" size="small" @click="handleApply(item)"> 应用 </el-button>
            <el-button type="danger" size="small" plain @click="handleDelete(item.timestamp)"> 删除 </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无查询历史" :image-size="120" />
    </div>
  </CustomDrawer>
</template>

<script setup lang="ts">
import { watch } from "vue"
import { ElMessageBox } from "element-plus"
import { TrendCharts, DataLine, Clock, Calendar } from "@element-plus/icons-vue"
import CustomDrawer from "@@/components/Dialogs/Drawer/index.vue"
import { useQueryHistory, type QueryHistoryItem } from "../composables/useQueryHistory"

// NOTE: visible 是 Dialog 的显示状态，使用 defineModel 进行双向绑定
const visible = defineModel<boolean>({ required: true })

const emits = defineEmits<{
  apply: [item: QueryHistoryItem]
}>()

const { historyList, loading, fetchHistory, removeHistory, clearHistory } = useQueryHistory()

// 监听 visible 变化，打开时加载历史记录
watch(visible, (newVal) => {
  if (newVal) {
    fetchHistory()
  }
})

/**
 * 格式化时间戳
 */
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 1分钟内
  if (diff < 60 * 1000) {
    return "刚刚"
  }
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
  }
  // 其他
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * 格式化时间范围
 */
const formatTimeRange = (timeRange: { start: number; end: number } | null | undefined) => {
  // NOTE: API 返回的数据可能包含空的 time_range 字段，需要进行防御性检查
  if (!timeRange) {
    return "N/A"
  }

  const format = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return `${format(timeRange.start)} - ${format(timeRange.end)}`
}

/**
 * 应用历史记录
 */
const handleApply = (item: QueryHistoryItem) => {
  // 转换时间戳为 Date 对象
  const timeRange: [Date, Date] = [new Date(item.time_range.start), new Date(item.time_range.end)]

  emits("apply", {
    ...item,
    timeRange
  } as any)
  visible.value = false
}

/**
 * 删除历史记录
 */
const handleDelete = (timestamp: number) => {
  removeHistory(timestamp)
}

/**
 * 清空所有历史记录
 */
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有查询历史吗？此操作不可恢复。", "确认清空", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    clearHistory()
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.history-container {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
}

.history-content {
  flex: 1;
  min-width: 0;
  margin-right: 1rem;
}

.query-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.query-icon {
  color: #3b82f6;
  font-size: 16px;
  flex-shrink: 0;
}

.query-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 12px;
  color: #6b7280;

  .el-icon {
    font-size: 14px;
  }
}

.history-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
