<script setup lang="ts">
import { watch, computed } from "vue"
import { Close, Files } from "@element-plus/icons-vue"
import { listPoliciesApi } from "@/api/iam/policy"
import type { Policy } from "@/api/iam/policy/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 策略选择器 (通用版)
 * 采用 ResourceSelectorLayout 架构，支持复杂检索（类型筛选）、分页、多选及已选预览
 */

const visible = defineModel<boolean>({ default: false })

interface PolicySelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
  excludeCodes?: string[]
}

const props = withDefaults(defineProps<PolicySelectProps>(), {
  title: "选择权限策略",
  subtitle: "检索并选择托管策略，为身份主体授予相应的操作权限",
  confirmText: "确认选择",
  excludeCodes: () => []
})

const emit = defineEmits<{
  confirm: [selectedPolicies: Policy[]]
}>()

const {
  list,
  total,
  loading,
  query,
  pagination,
  tableRef,
  selectedList,
  selectedTotal,
  fetchList,
  handleSearch,
  handlePageChange,
  handleSelectionChange,
  removeSelection,
  clearSelection,
  reset
} = useResourceSelector<Policy, { keyword: string; type: number | undefined }>({
  fetchApi: (params) => listPoliciesApi({ ...params }),
  listKey: "policies",
  rowKey: (row: Policy) => row.code,
  initialQuery: { keyword: "", type: undefined }
})

// 过滤掉需要排除的策略
const filteredList = computed(() => {
  if (!props.excludeCodes.length) return list.value
  return list.value.filter((policy) => !props.excludeCodes.includes(policy.code))
})

watch(visible, (val) => {
  if (val) fetchList()
  else reset()
})

const handleConfirm = () => {
  if (selectedTotal.value === 0) return
  emit("confirm", [...selectedList.value])
}

const handleTypeChange = (val: any) => {
  query.type = val || undefined
  handleSearch()
}
</script>

<template>
  <ResourceSelectorLayout
    v-model="visible"
    v-model:keyword="query.keyword"
    v-model:current-page="pagination.currentPage"
    :title="title"
    :subtitle="subtitle"
    :header-icon="Files"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    search-placeholder="搜索策略名称、标识码..."
    accent-color="#3b82f6"
    layer-bg="#f8fafc"
    @update:keyword="handleSearch"
    @page-change="handlePageChange"
    @refresh="fetchList"
    @clear="clearSelection"
    @confirm="handleConfirm"
  >
    <!-- 1. 顶部工具栏额外检索条件 -->
    <template #toolbar-extra>
      <div class="filter-group">
        <el-radio-group v-model="query.type" class="eiam-segment-filter" @change="handleTypeChange">
          <el-radio-button :value="undefined">全部</el-radio-button>
          <el-radio-button :value="1">系统预设</el-radio-button>
          <el-radio-button :value="2">自定义</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <!-- 2. 表格内容 -->
    <template #table>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="filteredList"
        height="100%"
        row-key="code"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column label="策略信息" min-width="240">
          <template #default="{ row }">
            <div class="policy-row">
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="功能描述" min-width="300" show-overflow-tooltip />
        <el-table-column label="来源" width="120" align="center">
          <template #default="{ row }">
            <div class="type-tag" :class="{ 'is-system': row.type === 1 }">
              {{ row.type === 1 ? "系统预设" : "自定义" }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 3. 已选清单 -->
    <template #selected-list>
      <div v-for="policy in selectedList" :key="policy.code" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ policy.name }}</span>
            <span class="entity-id">{{ policy.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(policy)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.policy-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .policy-icon {
    width: 32px;
    height: 32px;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 16px;
  }
  .u-meta {
    .name {
      display: block;
      font-weight: 600;
      color: $text-main;
      font-size: 13px;
    }
    .id {
      font-size: 11px;
      color: $text-sub;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}

.type-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  &.is-system {
    background: #eff6ff;
    color: #2563eb;
  }
}
</style>
