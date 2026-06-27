<template>
  <div class="alert-page">
    <div class="alert-filter-panel">
      <div class="alert-filter-toolbar" :class="{ 'is-history': isHistory }">
        <div class="filter-control search-control">
          <label class="control-label">
            <el-icon><Search /></el-icon>
            <span>检索</span>
          </label>
          <el-input v-model="filterForm.keyword" placeholder="规则、数据源、标签" class="filter-input" clearable />
        </div>

        <div class="filter-control datasource-control">
          <label class="control-label">
            <el-icon><DataLine /></el-icon>
            <span>数据源</span>
          </label>
          <el-select v-model="filterForm.datasourceId" placeholder="数据源" class="filter-select is-datasource">
            <el-option label="全部数据源" value="all" />
            <el-option v-for="item in datasourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div class="filter-control level-control">
          <label class="control-label">等级</label>
          <el-select v-model="filterForm.level" placeholder="告警等级" class="filter-select is-level">
            <el-option label="全部等级" value="all" />
            <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div v-if="isHistory" class="filter-control time-control">
          <label class="control-label">
            <el-icon><Calendar /></el-icon>
            <span>时间范围</span>
          </label>
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="filter-range"
          />
        </div>
      </div>
    </div>

    <div class="alert-list-shell">
      <DataTable
        :data="alerts"
        :columns="tableColumns"
        :loading="loading"
        :show-selection="false"
        :show-pagination="true"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        :page-sizes="paginationData.pageSizes"
        :pagination-layout="paginationData.layout"
        :table-props="{ rowClassName: 'alert-row' }"
        class="alert-table"
        action-column-width="96"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
        <template #level="{ row }">
          <div class="level-cell">
            <span class="level-dot" :class="getLevelClass(row.level)" />
            <el-tag :type="getLevelTagType(row.level)" effect="light">{{ getLevelText(row.level) }}</el-tag>
          </div>
        </template>

        <template #rule="{ row }">
          <div class="rule-cell">
            <button class="rule-title" type="button" @click="openDetail(row)">
              {{ row.rule_name || "-" }}
            </button>
            <div class="label-preview">
              <template v-if="getLabelEntries(row).length">
                <span v-for="[key, value] in getLabelEntries(row).slice(0, 3)" :key="key" class="label-chip">
                  {{ key }}={{ value }}
                </span>
                <span v-if="getLabelEntries(row).length > 3" class="label-more">
                  +{{ getLabelEntries(row).length - 3 }}
                </span>
              </template>
              <span v-else class="muted-text">暂无标签</span>
            </div>
          </div>
        </template>

        <template #datasource="{ row }">
          <div class="source-cell">
            <img
              :src="getDatasourceTypeIcon(row.data_source?.type)"
              :alt="getDatasourceTypeName(row.data_source?.type)"
              class="source-icon"
            />
            <div class="source-meta">
              <span class="source-name">{{ row.data_source?.name || "-" }}</span>
              <span class="source-type">{{ getDatasourceTypeName(row.data_source?.type) }}</span>
            </div>
          </div>
        </template>

        <template #duration="{ row }">
          <div class="time-cell">
            <span>{{ formatDuration(row.duration) }}</span>
            <small>{{ isHistory ? "持续时长" : "已持续" }}</small>
          </div>
        </template>

        <template #triggerTime="{ row }">
          <div v-if="isHistory" class="time-range-cell">
            <span>{{ formatDateTime(row.trigger_time || row.first_trigger_time) }}</span>
            <em>-</em>
            <span>{{ formatDateTime(row.recover_time || row.last_eval_time) }}</span>
          </div>
          <div v-else class="time-cell">
            <span>{{ formatDateTime(row.trigger_time || row.first_trigger_time) }}</span>
            <small>触发时间</small>
          </div>
        </template>

        <template #actions="{ row }">
          <OperateBtn :items="operateItems" :operate-item="row" :max-length="1" @route-event="handleOperateEvent" />
        </template>

        <template #empty>
          <el-empty :description="emptyText" :image-size="120" />
        </template>
      </DataTable>
    </div>

    <Drawer
      v-model="detailVisible"
      title="告警详情"
      :subtitle="selectedAlert?.rule_name || ''"
      :header-icon="Bell"
      size="560px"
      :show-footer="false"
      class="alert-detail-drawer"
      @closed="selectedAlert = null"
    >
      <div v-if="selectedAlert" class="alert-detail">
        <div class="detail-head">
          <span class="level-dot is-large" :class="getLevelClass(selectedAlert.level)" />
          <div>
            <h3>{{ selectedAlert.rule_name || "-" }}</h3>
            <p>
              {{ selectedAlert.data_source?.name || "-" }} /
              {{ getDatasourceTypeName(selectedAlert.data_source?.type) }}
            </p>
          </div>
          <el-tag :type="getStatusTagType(selectedAlert.status)" effect="light">
            {{ getStatusText(selectedAlert.status) }}
          </el-tag>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span>告警等级</span>
            <strong>{{ getLevelText(selectedAlert.level) }}</strong>
          </div>
          <div class="detail-item">
            <span>持续时间</span>
            <strong>{{ formatDuration(selectedAlert.duration) }}</strong>
          </div>
          <div class="detail-item">
            <span>触发时间</span>
            <strong>{{ formatDateTime(selectedAlert.trigger_time || selectedAlert.first_trigger_time) }}</strong>
          </div>
          <div class="detail-item">
            <span>{{ selectedAlert.recover_time ? "恢复时间" : "检测时间" }}</span>
            <strong>{{ formatDateTime(selectedAlert.recover_time || selectedAlert.last_eval_time) }}</strong>
          </div>
        </div>

        <section class="detail-section">
          <h4>事件标签</h4>
          <div v-if="getLabelEntries(selectedAlert).length" class="detail-labels">
            <span v-for="[key, value] in getLabelEntries(selectedAlert)" :key="key" class="detail-label">
              <b>{{ key }}</b>
              <em>{{ value }}</em>
            </span>
          </div>
          <el-empty v-else description="暂无标签" :image-size="80" />
        </section>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { Bell, Calendar, DataLine, Search, View } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { debounce } from "lodash-es"
import { listCurrentAlertsApi, listHistoryAlertsApi } from "@/api/alert"
import { listDatasourceApi } from "@/api/alert/datasource"
import type { Alert, ListAlertsReq } from "@/api/alert/types"
import type { Datasource } from "@/api/alert/datasource/types/datasource"
import { usePagination } from "@/common/composables/usePagination"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { Drawer } from "@/common/components/Dialogs"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { getDatasourceTypeIcon, getDatasourceTypeName } from "@/pages/alert/utils/datasourceMeta"
import type { Column } from "@/common/components/DataTable/types"

type AlertPageMode = "current" | "history"
type FilterForm = {
  keyword: string
  datasourceId: string
  level: string
  timeRange: [Date, Date] | null
}

const props = defineProps<{
  mode: AlertPageMode
}>()

const isHistory = computed(() => props.mode === "history")
const emptyText = computed(() => (isHistory.value ? "暂无历史告警" : "暂无当前告警"))

const { paginationData } = usePagination()
const loading = ref(false)
const alerts = ref<Alert[]>([])
const datasources = ref<Datasource[]>([])
const detailVisible = ref(false)
const selectedAlert = ref<Alert | null>(null)
const filterForm = reactive<FilterForm>({
  keyword: "",
  datasourceId: "all",
  level: "all",
  timeRange: null
})

const levelOptions = [
  { label: "P0", value: "1" },
  { label: "P1", value: "2" },
  { label: "P2", value: "3" },
  { label: "P3", value: "4" },
  { label: "P4", value: "5" }
]

const datasourceOptions = computed(() => {
  return datasources.value.map((source) => ({
    value: String(source.id),
    label: source.name || `数据源 ${source.id}`
  }))
})

const tableColumns = computed<Column[]>(() => {
  const columns: Column[] = [
    { prop: "level", label: "等级", width: 112, slot: "level" },
    { prop: "rule", label: "规则与标签", minWidth: 420, slot: "rule", align: "left" },
    { prop: "datasource", label: "数据源", minWidth: 260, slot: "datasource", align: "left" },
    { prop: "duration", label: "持续时间", minWidth: 160, slot: "duration" },
    {
      prop: "triggerTime",
      label: isHistory.value ? "触发 / 恢复" : "触发时间",
      minWidth: isHistory.value ? 320 : 220,
      slot: "triggerTime"
    }
  ]

  return columns
})

const operateItems = computed(() => [
  {
    name: "详情",
    code: "detail",
    type: "primary",
    icon: View,
    capability: isHistory.value ? ALERT_CAPABILITIES.Manager.ViewHistory : ALERT_CAPABILITIES.Manager.ViewCurrent
  }
])

const getLabelEntries = (alert: Alert) => Object.entries(alert.labels || {})

const buildListParams = (): ListAlertsReq => {
  const params: ListAlertsReq = {
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  }

  const keyword = filterForm.keyword.trim()
  if (keyword) params.keyword = keyword
  if (filterForm.datasourceId !== "all") params.data_source_id = Number(filterForm.datasourceId)
  if (filterForm.level !== "all") params.level = Number(filterForm.level)

  const [startTime, endTime] = filterForm.timeRange || []
  if (startTime && endTime) {
    params.start_time = startTime.getTime()
    params.end_time = endTime.getTime()
  }

  return params
}

const loadAlerts = async () => {
  loading.value = true
  try {
    const { data } = await (isHistory.value
      ? listHistoryAlertsApi(buildListParams())
      : listCurrentAlertsApi(buildListParams()))
    alerts.value = data.alerts || []
    paginationData.total = data.total || 0
  } catch {
    ElMessage.error(isHistory.value ? "历史告警加载失败" : "当前告警加载失败")
    alerts.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

const loadDatasourceOptions = async () => {
  try {
    const { data } = await listDatasourceApi({
      offset: 0,
      limit: 1000
    })
    datasources.value = data.data_sources || []
  } catch {
    ElMessage.error("数据源选项加载失败")
    datasources.value = []
  }
}

const handleFilterChange = debounce(() => {
  paginationData.currentPage = 1
  loadAlerts()
}, 300)

const handleCurrentChange = (page: number) => {
  paginationData.currentPage = page
  loadAlerts()
}

const handleSizeChange = (size: number) => {
  paginationData.pageSize = size
  paginationData.currentPage = 1
  loadAlerts()
}

const handleOperateEvent = (alert: Alert, action: string) => {
  if (action === "detail") {
    openDetail(alert)
  }
}

const openDetail = (alert: Alert) => {
  selectedAlert.value = alert
  detailVisible.value = true
}

const getLevelText = (level: number) => `P${Math.max(level - 1, 0)}`

const getLevelTagType = (level: number) => {
  if (level <= 2) return "danger"
  if (level <= 4) return "warning"
  return "info"
}

const getLevelClass = (level: number) => {
  const classMap: Record<number, string> = {
    1: "is-p0",
    2: "is-p1",
    3: "is-p2",
    4: "is-p3",
    5: "is-p4"
  }
  return classMap[level] || "is-p4"
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    firing: "活跃",
    resolved: "已恢复",
    ignored: "已忽略"
  }
  return statusMap[status] || status || "-"
}

const getStatusTagType = (status: string) => {
  if (status === "firing") return "danger"
  if (status === "resolved") return "success"
  return "info"
}

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return "-"
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const formatDuration = (seconds?: number) => {
  const value = Number(seconds || 0)
  if (value < 60) return `${value}秒`
  if (value < 3600) return `${Math.floor(value / 60)}分钟`
  if (value < 86400) return `${Math.floor(value / 3600)}小时${Math.floor((value % 3600) / 60)}分钟`
  return `${Math.floor(value / 86400)}天${Math.floor((value % 86400) / 3600)}小时`
}

watch(
  () => [
    filterForm.keyword,
    filterForm.datasourceId,
    filterForm.level,
    filterForm.timeRange?.[0]?.getTime(),
    filterForm.timeRange?.[1]?.getTime()
  ],
  () => {
    handleFilterChange()
  }
)

onMounted(() => {
  loadDatasourceOptions()
  loadAlerts()
})
</script>

<style lang="scss" scoped>
.alert-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background: #f5f7fa;
}

.alert-filter-panel {
  flex-shrink: 0;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.alert-list-shell {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.alert-filter-toolbar {
  --alert-filter-gap: 8px;
  --alert-filter-height: 32px;

  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-start;
  gap: var(--alert-filter-gap);
  min-width: 0;
  width: 100%;
  flex-wrap: wrap;

  &.is-history {
    align-items: stretch;
  }
}

.filter-control {
  display: flex;
  align-items: stretch;
  height: var(--alert-filter-height);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

.control-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  padding: 0 10px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;

  .el-icon {
    color: #9ca3af;
    font-size: 14px;
  }
}

.search-control {
  flex: 1 1 100%;
  min-width: 260px;
}

.datasource-control,
.level-control {
  flex: 1 1 180px;
  min-width: 150px;
}

.time-control {
  flex: 2 1 360px;
  min-width: 280px;
}

.filter-input,
.filter-select,
.filter-range {
  height: 100%;
}

.filter-input {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.filter-select {
  flex: 1;
  width: 100%;
  min-width: 0;

  &.is-datasource {
    width: 100%;
  }

  &.is-level {
    width: 100%;
  }
}

.filter-range {
  flex: 1;
  min-width: 0;
}

:deep(.filter-input .el-input__wrapper),
:deep(.filter-select .el-select__wrapper),
:deep(.filter-range .el-input__wrapper) {
  min-height: 30px;
  padding: 0;
  background: transparent;
  border-radius: 0 !important;
  box-shadow: none !important;
}

:deep(.filter-input .el-input__wrapper) {
  padding: 0 10px;
}

:deep(.filter-select .el-select__wrapper),
:deep(.filter-range .el-input__wrapper) {
  padding: 0 10px;
}

:deep(.filter-range.el-date-editor) {
  --el-input-border-color: transparent;
  --el-input-hover-border-color: transparent;
  --el-input-focus-border-color: transparent;
  width: 100%;
}

:deep(.filter-range .el-range-input) {
  color: #334155;
  font-size: 12px;
}

:deep(.filter-range .el-range-separator) {
  color: #64748b;
  font-weight: 600;
}

:deep(.alert-table.manager-content) {
  flex: 1;
  min-height: 0;
}

:deep(.alert-table .content-card) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

:deep(.alert-table .data-table-container) {
  border-radius: 8px;
}

:deep(.alert-row) {
  .el-table__cell {
    padding: 10px 0;
  }
}

.level-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-large {
    width: 12px;
    height: 12px;
  }

  &.is-p0 {
    background: #f43f5e;
    box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.12);
  }

  &.is-p1 {
    background: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
  }

  &.is-p2 {
    background: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
  }

  &.is-p3 {
    background: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  &.is-p4 {
    background: #94a3b8;
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
  }
}

.rule-cell {
  min-width: 0;
}

.rule-title {
  display: block;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: 0;
  cursor: pointer;

  &:hover {
    color: #2563eb;
  }
}

.label-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin-top: 6px;
  overflow: hidden;
}

.label-chip,
.label-more {
  display: inline-flex;
  align-items: center;
  max-width: 150px;
  height: 22px;
  padding: 0 7px;
  overflow: hidden;
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
}

.label-more {
  color: #2563eb;
  font-family: inherit;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.muted-text {
  color: #94a3b8;
  font-size: 12px;
}

.source-cell {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.source-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
  margin-top: 1px;
}

.source-meta,
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.source-name,
.time-cell span {
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-range-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;

  span {
    white-space: nowrap;
  }

  em {
    color: #94a3b8;
    font-style: normal;
    font-weight: 500;
  }
}

.source-type,
.time-cell small {
  color: #94a3b8;
  font-size: 12px;
}

.alert-detail {
  padding: 18px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 700;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
  }

  .el-tag {
    margin-left: auto;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.detail-item {
  min-width: 0;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  span {
    display: block;
    margin-bottom: 6px;
    color: #64748b;
    font-size: 12px;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #1e293b;
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.detail-section {
  margin-top: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  h4 {
    margin: 0 0 12px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;
  }
}

.detail-labels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 6px;

  b,
  em {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  b {
    color: #475569;
  }

  em {
    color: #1e293b;
    font-style: normal;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}

@media (max-width: 1180px) {
  .alert-filter-toolbar {
    justify-content: flex-start;
  }

  .datasource-control,
  .level-control,
  .time-control {
    flex-basis: 100%;
  }

  .filter-control {
    min-width: 0;
  }

  .filter-range {
    min-width: 0;
  }
}
</style>
