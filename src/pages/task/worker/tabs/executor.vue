<template>
  <DataTable
    :data="executorsData"
    :columns="tableColumns"
    :show-selection="true"
    :show-pagination="false"
    :loading="loading"
    @selection-change="handleSelectionChange"
  >
    <!-- 节点插槽 -->
    <template #nodes="{ row }">
      <div v-if="row.nodes && row.nodes.length > 0">
        <el-tag
          v-for="node in row.nodes"
          :key="node.id"
          size="small"
          type="primary"
          effect="light"
          round
          style="margin-right: 4px; margin-bottom: 4px"
        >
          {{ node.address }}
        </el-tag>
      </div>
      <el-tag v-else effect="plain" type="danger" size="small" round>无在线节点</el-tag>
    </template>

    <!-- 支持方法插槽 -->
    <template #handlers="{ row }">
      <div v-if="row.handlers && row.handlers.length > 0" class="flex-wrap">
        <el-tooltip
          v-for="handler in row.handlers"
          :key="handler.name"
          :content="handler.desc || '暂无描述'"
          placement="top"
        >
          <el-tag size="small" type="success" effect="light" round style="margin-right: 4px; margin-bottom: 4px">
            {{ handler.name }}
          </el-tag>
        </el-tooltip>
      </div>
      <span v-else class="text-gray-400">暂无方法</span>
    </template>
    <!-- 模式插槽 -->
    <template #mode="{ row }">
      <el-tag v-if="row.mode === 'PULL'" size="small" type="primary" effect="light" round>主动拉取</el-tag>
      <el-tag v-else-if="row.mode === 'PUSH'" size="small" type="warning" effect="light" round>调度器推送</el-tag>
      <el-tag v-else size="small" type="info" effect="plain" round>未知</el-tag>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { listExecutorsApi } from "@/api/task/executor"
import type { Executor } from "@/api/task/executor/type"
import DataTable from "@/common/components/DataTable/index.vue"

const loading = ref(false)
import type { Column } from "@@/components/DataTable/types"

// 表格列配置
const tableColumns: Column[] = [
  { prop: "name", label: "执行器名称", align: "center" },
  { prop: "mode", label: "执行模式", align: "center", slot: "mode" },
  { prop: "nodes", label: "下属在线节点", align: "center", slot: "nodes" },
  { prop: "handlers", label: "支持的方法", align: "center", slot: "handlers" },
  { prop: "desc", label: "描述", align: "center" }
]

// 选中的行
const selectedRows = ref<Executor[]>([])

// 选择变化事件
const handleSelectionChange = (selection: Executor[]) => {
  selectedRows.value = selection
}

/** 查询执行器列表 */
const executorsData = ref<Executor[]>([])
const listExecutorsData = async () => {
  loading.value = true
  try {
    const { data } = await listExecutorsApi()
    executorsData.value = data || []
  } catch (error) {
    executorsData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  listExecutorsData()
})

defineExpose({
  listExecutorsData
})
</script>

<style lang="scss" scoped>
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
