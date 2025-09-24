<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="告警管理" subtitle="管理工作空间告警信息" @refresh="loadAlerts">
      <template #actions>
        <el-select v-model="alertFilter" placeholder="筛选状态" style="width: 120px; margin-right: 12px">
          <el-option label="全部" value="all" />
          <el-option label="活跃" value="firing" />
          <el-option label="已解决" value="resolved" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="handleCreateAlert"> 新建告警 </el-button>
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
import { ref, watch, computed } from "vue"
import { ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { listCurrentAlertsByWorkspaceApi } from "@/api/alert"
import type { Alert, ListAlertsByWorkspaceReq } from "@/api/alert/types"
import { formatTimestamp } from "@/common/utils/day"
import { usePagination } from "@/common/composables/usePagination"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import { View, Check, Close } from "@element-plus/icons-vue"

const props = defineProps<{
  workspaceId: number
}>()

// 使用分页 composable
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 数据
const alerts = ref<Alert[]>([])
const loading = ref(false)
const alertFilter = ref("all")

// 表格列配置
const tableColumns = [
  {
    prop: "level",
    label: "等级",
    width: 100,
    slot: "level"
  },
  {
    prop: "data_source",
    label: "数据源",
    width: 150,
    slot: "dataSource"
  },
  {
    prop: "trigger_time",
    label: "触发时间",
    width: 180,
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
  stripe: true,
  height: "calc(100vh - 300px)"
}

// 计算属性：过滤后的告警列表
const filteredAlerts = computed(() => {
  if (alertFilter.value === "all") {
    return alerts.value
  }
  return alerts.value.filter((alert) => alert.status === alertFilter.value)
})

// 加载告警列表
const loadAlerts = async () => {
  if (!props.workspaceId) return

  try {
    loading.value = true
    const params: ListAlertsByWorkspaceReq = {
      workspace_id: props.workspaceId,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    const response = await listCurrentAlertsByWorkspaceApi(params)
    alerts.value = response.data.alerts || []
    paginationData.total = response.data.total || 0
  } catch (error) {
    console.error("加载告警列表失败:", error)
    ElMessage.error("加载告警列表失败")
  } finally {
    loading.value = false
  }
}

// 获取告警标题
const getAlertTitle = (alert: Alert) => {
  // 优先使用 labels 中的 alertname，否则使用数据源名称
  return alert.labels.alertname || alert.data_source.name || `告警-${alert.id}`
}

// 获取严重级别标签
const getSeverityLabel = (level: number) => {
  const labels = {
    1: "P0",
    2: "P1",
    3: "P2",
    4: "P3",
    5: "P4"
  }
  return labels[level as keyof typeof labels] || "P3"
}

// 获取严重级别类型
const getSeverityType = (level: number): "primary" | "success" | "warning" | "info" | "danger" => {
  const types: Record<number, "primary" | "success" | "warning" | "info" | "danger"> = {
    1: "danger", // P0
    2: "danger", // P1
    3: "warning", // P2
    4: "info", // P3
    5: "info" // P4
  }
  return types[level] || "info"
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

// 监听分页变化
watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => {
    loadAlerts()
  },
  { deep: true }
)

// 获取操作按钮配置
const getOperateItems = (row: Alert) => {
  const items = [
    {
      name: "查看",
      code: "view",
      icon: View,
      type: "primary"
    }
  ]

  // 只有活跃状态的告警才显示解决和忽略按钮
  if (row.status === "firing") {
    items.push(
      {
        name: "解决",
        code: "resolve",
        icon: Check,
        type: "success"
      },
      {
        name: "忽略",
        code: "ignore",
        icon: Close,
        type: "warning"
      }
    )
  }

  return items
}

// OperateBtn 操作事件处理
const operateEvent = (data: Alert, code: string) => {
  switch (code) {
    case "view":
      handleViewAlert(data)
      break
    case "resolve":
      handleResolveAlert(data)
      break
    case "ignore":
      handleIgnoreAlert(data)
      break
  }
}

// 操作处理
const handleCreateAlert = () => {
  ElMessage.info("创建告警功能待实现")
}

const handleViewAlert = (alert: Alert) => {
  ElMessage.info(`查看告警: ${getAlertTitle(alert)}`)
}

const handleResolveAlert = (alert: Alert) => {
  ElMessage.success(`告警已解决: ${getAlertTitle(alert)}`)
  // 这里应该调用解决告警的API
  loadAlerts() // 重新加载列表
}

const handleIgnoreAlert = (alert: Alert) => {
  ElMessage.warning(`告警已忽略: ${getAlertTitle(alert)}`)
  // 这里应该调用忽略告警的API
  loadAlerts() // 重新加载列表
}

// 监听工作空间ID变化
watch(
  () => props.workspaceId,
  () => {
    if (props.workspaceId) {
      loadAlerts()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
// 覆盖 PageContainer 样式
.page-container {
  padding: 0px !important;
  background: transparent !important;
  width: 100%;
  height: 100%;
}

// 表格单元格样式
.alert-title-cell {
  .title-text {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }

  .title-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
}

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

.labels-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .label-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .no-labels {
    font-size: 12px;
    color: #9ca3af;
    font-style: italic;
  }
}
</style>
