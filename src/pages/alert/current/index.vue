<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="当前告警" subtitle="查看和管理当前活跃的告警" @refresh="loadAlerts">
      <template #actions>
        <el-select v-model="alertFilter" placeholder="筛选状态" style="width: 120px; margin-right: 12px">
          <el-option label="全部" value="all" />
          <el-option label="活跃" value="firing" />
          <el-option label="已解决" value="resolved" />
        </el-select>
        <el-select v-model="levelFilter" placeholder="筛选等级" style="width: 120px; margin-right: 12px">
          <el-option label="全部等级" value="all" />
          <el-option label="P0" value="1" />
          <el-option label="P1" value="2" />
          <el-option label="P2" value="3" />
          <el-option label="P3" value="4" />
          <el-option label="P4" value="5" />
        </el-select>
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
      <!-- 告警等级条插槽 -->
      <template #severityBar="{ row }">
        <div class="severity-bar" :class="getSeverityClass(row.level)"></div>
      </template>

      <!-- 监控类型插槽 -->
      <template #monitorType="{ row }">
        <div class="common-text">{{ row.data_source.type || "Metric" }}</div>
      </template>

      <!-- 数据源插槽 -->
      <template #dataSource="{ row }">
        <div class="common-text">{{ row.data_source.name }}</div>
      </template>

      <!-- 规则标题 & 事件标签插槽 -->
      <template #ruleInfo="{ row }">
        <div class="rule-info-cell">
          <div class="rule-title" @click="handleViewAlert(row)">
            {{ row.rule_name }}
          </div>
          <div class="tags-container">
            <template v-if="row.labels && Object.keys(row.labels).length > 0">
              <span v-for="(value, key) in row.labels" :key="key" class="tag-item">
                {{ key }}={{ value }}
              </span>
            </template>
            <span v-else class="no-labels">无标签</span>
          </div>
        </div>
      </template>

      <!-- 触发时间插槽 -->
      <template #triggerTime="{ row }">
        <div class="time-cell">
          <div class="time-value">{{ formatTimestamp(row.trigger_time) }}</div>
          <div class="duration">持续 {{ formatDuration(row.duration) }}</div>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="3" @route-event="operateEvent" />
      </template>
    </DataTable>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { ElMessage } from "element-plus"
import { Search } from "@element-plus/icons-vue"
import { listCurrentAlertsApi } from "@/api/alert"
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
const levelFilter = ref("all")

// 表格列配置
const tableColumns = [
  {
    prop: "severity",
    label: "",
    width: 10, // Match the history page strict width
    slot: "severityBar",
    fixed: "left" as const,
    align: "center" as const
  },
  {
    prop: "monitorType",
    label: "监控类型",
    width: 160,
    slot: "monitorType"
  },
  {
    prop: "dataSource",
    label: "数据源",
    width: 150,
    slot: "dataSource"
  },
  {
    prop: "ruleInfo",
    label: "规则标题 & 事件标签",
    minWidth: 400,
    slot: "ruleInfo"
  },
  {
    prop: "triggerTime",
    label: "触发时间",
    width: 200,
    slot: "triggerTime"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)",
  rowClassName: "alert-row"
}

// 过滤后的告警数据
const filteredAlerts = computed(() => {
  let filtered = alerts.value

  // 按状态筛选
  if (alertFilter.value !== "all") {
    filtered = filtered.filter((alert) => alert.status === alertFilter.value)
  }

  // 按等级筛选
  if (levelFilter.value !== "all") {
    filtered = filtered.filter((alert) => alert.level === parseInt(levelFilter.value))
  }

  return filtered
})

// 加载当前告警数据
const loadAlerts = async () => {
  try {
    loading.value = true
    const response = await listCurrentAlertsApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    alerts.value = response.data.alerts || []
    paginationData.total = response.data.total || 0
  } catch (error) {
    console.error("加载当前告警失败:", error)
    alerts.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

// 获取严重程度样式类
const getSeverityClass = (level: number) => {
  const map: Record<number, string> = {
    1: "severity-p0",
    2: "severity-p1",
    3: "severity-p2",
    4: "severity-p3",
    5: "severity-p4"
  }
  return map[level] || "severity-p4"
}

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  // Input is milliseconds, direct usage
  const date = new Date(timestamp)
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

// 获取操作按钮配置
const getOperateItems = (alert: Alert) => {
  return [
    { name: "解决", code: "resolve", type: "success" },
    { name: "静默", code: "silence", type: "warning" }
  ]
}

// 操作事件处理
const operateEvent = (alert: Alert, action: string) => {
  switch (action) {
    case "view":
      handleViewAlert(alert)
      break
    case "resolve":
      ElMessage.success(`解决告警: ${alert.id}`)
      break
    case "silence":
      ElMessage.warning(`静默告警: ${alert.id}`)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 查看告警详情
const handleViewAlert = (alert: Alert) => {
  ElMessage.info(`查看告警详情: ${alert.id}`)
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
watch([alertFilter, levelFilter], () => {
  // 筛选条件变化时不需要重新加载数据，computed 会自动处理
})

// 初始化加载数据
loadAlerts()
</script>

<style lang="scss" scoped>
.severity-bar {
  position: absolute;
  top: 0;
  bottom: -1px;
  left: 0;
  right: 0; 
  width: 100%;
  z-index: 1; 

  &.severity-p0 { background-color: #f56c6c; }
  &.severity-p1 { background-color: #fa8c16; }
  &.severity-p2 { background-color: #e6a23c; }
  &.severity-p3 { background-color: #409eff; }
  &.severity-p4 { background-color: #909399; }
}

.common-text {
  font-size: 14px;
  color: #303133;
}

.rule-info-cell {
  padding: 8px 0;

  .rule-title {
    font-size: 15px;
    font-weight: 500;
    color: #6c5ce7; 
    cursor: pointer;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    
    &:hover {
      text-decoration: underline;
    }

    .cluster-tag {
      margin-left: 8px;
      font-size: 12px;
      background: #f0f2f5;
      padding: 1px 6px;
      border-radius: 4px;
      color: #606266;
      font-weight: normal;
      text-decoration: none;
    }
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .tag-item {
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      color: #606266;
      font-family: monospace; 
      line-height: 1.4;
    }

    .no-labels {
      font-size: 12px;
      color: #909399;
      font-style: italic;
    }
  }
}

.time-cell {
  .time-value {
    font-size: 14px;
    color: #303133;
    line-height: 1.4;
  }
  
  .duration {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

</style>
