<template>
  <div class="worker-page">
    <DataTable
      :data="agentsData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="false"
      :loading="loading"
      @selection-change="handleSelectionChange"
    >
      <template #agent="{ row }">
        <div class="agent-identity">
          <div class="identity-mark">{{ row.name?.slice(0, 1)?.toUpperCase() || "A" }}</div>
          <div class="identity-main">
            <span class="identity-name">{{ row.name }}</span>
            <el-tooltip v-if="row.desc" :content="row.desc" placement="top" :show-after="300">
              <span class="identity-desc">{{ row.desc }}</span>
            </el-tooltip>
            <span v-else class="identity-desc is-empty">暂无描述</span>
          </div>
        </div>
      </template>

      <template #topic="{ row }">
        <span class="topic-chip">{{ row.topic || "未配置" }}</span>
      </template>

      <template #nodes="{ row }">
        <div v-if="row.nodes && row.nodes.length > 0" class="node-cell">
          <span class="status-dot is-online"></span>
          <div class="node-main">
            <span class="node-count">{{ row.nodes.length }} 个在线节点</span>
            <div class="node-addresses">
              <el-tooltip v-for="node in row.nodes.slice(0, 2)" :key="node.id" :content="node.id" placement="top">
                <span class="node-address">{{ node.address }}</span>
              </el-tooltip>
              <span v-if="row.nodes.length > 2" class="more-chip">+{{ row.nodes.length - 2 }}</span>
            </div>
          </div>
        </div>
        <div v-else class="node-cell is-offline">
          <span class="status-dot"></span>
          <span class="offline-text">无在线节点</span>
        </div>
      </template>

      <template #handlers="{ row }">
        <div v-if="row.handlers && row.handlers.length > 0" class="handler-cell">
          <el-tooltip v-for="h in row.handlers.slice(0, 3)" :key="h.name" :content="h.desc || '暂无描述'" placement="top" :show-after="300">
            <span class="handler-chip">{{ h.name }}</span>
          </el-tooltip>
          <el-tooltip v-if="row.handlers.length > 3" placement="top">
            <template #content>
              <div class="handler-more-list">
                <div v-for="h in row.handlers.slice(3)" :key="h.name">{{ h.name }}</div>
              </div>
            </template>
            <span class="more-chip">+{{ row.handlers.length - 3 }}</span>
          </el-tooltip>
        </div>
        <span v-else class="muted-text">暂无处理器</span>
      </template>
    </DataTable>

    <div class="load-more-bar">
      <el-button v-if="hasMore" :loading="loadingMore" @click="loadMoreWorkers">加载更多</el-button>
      <span v-else>{{ agentsData.length ? "已加载全部推送节点" : "暂无推送节点" }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import type { Agent } from "@/api/task/agent/type"
import { listAgentsApi } from "@/api/task/agent"
import DataTable from "@/common/components/DataTable/index.vue"

const props = withDefaults(
  defineProps<{
    keyword?: string
  }>(),
  {
    keyword: ""
  }
)

const emit = defineEmits<{
  countChange: [count: number]
}>()

import type { Column } from "@@/components/DataTable/types"

const tableColumns: Column[] = [
  { prop: "name", label: "推送节点", align: "left", slot: "agent", minWidth: 260 },
  { prop: "topic", label: "Topic", align: "left", slot: "topic", minWidth: 180 },
  { prop: "nodes", label: "在线节点", align: "left", slot: "nodes", minWidth: 230 },
  { prop: "handlers", label: "处理能力", align: "left", slot: "handlers", minWidth: 260 }
]

const selectedRows = ref<Agent[]>([])
const agentsData = ref<Agent[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const nextCursor = ref("")
const hasMore = ref(false)

const handleSelectionChange = (selection: Agent[]) => {
  selectedRows.value = selection
}

const fetchWorkers = async (append = false) => {
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const { data } = await listAgentsApi({
      limit: 20,
      cursor: append ? nextCursor.value : "",
      keyword: props.keyword.trim()
    })
    const list = data.agents || []
    agentsData.value = append ? [...agentsData.value, ...list] : list
    nextCursor.value = data.next_cursor || ""
    hasMore.value = data.has_more && Boolean(nextCursor.value)
    emit("countChange", agentsData.value.length)
  } catch {
    if (!append) agentsData.value = []
    emit("countChange", agentsData.value.length)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const listWorkersData = () => {
  nextCursor.value = ""
  return fetchWorkers()
}

const loadMoreWorkers = () => {
  if (!hasMore.value || loadingMore.value) return
  return fetchWorkers(true)
}

watch(
  () => props.keyword,
  () => {
    listWorkersData()
  }
)

const loadedCount = computed(() => agentsData.value.length)

onMounted(() => {
  listWorkersData()
})

defineExpose({
  listWorkersData,
  loadedCount
})
</script>

<style lang="scss" scoped>
.worker-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;

  :deep(.content-card) {
    border-color: #dfe6ef;
  }
}

.agent-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.identity-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  color: #7c2d12;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 800;
}

.identity-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.identity-name,
.identity-desc {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-name {
  color: #1f2937;
  font-size: 13px;
  font-weight: 700;
}

.identity-desc {
  max-width: 100%;
  color: #667085;
  font-size: 12px;

  &.is-empty {
    color: #a0aec0;
  }
}

.topic-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 24px;
  padding: 0 9px;
  overflow: hidden;
  color: #854d0e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;

  &.is-offline {
    color: #98a2b3;
  }
}

.status-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 999px;

  &.is-online {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }
}

.node-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.node-count {
  color: #344054;
  font-size: 12px;
  font-weight: 700;
}

.node-addresses,
.handler-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
}

.node-address,
.handler-chip,
.more-chip {
  display: inline-flex;
  align-items: center;
  max-width: 150px;
  height: 22px;
  padding: 0 8px;
  overflow: hidden;
  color: #475467;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handler-chip {
  color: #166534;
  background: #f7fdf9;
  border-color: #cdeed7;
}

.more-chip {
  flex: 0 0 auto;
  color: #667085;
  background: #ffffff;
}

.offline-text,
.muted-text {
  color: #98a2b3;
  font-size: 12px;
}

.handler-more-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 220px;
}

.load-more-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
  color: #64748b;
  font-size: 12px;

  :deep(.el-button) {
    height: 30px;
    padding: 0 14px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
  }
}
</style>
