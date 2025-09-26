<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="历史告警" subtitle="查看和管理历史告警记录" @refresh="loadAlerts">
      <template #actions>
        <el-select v-model="alertFilter" placeholder="筛选状态" style="width: 120px; margin-right: 12px">
          <el-option label="全部" value="all" />
          <el-option label="已解决" value="resolved" />
          <el-option label="已忽略" value="ignored" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 300px; margin-right: 12px"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch"> 查询 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="filteredAlerts"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="tableProps"
      v-loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 告警标题插槽 -->
      <template #title="{ row }">
        <div class="alert-title-cell">
          <h4 class="title-text">{{ getAlertTitle(row) }}</h4>
        </div>
      </template>

      <!-- 告警等级插槽 -->
      <template #level="{ row }">
        <div class="level-cell">
          <el-tag :type="getSeverityType(row.level)" size="small">
            {{ getSeverityLabel(row.level) }}
          </el-tag>
        </div>
      </template>

      <!-- 数据源插槽 -->
      <template #dataSource="{ row }">
        <div class="data-source-cell">
          <div class="source-name">{{ row.data_source.name }}</div>
          <div class="source-type">{{ row.data_source.type }}</div>
        </div>
      </template>

      <!-- 触发时间插槽 -->
      <template #triggerTime="{ row }">
        <div class="time-cell">
          <div class="time-value">{{ formatTimestamp(row.trigger_time) }}</div>
          <div class="duration">{{ formatDuration(row.duration) }}</div>
        </div>
      </template>

      <!-- 标签插槽 -->
      <template #labels="{ row }">
        <div class="labels-cell">
          <template v-if="row.labels && Object.keys(row.labels).length > 0">
            <el-tooltip
              v-for="key in Object.keys(row.labels).slice(0, 3)"
              :key="key"
              :content="`${key}: ${row.labels[key]}`"
              placement="top"
              effect="dark"
            >
              <el-tag size="small" type="info" effect="plain" class="label-tag">
                {{ key }}: {{ row.labels[key] }}
              </el-tag>
            </el-tooltip>
            <el-tooltip
              v-if="Object.keys(row.labels).length > 3"
              :content="getRemainingLabelsTooltip(row.labels)"
              placement="top"
              effect="dark"
            >
              <el-tag size="small" type="info" effect="plain"> +{{ Object.keys(row.labels).length - 3 }} </el-tag>
            </el-tooltip>
          </template>
          <span v-else class="no-labels">无标签</span>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { ElMessage } from "element-plus"
import { Search } from "@element-plus/icons-vue"
import { listHistoryAlertsApi } from "@/api/alert"
import type { Alert } from "@/api/alert/types"
import { usePagination } from "@/common/composables/usePagination"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 响应式数据
const alerts = ref<Alert[]>([])
const loading = ref(false)
const alertFilter = ref("all")
const dateRange = ref<[string, string] | null>(null)

// 表格列配置
const tableColumns = [
  {
    prop: "title",
    label: "告警信息",
    minWidth: 200,
    slot: "title"
  },
  {
    prop: "level",
    label: "等级",
    width: 100,
    slot: "level"
  },
  {
    prop: "dataSource",
    label: "数据源",
    minWidth: 150,
    slot: "dataSource"
  },
  {
    prop: "triggerTime",
    label: "触发时间",
    minWidth: 180,
    slot: "triggerTime"
  },
  {
    prop: "labels",
    label: "标签",
    minWidth: 200,
    slot: "labels"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)"
}

// 过滤后的告警数据
const filteredAlerts = computed(() => {
  if (alertFilter.value === "all") {
    return alerts.value
  }
  return alerts.value.filter((alert) => alert.status === alertFilter.value)
})

// 加载历史告警数据
const loadAlerts = async () => {
  try {
    loading.value = true
    const response = await listHistoryAlertsApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    alerts.value = response.data.alerts || []
    paginationData.total = response.data.total || 0
  } catch (error) {
    alerts.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

// 获取告警标题
const getAlertTitle = (alert: Alert) => {
  return `告警 #${alert.id}`
}

// 获取严重程度标签类型
const getSeverityType = (level: number): "primary" | "success" | "warning" | "info" | "danger" => {
  const types: Record<number, "primary" | "success" | "warning" | "info" | "danger"> = {
    1: "danger", // P0
    2: "warning", // P1
    3: "warning", // P2
    4: "info", // P3
    5: "info" // P4
  }
  return types[level] || "info"
}

// 获取严重程度标签文本
const getSeverityLabel = (level: number) => {
  const labels: Record<number, string> = {
    1: "P0",
    2: "P1",
    3: "P2",
    4: "P3",
    5: "P4"
  }
  return labels[level] || "P4"
}

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟`
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  } else {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}天${hours}小时`
  }
}

// 获取剩余标签的 tooltip 内容
const getRemainingLabelsTooltip = (labels: Record<string, string>) => {
  const allKeys = Object.keys(labels)
  const remainingKeys = allKeys.slice(3)
  return remainingKeys.map((key) => `${key}: ${labels[key]}`).join("\n")
}

// 获取操作按钮配置
const getOperateItems = (alert: Alert) => {
  console.log(alert)
  return [
    { name: "查看", code: "view", type: "primary" },
    { name: "重新触发", code: "retrigger", type: "warning" }
  ]
}

// 操作事件处理
const operateEvent = (alert: Alert, action: string) => {
  switch (action) {
    case "view":
      ElMessage.info(`查看告警: ${alert.id}`)
      break
    case "retrigger":
      ElMessage.info(`重新触发告警: ${alert.id}`)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  // 可以在这里添加日期范围变化的逻辑
  console.log("日期范围变化:", dateRange.value)
}

// 处理搜索
const handleSearch = () => {
  loadAlerts()
}

// 监听分页变化
watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => {
    loadAlerts()
  }
)

// 监听筛选条件变化
watch(alertFilter, () => {
  // 筛选条件变化时不需要重新加载数据，computed 会自动处理
})

// 初始化加载数据
loadAlerts()
</script>

<style lang="scss" scoped>
// 告警标题样式
.alert-title-cell {
  .title-text {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }
}

// 等级样式
.level-cell {
  display: flex;
  align-items: center;
}

// 数据源样式
.data-source-cell {
  .source-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .source-type {
    font-size: 12px;
    color: #6b7280;
  }
}

// 时间样式
.time-cell {
  .time-value {
    font-size: 14px;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .duration {
    font-size: 12px;
    color: #6b7280;
  }
}

// 标签样式
.labels-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .label-tag {
    margin: 0;
  }

  .no-labels {
    font-size: 12px;
    color: #9ca3af;
    font-style: italic;
  }
}
</style>
