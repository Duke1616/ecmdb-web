<template>
  <DataTable
    :data="agentsData"
    :columns="tableColumns"
    :show-selection="true"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    @selection-change="handleSelectionChange"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  >
    <!-- 处理器列插槽 -->
    <template #handlers="{ row }">
      <div v-if="row.handlers && row.handlers.length > 0" class="flex-wrap">
        <el-tooltip v-for="h in row.handlers" :key="h.name" :content="h.desc || '暂无描述'" placement="top">
          <el-tag size="small" type="success" effect="light" round style="margin-right: 4px; margin-bottom: 4px">
            {{ h.name }}
          </el-tag>
        </el-tooltip>
      </div>
      <span v-else class="text-gray-400">暂无处理器</span>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import type { Agent } from "@/api/task/agent/type"
import { listAgentsApi } from "@/api/task/agent"
import DataTable from "@/common/components/DataTable/index.vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

import type { Column } from "@@/components/DataTable/types"

// 表格列配置
const tableColumns: Column[] = [
  { prop: "name", label: "名称", align: "center" },
  { prop: "topic", label: "Topic", align: "center" },
  { prop: "handlers", label: "支持的方法", align: "center", slot: "handlers" },
  { prop: "desc", label: "描述", align: "center" }
]

// 选中的行
const selectedRows = ref<Agent[]>([])

// 选择变化事件
const handleSelectionChange = (selection: Agent[]) => {
  selectedRows.value = selection
}

/** 查询 Agent 列表 */
const rawAgentsData = ref<Agent[]>([])
const listWorkersData = () => {
  listAgentsApi()
    .then(({ data }) => {
      rawAgentsData.value = data || []
      paginationData.total = rawAgentsData.value.length
    })
    .catch(() => {
      rawAgentsData.value = []
    })
    .finally(() => {})
}

// 纯前端分页（因为后端暂未提供分页参数）
const agentsData = computed(() => {
  const start = (paginationData.currentPage - 1) * paginationData.pageSize
  const end = start + paginationData.pageSize
  return rawAgentsData.value.slice(start, end)
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listWorkersData, { immediate: true })

defineExpose({
  listWorkersData
})
</script>

<style lang="scss" scoped>
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
