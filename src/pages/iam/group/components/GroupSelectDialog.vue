<script setup lang="ts">
import { watch, computed } from "vue"
import { Close, UserFilled } from "@element-plus/icons-vue"
import { listGroupsApi } from "@/api/iam/group"
import type { Group } from "@/api/iam/group/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

const visible = defineModel<boolean>({ default: false })

interface GroupSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
  excludeCodes?: string[]
}

const props = withDefaults(defineProps<GroupSelectProps>(), {
  title: "选择用户组",
  subtitle: "检索并选择用户组，建立成员或角色关系",
  confirmText: "确认选择",
  excludeCodes: () => []
})

const emit = defineEmits<{
  confirm: [selectedGroups: Group[]]
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
} = useResourceSelector<Group, { keyword: string }>({
  fetchApi: listGroupsApi,
  listKey: "groups",
  rowKey: (row: Group) => row.code,
  initialQuery: { keyword: "" }
})

const filteredList = computed(() => {
  if (!props.excludeCodes.length) return list.value
  return list.value.filter((group) => !props.excludeCodes.includes(group.code))
})

watch(visible, (val) => {
  if (val) fetchList()
  else reset()
})

const handleConfirm = () => {
  if (selectedTotal.value === 0) return
  emit("confirm", [...selectedList.value])
}
</script>

<template>
  <ResourceSelectorLayout
    v-model="visible"
    v-model:keyword="query.keyword"
    v-model:current-page="pagination.currentPage"
    :title="title"
    :subtitle="subtitle"
    :header-icon="UserFilled"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    search-placeholder="搜索用户组名称、标识码..."
    accent-color="#3b82f6"
    layer-bg="#f8fafc"
    @update:keyword="handleSearch"
    @page-change="handlePageChange"
    @refresh="fetchList"
    @clear="clearSelection"
    @confirm="handleConfirm"
  >
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
        <el-table-column label="用户组信息" min-width="220">
          <template #default="{ row }">
            <div class="group-row">
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="260" show-overflow-tooltip />
      </el-table>
    </template>

    <template #selected-list>
      <div v-for="group in selectedList" :key="group.code" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ group.name }}</span>
            <span class="entity-id">{{ group.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(group)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.group-row {
  display: flex;
  align-items: center;
  gap: 12px;

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
</style>
