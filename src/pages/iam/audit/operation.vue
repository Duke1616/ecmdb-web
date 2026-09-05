<template>
  <PageContainer>
    <!-- 工业级双层一体化检索控制面板（上层账号与时间，下层维度均分与操作） -->
    <div class="audit-query-panel">
      <!-- 第一行：核心主线（操作账号 + 时间范围） -->
      <div class="first-row">
        <!-- 操作账号 -->
        <div class="control-group">
          <label class="control-label">
            <el-icon class="label-icon"><User /></el-icon>
            <span>操作账号</span>
          </label>
          <el-input
            v-model="query.operator_name"
            placeholder="输入操作账号名称搜索..."
            clearable
            class="group-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>

        <!-- 操作时间范围 -->
        <div class="control-group">
          <label class="control-label">
            <el-icon class="label-icon"><Calendar /></el-icon>
            <span>时间范围</span>
          </label>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="x"
            class="group-date-picker"
            :shortcuts="dateShortcuts"
            @change="handleDateRangeChange"
          />
        </div>
      </div>

      <!-- 第二行：业务维度均分（服务 + 模块 + 动作 + 状态）与操作按钮 -->
      <div class="second-row">
        <div class="filter-groups">
          <!-- 所属服务 -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><Platform /></el-icon>
              <span>所属服务</span>
            </label>
            <el-select
              v-model="query.service"
              placeholder="全部服务"
              clearable
              class="group-select"
              @change="handleServiceChange"
              @clear="handleServiceChange"
            >
              <el-option
                v-for="svc in serviceOptions"
                :key="svc.code"
                :label="svc.name + ' (' + svc.code + ')'"
                :value="svc.code"
              />
            </el-select>
          </div>

          <!-- 业务模块（与服务联动） -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><Grid /></el-icon>
              <span>业务模块</span>
            </label>
            <el-select
              v-model="query.module"
              placeholder="全部模块"
              clearable
              class="group-select"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option v-for="m in currentModuleOptions" :key="m.name" :label="m.name" :value="m.name" />
            </el-select>
          </div>

          <!-- 操作动作 (正则/模糊匹配) -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><Operation /></el-icon>
              <span>操作动作</span>
            </label>
            <el-input
              v-model="query.action"
              placeholder="动作代码/正则 (如 switch, create)"
              clearable
              class="group-input"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </div>

          <!-- 执行状态 -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><CircleCheck /></el-icon>
              <span>执行状态</span>
            </label>
            <el-select
              v-model="query.status"
              placeholder="全部状态"
              clearable
              class="group-select"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="执行成功" value="SUCCESS" />
              <el-option label="执行失败" value="FAIL" />
            </el-select>
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="action-buttons">
          <el-button :icon="RefreshRight" :disabled="!hasActiveFilter" class="action-btn" @click="handleResetFilters">
            重置
          </el-button>
          <el-button type="primary" :icon="Search" class="action-btn" @click="handleSearch"> 查询 </el-button>
        </div>
      </div>
    </div>

    <!-- 操作审计日志表格 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <!-- 操作人 -->
      <template #operator="{ row }">
        <span class="operator-name">{{ row.operator_name || "--" }}</span>
      </template>

      <!-- 所属服务（直接读取后端 service 字段展示） -->
      <template #service="{ row }">
        <span class="service-text">{{ row.service || "--" }}</span>
      </template>

      <!-- 业务模块（超长省略号并支持浮层查看完整内容） -->
      <template #module="{ row }">
        <el-tooltip v-if="row.module" :content="row.module" placement="top" :show-after="200">
          <span class="module-text">{{ row.module }}</span>
        </el-tooltip>
        <span v-else class="module-text">--</span>
      </template>

      <!-- 操作动作（超长自动省略号 ... 并支持 Hover Tooltip 查看完整动作代码） -->
      <template #action="{ row }">
        <el-tooltip v-if="row.action" :content="row.action" placement="top" :show-after="200">
          <span class="action-text">{{ row.action }}</span>
        </el-tooltip>
        <span v-else class="action-text">--</span>
      </template>

      <!-- 执行状态指示器 -->
      <template #status="{ row }">
        <div class="status-indicator" :class="row.status === 'SUCCESS' ? 'is-success' : 'is-fail'">
          <span class="dot" />
          <span>{{ row.status === "SUCCESS" ? "成功" : "失败" }}</span>
        </div>
      </template>

      <!-- 客户端 IP -->
      <template #client_ip="{ row }">
        <span class="ip-text">{{ row.client_ip || "--" }}</span>
      </template>

      <!-- 操作时间 -->
      <template #ctime="{ row }">
        <span class="time-text">{{ formatTime(row.ctime) }}</span>
      </template>

      <!-- 行操作（唯一操作列） -->
      <template #actions="{ row }">
        <el-button link type="primary" size="small" @click="handleViewDetail(row)"> 详情 </el-button>
      </template>
    </DataTable>

    <!-- 操作详情抽屉 -->
    <OperationDetailDrawer v-model:visible="drawerVisible" :record="currentRecord" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue"
import { Search, RefreshRight, User, Grid, Operation, CircleCheck, Calendar, Platform } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import type { Column } from "@@/components/DataTable/types"
import { listOperationLogsApi } from "@/api/iam/audit"
import type { OperationLog } from "@/api/iam/audit/type"
import { getPermissionManifestApi } from "@/api/iam/permission"
import type { ServicePermissionEntry, PermissionGroup } from "@/api/iam/permission/type"
import OperationDetailDrawer from "./components/OperationDetailDrawer.vue"
import dayjs from "dayjs"

const loading = ref(false)
const list = ref<OperationLog[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(15)

const drawerVisible = ref(false)
const currentRecord = ref<OperationLog | null>(null)

// 服务与模块元数据
const serviceOptions = ref<ServicePermissionEntry[]>([])

const fetchManifest = async () => {
  try {
    const res = await getPermissionManifestApi()
    serviceOptions.value = res.data.services || []
  } catch (e) {
    console.error("加载服务清单元数据失败", e)
  }
}

// 联动计算当前服务下的可用业务模块
const currentModuleOptions = computed(() => {
  if (query.service) {
    const matched = serviceOptions.value.find((s) => s.code === query.service)
    return matched ? matched.entries : []
  }
  const allModules: PermissionGroup[] = []
  const seen = new Set<string>()
  for (const s of serviceOptions.value) {
    for (const e of s.entries || []) {
      if (!seen.has(e.name)) {
        seen.add(e.name)
        allModules.push(e)
      }
    }
  }
  return allModules
})

const handleServiceChange = () => {
  if (query.service && query.module) {
    const exists = currentModuleOptions.value.some((m) => m.name === query.module)
    if (!exists) {
      query.module = ""
    }
  }
  handleSearch()
}

const query = reactive({
  operator_name: "",
  service: "",
  module: "",
  action: "",
  status: "",
  start_time: undefined as number | undefined,
  end_time: undefined as number | undefined
})

const dateRange = ref<[number, number] | null>(null)

const dateShortcuts = [
  {
    text: "今天",
    value: () => {
      const start = dayjs().startOf("day").valueOf()
      const end = dayjs().endOf("day").valueOf()
      return [start, end]
    }
  },
  {
    text: "近 3 天",
    value: () => {
      const end = dayjs().endOf("day").valueOf()
      const start = dayjs().subtract(2, "day").startOf("day").valueOf()
      return [start, end]
    }
  },
  {
    text: "近 7 天",
    value: () => {
      const end = dayjs().endOf("day").valueOf()
      const start = dayjs().subtract(6, "day").startOf("day").valueOf()
      return [start, end]
    }
  }
]

const hasActiveFilter = computed(() => {
  return !!(
    query.operator_name ||
    query.service ||
    query.module ||
    query.action ||
    query.status ||
    query.start_time ||
    query.end_time
  )
})

const handleDateRangeChange = (val: [number, number] | null) => {
  if (val && val.length === 2) {
    query.start_time = val[0]
    query.end_time = val[1]
  } else {
    query.start_time = undefined
    query.end_time = undefined
  }
  handleSearch()
}

const handleResetFilters = () => {
  query.operator_name = ""
  query.service = ""
  query.module = ""
  query.action = ""
  query.status = ""
  query.start_time = undefined
  query.end_time = undefined
  dateRange.value = null
  handleSearch()
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await listOperationLogsApi({
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      service: query.service || undefined,
      operator_name: query.operator_name || undefined,
      module: query.module || undefined,
      action: query.action || undefined,
      status: query.status || undefined,
      start_time: query.start_time,
      end_time: query.end_time
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchLogs()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchLogs()
}

const handleViewDetail = (row: OperationLog) => {
  currentRecord.value = row
  drawerVisible.value = true
}

const tableProps = computed(() => ({
  loading: loading.value,
  data: list.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  actionColumnWidth: 80,
  showPagination: true,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

// 7 个核心数据列全部统一设为相等的 minWidth，让 el-table 自适应均等平分整行宽度
const tableColumns: Column[] = [
  { label: "操作者", prop: "operator_name", slot: "operator", minWidth: 140, align: "center" },
  { label: "服务", prop: "service", slot: "service", minWidth: 140, align: "center" },
  { label: "模块", prop: "module", slot: "module", minWidth: 140, align: "center" },
  { label: "动作", prop: "action", slot: "action", minWidth: 140, align: "center" },
  { label: "执行状态", prop: "status", slot: "status", minWidth: 140, align: "center" },
  { label: "客户端 IP", prop: "client_ip", slot: "client_ip", minWidth: 140, align: "center" },
  { label: "操作时间", prop: "ctime", slot: "ctime", minWidth: 140, align: "center" }
]

const formatTime = (ts?: number) => {
  if (!ts) return "--"
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss")
}

onMounted(() => {
  fetchManifest()
  fetchLogs()
})
</script>

<style lang="scss" scoped>
/* 工业级一体化双层检索控制面板（第一行账号时间，第二行维度均分与按钮） */
.audit-query-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.first-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(360px, 1.4fr);
  gap: 12px;
  width: 100%;
}

.second-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  .filter-groups {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

/* 一体化带前缀标签控件 */
.control-group {
  display: flex;
  align-items: stretch;
  gap: 0;
  height: 36px;
  width: 100%;
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
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }

  .group-input,
  .group-select,
  .group-date-picker {
    flex: 1;
    width: 100% !important;
    min-width: 0;
    height: 100% !important;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor) {
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    height: 100% !important;
    width: 100% !important;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focus),
  :deep(.el-date-editor.is-active) {
    background: transparent !important;
    box-shadow: none !important;
  }
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
  border-right: 1px solid #e5e7eb;

  .label-icon {
    font-size: 14px;
    color: #9ca3af;
  }
}

.action-btn {
  height: 36px;
  font-weight: 500;
  padding: 0 16px;
}

/* 列表内数据行排版 */
.operator-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-text {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-text {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #334155;
  user-select: text;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.is-success {
    color: #16a34a;
    .dot {
      background-color: #22c55e;
    }
  }

  &.is-fail {
    color: #dc2626;
    .dot {
      background-color: #ef4444;
    }
  }
}

.ip-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #334155;
}

.time-text {
  font-size: 12px;
  color: #475569;
}
</style>
