<template>
  <PageContainer>
    <!-- 工业级双层一体化检索控制面板（上层账号与时间，下层维度均分与操作） -->
    <div class="audit-query-panel">
      <!-- 第一行：核心主线（登录账号 + 时间范围） -->
      <div class="first-row">
        <!-- 登录账号 -->
        <div class="control-group">
          <label class="control-label">
            <el-icon class="label-icon"><User /></el-icon>
            <span>登录账号</span>
          </label>
          <el-input
            v-model="query.username"
            placeholder="输入登录账号名称搜索..."
            clearable
            class="group-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>

        <!-- 登录时间范围 -->
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

      <!-- 第二行：维度均分（认证方式 + 认证状态）与操作按钮 -->
      <div class="second-row">
        <div class="filter-groups">
          <!-- 认证方式 -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><Key /></el-icon>
              <span>认证方式</span>
            </label>
            <el-select
              v-model="query.auth_type"
              placeholder="全部方式"
              clearable
              class="group-select"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="本地密码" value="local" />
              <el-option label="LDAP / AD 目录" value="ldap" />
              <el-option label="OIDC / OAuth2" value="oidc" />
              <el-option label="Passkey 无密" value="passkey" />
              <el-option label="MFA 二次验证" value="mfa" />
              <el-option label="租户空间切换" value="switch" />
            </el-select>
          </div>

          <!-- 认证状态 -->
          <div class="control-group">
            <label class="control-label">
              <el-icon class="label-icon"><CircleCheck /></el-icon>
              <span>认证状态</span>
            </label>
            <el-select
              v-model="query.status"
              placeholder="全部状态"
              clearable
              class="group-select"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="认证成功" value="SUCCESS" />
              <el-option label="认证失败" value="FAIL" />
              <el-option label="账号锁定" value="LOCKED" />
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

    <!-- 登录审计日志表格 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <!-- 用户账号 -->
      <template #user_info="{ row }">
        <span class="username-text">{{ row.username || "--" }}</span>
      </template>

      <!-- 认证方式（纯文本正常展示，去除花里胡哨的Tag） -->
      <template #auth_type="{ row }">
        <span class="auth-type-text">{{ getAuthTypeLabel(row.auth_type) }}</span>
      </template>

      <!-- 认证状态指示器 -->
      <template #status="{ row }">
        <div class="status-indicator" :class="getStatusClass(row.status)">
          <span class="dot" />
          <span>{{ getStatusText(row.status) }}</span>
        </div>
      </template>

      <!-- 客户端 IP -->
      <template #client_ip="{ row }">
        <span class="ip-text">{{ row.client_ip || "--" }}</span>
      </template>

      <!-- 终端环境 (基于开源 ua-parser-js 解析) -->
      <template #user_agent="{ row }">
        <el-tooltip placement="top" :show-after="200" :content="row.user_agent || '无 User-Agent 报文'">
          <span class="ua-summary-text">{{ formatUserAgent(row.user_agent).summary }}</span>
        </el-tooltip>
      </template>

      <!-- 登录时间 -->
      <template #ctime="{ row }">
        <span class="time-text">{{ formatTime(row.ctime) }}</span>
      </template>

      <!-- 详情操作列 (唯一列) -->
      <template #actions="{ row }">
        <el-button link type="primary" size="small" @click="handleViewDetail(row)"> 详情 </el-button>
      </template>
    </DataTable>

    <!-- 审计详情抽屉 -->
    <AuthDetailDrawer v-model:visible="detailDrawerVisible" :record="selectedRecord" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue"
import { Search, RefreshRight, User, Key, CircleCheck, Calendar } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import type { Column } from "@@/components/DataTable/types"
import { listAuthLogsApi } from "@/api/iam/audit"
import type { AuthLog } from "@/api/iam/audit/type"
import AuthDetailDrawer from "./components/AuthDetailDrawer.vue"
import { formatUserAgent } from "./utils/ua"
import dayjs from "dayjs"

const loading = ref(false)
const list = ref<AuthLog[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(15)

const detailDrawerVisible = ref(false)
const selectedRecord = ref<AuthLog | null>(null)

const query = reactive({
  username: "",
  auth_type: "",
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
  return !!(query.username || query.auth_type || query.status || query.start_time || query.end_time)
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
  query.username = ""
  query.auth_type = ""
  query.status = ""
  query.start_time = undefined
  query.end_time = undefined
  dateRange.value = null
  handleSearch()
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await listAuthLogsApi({
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      username: query.username || undefined,
      auth_type: query.auth_type || undefined,
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

const handleViewDetail = (row: AuthLog) => {
  selectedRecord.value = row
  detailDrawerVisible.value = true
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

// NOTE: 这里的 6 个数据列全部移除固定 width 并统一设为相同的 minWidth，让 el-table 自适应均等平分宽度
const tableColumns: Column[] = [
  { label: "登录账号", prop: "username", slot: "user_info", minWidth: 140, align: "center" },
  { label: "认证方式", prop: "auth_type", slot: "auth_type", minWidth: 140, align: "center" },
  { label: "认证状态", prop: "status", slot: "status", minWidth: 140, align: "center" },
  { label: "客户端 IP", prop: "client_ip", slot: "client_ip", minWidth: 140, align: "center" },
  { label: "终端设备", prop: "user_agent", slot: "user_agent", minWidth: 140, align: "center" },
  { label: "登录时间", prop: "ctime", slot: "ctime", minWidth: 140, align: "center" }
]

const formatTime = (ts?: number) => {
  if (!ts) return "--"
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss")
}

const getAuthTypeLabel = (authType?: string) => {
  const lower = (authType || "local").toLowerCase()
  switch (lower) {
    case "local":
    case "password":
      return "本地密码"
    case "ldap":
      return "LDAP 目录"
    case "oidc":
      return "OIDC / SSO"
    case "passkey":
      return "Passkey 密钥"
    case "mfa":
      return "MFA 二次验证"
    case "switch":
      return "租户空间切换"
    case "logout":
      return "退出登录"
    default:
      return authType || "--"
  }
}

const getStatusClass = (status?: string) => {
  switch (status) {
    case "SUCCESS":
      return "is-success"
    case "LOCKED":
      return "is-locked"
    default:
      return "is-fail"
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case "SUCCESS":
      return "认证成功"
    case "LOCKED":
      return "账号锁定"
    default:
      return "认证失败"
  }
}

onMounted(() => {
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
    grid-template-columns: repeat(2, 1fr);
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

  &.is-locked {
    color: #d97706;
    .dot {
      background-color: #f59e0b;
    }
  }
}

.ip-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #334155;
}

.ua-summary-text {
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #0284c7;
  }
}

.username-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.auth-type-text {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

.time-text {
  font-size: 12px;
  color: #475569;
}
</style>
