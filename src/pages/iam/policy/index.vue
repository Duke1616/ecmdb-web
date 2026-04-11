<template>
  <PageContainer>
    <!-- 头部区域: 引入高级筛选 bar -->
    <ManagerHeader
      title="策略管理"
      subtitle="集中化管理系统访问控制策略，支持自定义扩展与编排"
      @refresh="handleRefresh"
    >
      <template #actions>
        <div class="header-actions-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索策略名称或标识码..."
            class="search-input premium-input"
            clearable
            @clear="handleRefresh"
            @keyup.enter="handleRefresh"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="typeFilter" placeholder="策略类型" clearable class="type-filter premium-input">
            <el-option label="系统预设" :value="1" />
            <el-option label="自定义" :value="2" />
          </el-select>

          <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建策略 </el-button>

          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </div>
      </template>
    </ManagerHeader>

    <!-- 数据列表: 遵循排班管理的高级质感 -->
    <DataTable
      v-loading="loading"
      :data="filteredPolicies"
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
      <!-- 策略名称: 加粗并带语义图标 -->
      <template #name="{ row }">
        <div class="minimal-name-info">
          <span class="main-title">{{ row.name }}</span>
        </div>
      </template>

      <!-- 标识码: 精致 Mono Tag -->
      <template #code="{ row }">
        <span class="code-font">{{ row.code }}</span>
      </template>

      <!-- 类型: 语义化 Dot 状态 -->
      <template #type="{ row }">
        <div class="minimal-status" :class="row.type === 1 ? 'primary' : 'success'">
          <span class="dot" />
          <span class="text">{{ row.type === 1 ? "系统预设" : "自定义" }}</span>
        </div>
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

    <!-- JSON 详情弹窗 -->
    <el-dialog v-model="jsonVisible" title="策略详情 (JSON)" width="700px" custom-class="json-dialog">
      <div class="json-viewer-container">
        <pre><code class="language-json">{{ JSON.stringify(selectedPolicy, null, 2) }}</code></pre>
      </div>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Search, Plus, RefreshRight, Edit, Delete, Connection } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import type { Column } from "@@/components/DataTable/types"
import type { Policy } from "@/api/iam/policy/type"
import { usePolicyList } from "./composables/usePolicyList"

const {
  policies,
  total,
  currentPage,
  pageSize,
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

const loading = ref(false)
const searchQuery = ref("")
const typeFilter = ref<number | null>(null)

// 前端关键词过滤 (增强交互响应)
const filteredPolicies = computed(() => {
  return policies.value.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCode = p.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchType = typeFilter.value ? p.type === typeFilter.value : true
    return (matchName || matchCode) && matchType
  })
})

const tableColumns: Column[] = [
  { label: "策略名称", prop: "name", slot: "name", width: 180, align: "center" },
  { label: "识别码", prop: "code", slot: "code", width: 200 },
  { label: "策略类型", prop: "type", slot: "type", width: 140, align: "center" },
  { label: "描述说明", prop: "desc", slot: "desc", minWidth: 250 }
]

const getOperateItems = (row: Policy) => {
  const items = [
    { name: "编辑", code: "edit", icon: Edit, type: "primary" },
    { name: "JSON", code: "json", icon: Connection, type: "info" }
  ]
  if (row.type !== 1) {
    items.push({ name: "删除", code: "delete", icon: Delete, type: "danger" })
  }
  return items
}

const handleAction = (row: Policy, code: string) => {
  switch (code) {
    case "edit":
      handleEdit(row)
      break
    case "json":
      handleViewJson(row)
      break
    case "delete":
      handleDelete(row)
      break
  }
}
</script>

<style lang="scss" scoped>
.header-actions-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  .search-input {
    width: 260px;
  }
  .type-filter {
    width: 130px;
  }
}

.minimal-name-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  .status-icon {
    font-size: 16px;
    &.sys {
      color: #3b82f6;
    }
    &.custom {
      color: #10b981;
    }
  }
  .main-title {
    font-weight: 600;
    font-size: 14px;
    color: #0f172a;
  }
}

.code-font {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.desc-text {
  font-size: 13px;
  color: #64748b;
}

/* 核心语义化状态样式 */
.minimal-status {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .text {
    font-size: 12px;
    font-weight: 600;
  }
  &.primary {
    .dot {
      background: #3b82f6;
    }
    .text {
      color: #2563eb;
    }
  }
  &.success {
    .dot {
      background: #10b981;
    }
    .text {
      color: #059669;
    }
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

/* 复刻 Premium Input 样式 */
.premium-input :deep(.el-input__wrapper),
.premium-input :deep(.el-select__wrapper) {
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
  &:hover {
    border-color: #cbd5e1 !important;
  }
  &.is-focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
  }
}

:deep(.el-table__row):hover {
  background-color: #f8fafc !important;
}
</style>
