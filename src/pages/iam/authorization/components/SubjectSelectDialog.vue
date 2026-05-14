<script setup lang="ts">
import { watch, computed } from "vue"
import { Close, User, OfficeBuilding } from "@element-plus/icons-vue"
import { searchSubjectsApi } from "@/api/iam/permission"
import { AuthorizationSubType, type Subject } from "@/api/iam/permission/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 身份主体选择器 (通用版)
 * 采用 ResourceSelectorLayout 架构，支持跨类型检索（用户/角色）、分页、多选及已选预览
 */

const visible = defineModel<boolean>({ default: false })

interface SubjectSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
  initialType?: AuthorizationSubType | ""
  hideTypeSelector?: boolean
  excludeCodes?: string[] // 格式：type-code
}

const props = withDefaults(defineProps<SubjectSelectProps>(), {
  title: "选择身份主体",
  subtitle: "检索并选择用户或角色，作为权限授予的目标对象",
  confirmText: "确认选择",
  initialType: "",
  hideTypeSelector: false,
  excludeCodes: () => []
})

const emit = defineEmits<{
  confirm: [selectedSubjects: Subject[]]
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
} = useResourceSelector<Subject, { keyword: string; sub_type: string }>({
  fetchApi: searchSubjectsApi,
  listKey: "subjects",
  rowKey: (row: Subject) => `${row.type}-${row.id}`,
  initialQuery: { keyword: "", sub_type: props.initialType }
})

// 过滤掉需要排除的主体
const filteredList = computed(() => {
  if (!props.excludeCodes.length) return list.value
  return list.value.filter((item) => !props.excludeCodes.includes(`${item.type}-${item.id}`))
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
  query.sub_type = val || ""
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
    :header-icon="User"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    search-placeholder="搜索名称、标识标识..."
    accent-color="#3b82f6"
    layer-bg="#f8fafc"
    @update:keyword="handleSearch"
    @page-change="handlePageChange"
    @refresh="fetchList"
    @clear="clearSelection"
    @confirm="handleConfirm"
  >
    <!-- 1. 顶部工具栏额外检索条件 -->
    <template v-if="!hideTypeSelector" #toolbar-extra>
      <div class="filter-group">
        <el-radio-group v-model="query.sub_type" class="eiam-segment-filter" @change="handleTypeChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button :value="AuthorizationSubType.USER">用户</el-radio-button>
          <el-radio-button :value="AuthorizationSubType.ROLE">角色</el-radio-button>
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
        :row-key="(row: Subject) => row.type + '-' + row.id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column label="主体信息" min-width="220">
          <template #default="{ row }">
            <div class="subject-row">
              <div class="subject-icon" :class="row.type">
                <el-icon v-if="row.type === AuthorizationSubType.USER"><User /></el-icon>
                <el-icon v-else><OfficeBuilding /></el-icon>
              </div>
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <span class="type-badge" :class="row.type">
              {{ row.type === AuthorizationSubType.USER ? "用户" : "角色" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="260" show-overflow-tooltip />
      </el-table>
    </template>

    <!-- 3. 已选清单 -->
    <template #selected-list>
      <div v-for="item in selectedList" :key="item.type + '-' + item.id" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ item.name }}</span>
            <span class="entity-id">{{ item.id }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(item)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.subject-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .subject-icon {
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

.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  &.user {
    background: #eff6ff;
    color: #3b82f6;
    border: 1px solid #dbeafe;
  }
  &.role {
    background: #fff7ed;
    color: #f59e0b;
    border: 1px solid #ffedd5;
  }
}

.subject-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;

  &.user {
    background: #f0f7ff;
    color: #3b82f6;
  }

  &.role {
    background: #fffbf0;
    color: #f59e0b;
  }
}
</style>
