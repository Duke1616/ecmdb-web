<template>
  <PageContainer>
    <!-- 头部区域: 引入高级筛选 bar -->
    <ManagerHeader
      title="策略管理"
      subtitle="集中化管理系统访问控制策略，支持自定义扩展与编排"
      @refresh="handleRefresh"
    >
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 1. 搜索治理区 -->
          <div class="search-command-inner">
            <el-input
              v-model="query.keyword"
              placeholder="搜索策略名称或识别码..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            >
              <template #prefix>
                <el-icon class="search-icon"><Search /></el-icon>
              </template>
            </el-input>

            <div class="divider" />

            <!-- 类型过滤 -->
            <el-select
              v-model="query.type"
              placeholder="策略类型"
              clearable
              class="command-select"
              @change="handleRefresh"
            >
              <el-option label="所有类型" :value="TYPE_ALL" />
              <el-option label="系统预设" :value="1" />
              <el-option label="自定义" :value="2" />
            </el-select>
          </div>

          <!-- 2. 操作区 -->
          <div class="action-group">
            <el-button
              class="u-gov-btn is-large"
              :disabled="!hasPermission(IAM_CAPABILITIES.Policy.Add)"
              @click="handleCreate"
            >
              <el-icon><Plus /></el-icon>
              <span>创建策略</span>
            </el-button>
            <el-button :icon="RefreshRight" class="eiam-icon-outline" @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 数据列表: 遵循排班管理的高级质感 -->
    <DataTable
      v-loading="loading"
      :data="policies"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      action-column-width="160"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 策略名称 -->
      <template #name="{ row }">
        <el-link type="primary" :underline="false" class="policy-name" @click="handleViewDetail(row)">
          {{ row.name }}
        </el-link>
      </template>

      <!-- 类型: 语义化 Dot 状态 -->
      <template #type="{ row }">
        <div class="minimal-status" :class="row.type === 1 ? 'primary' : 'success'">
          <span class="dot" />
          <span class="text">{{ row.type === 1 ? "系统预设" : "自定义" }}</span>
        </div>
      </template>

      <!-- 关联主体: 动态 Tag -->
      <template #assignment="{ row }">
        <div class="count-badge" :class="{ 'has-count': row.assignment_count > 0 }">
          {{ row.assignment_count }}
        </div>
      </template>

      <!-- 创建时间 -->
      <template #ctime="{ row }">
        <span class="ctime-text">{{ row.ctime ? formatDate(row.ctime) : "-" }}</span>
      </template>

      <!-- 描述: 柔和次级文本 -->
      <template #desc="{ row }">
        <span class="desc-text">{{ row.desc || "-" }}</span>
      </template>

      <!-- 操作栏: 标准组件化 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="handleAction" />
      </template>
    </DataTable>

    <!-- 源代码 详情弹窗 -->
    <FormDialog
      v-model="jsonVisible"
      title="策略源代码"
      subtitle="查看权限策略的底层 JSON 定义与规则配置"
      width="800px"
      header-icon="Document"
      :show-footer="false"
    >
      <div class="json-viewer-container">
        <pre><code class="language-json">{{ JSON.stringify(selectedPolicy, null, 2) }}</code></pre>
      </div>
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { Search, Plus, RefreshRight, Edit, Delete, Document } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import type { Column } from "@@/components/DataTable/types"
import type { Policy } from "@/api/iam/policy/type"
import { FormDialog } from "@/common/components/Dialogs"
import { useRouter } from "vue-router"
import { usePolicyList } from "./composables/usePolicyList"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const router = useRouter()

const {
  policies,
  total,
  currentPage,
  pageSize,
  loading,
  query,
  jsonVisible,
  selectedPolicy,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleViewJson,
  handleSizeChange,
  handleCurrentChange
} = usePolicyList()

const { hasPermission } = usePermission()

/**
 * 跳转到策略治理详情页
 */
const handleViewDetail = (row: Policy) => {
  router.push({
    name: "PolicyDetail",
    query: { code: row.code }
  })
}

const TYPE_ALL = undefined as any

const tableColumns: Column[] = [
  { label: "策略名称", prop: "name", slot: "name", minWidth: 150, align: "center" },
  { label: "策略类型", prop: "type", slot: "type", width: 120, align: "center" },
  { label: "描述说明", prop: "desc", slot: "desc", minWidth: 200, align: "center", showOverflowTooltip: true },
  { label: "关联主体", prop: "assignment_count", slot: "assignment", width: 120, align: "center" },
  { label: "创建时间", prop: "ctime", slot: "ctime", width: 170, align: "center" }
]

const getOperateItems = (row: Policy) => {
  const items = []
  if (hasPermission(IAM_CAPABILITIES.Policy.Edit)) {
    items.push({ name: "编辑", code: "edit", icon: Edit, type: "primary" })
  }
  items.push({ name: "源代码", code: "source", icon: Document, type: "info" })

  if (row.type !== 1 && hasPermission(IAM_CAPABILITIES.Policy.Delete)) {
    items.push({ name: "删除", code: "delete", icon: Delete, type: "danger" })
  }
  return items
}

const handleAction = (row: Policy, code: string) => {
  switch (code) {
    case "edit":
      handleEdit(row)
      break
    case "source":
      handleViewJson(row)
      break
    case "delete":
      handleDelete(row)
      break
  }
}
const formatDate = (ts: number) => {
  if (!ts) return "-"
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${dd} ${hh}:${mm}`
}
</script>

<style lang="scss" scoped>
.eiam-governance-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;

  .search-command-inner {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    max-width: 680px;
    height: 38px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:focus-within {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }

    .command-input {
      width: 240px;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
      }
      .search-icon {
        color: #94a3b8;
        font-size: 16px;
      }
    }

    .divider {
      width: 1px;
      height: 16px;
      background: #e2e8f0;
      margin: 0 8px;
      flex-shrink: 0;
    }

    .command-select {
      width: 120px;
      :deep(.el-select__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0 8px;

        .el-select__placeholder {
          color: #64748b;
          font-size: 13px;
        }
      }
    }
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;

  .eiam-main-btn {
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    height: 36px;
    padding: 0 18px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    transition: all 0.2s;
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }
  }

  .eiam-icon-outline {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    transition: all 0.2s;
    &:hover {
      color: #409eff;
      border-color: #409eff;
      background: #f0f7ff;
      transform: translateY(-1px);
    }
  }
}

.policy-name {
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
  &:hover {
    color: #3b82f6;
  }
}

/* 核心语义化状态样式 */
.minimal-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .text {
    font-size: 12px;
    font-weight: 500;
  }
  &.primary {
    .dot {
      background: #3b82f6;
    }
    .text {
      color: #3b82f6;
    }
  }
  &.success {
    .dot {
      background: #10b981;
    }
    .text {
      color: #10b981;
    }
  }
}

.desc-text {
  font-size: 13px;
  color: #64748b;
}

.ctime-text {
  font-size: 11px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;

  &.has-count {
    background: #eff6ff;
    color: #3b82f6;
    border-color: #dbeafe;
  }
}

.json-viewer-container {
  background: #1e293b;
  padding: 20px;
  border-radius: 8px;
  max-height: 600px;
  overflow: auto;
  pre {
    margin: 0;
    color: #e2e8f0;
    font-family: ui-monospace, monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

:deep(.el-table__row):hover {
  background-color: #f8fafc !important;
}
</style>
