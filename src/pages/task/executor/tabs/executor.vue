<template>
  <div class="executor-page">
    <DataTable
      :data="executorsData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="false"
      :loading="loading"
      @selection-change="handleSelectionChange"
    >
      <template #executor="{ row }">
        <div class="executor-identity">
          <div class="identity-mark">{{ row.name?.slice(0, 1)?.toUpperCase() || "E" }}</div>
          <div class="identity-main">
            <span class="identity-name">{{ row.name }}</span>
            <el-tooltip v-if="row.desc" :content="row.desc" placement="top" :show-after="300">
              <span class="identity-desc">{{ row.desc }}</span>
            </el-tooltip>
            <span v-else class="identity-desc is-empty">暂无描述</span>
          </div>
        </div>
      </template>

      <template #nodes="{ row }">
        <div v-if="row.nodes && row.nodes.length > 0" class="node-cell">
          <span class="status-dot is-online" />
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
          <span class="status-dot" />
          <span class="offline-text">无在线节点</span>
        </div>
      </template>

      <template #handlers="{ row }">
        <div v-if="row.handlers && row.handlers.length > 0" class="handler-cell">
          <el-tooltip
            v-for="handler in row.handlers.slice(0, 3)"
            :key="handler.name"
            :content="handler.desc || '暂无描述'"
            placement="top"
            :show-after="300"
          >
            <span class="handler-chip">{{ handler.name }}</span>
          </el-tooltip>
          <el-tooltip v-if="row.handlers.length > 3" placement="top">
            <template #content>
              <div class="handler-more-list">
                <div v-for="handler in row.handlers.slice(3)" :key="handler.name">{{ handler.name }}</div>
              </div>
            </template>
            <span class="more-chip">+{{ row.handlers.length - 3 }}</span>
          </el-tooltip>
        </div>
        <span v-else class="muted-text">暂无方法</span>
      </template>

      <template #mode="{ row }">
        <span class="mode-badge" :class="`is-${String(row.mode || 'unknown').toLowerCase()}`">
          <span class="mode-dot" />
          {{ row.mode === "PULL" ? "主动拉取" : row.mode === "PUSH" ? "调度推送" : "未知" }}
        </span>
      </template>
    </DataTable>

    <div class="load-more-bar">
      <el-button v-if="hasMore" :loading="loadingMore" @click="loadMoreExecutors">加载更多</el-button>
      <span v-else>{{ executorsData.length ? "已加载全部执行器" : "暂无执行器" }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import { listExecutorsApi } from "@/api/task/executor"
import type { Executor } from "@/api/task/executor/type"
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

const loading = ref(false)
import type { Column } from "@@/components/DataTable/types"

const tableColumns: Column[] = [
  { prop: "name", label: "执行器", align: "left", slot: "executor", minWidth: 260 },
  { prop: "mode", label: "调度方式", align: "center", slot: "mode", width: 132 },
  { prop: "nodes", label: "在线节点", align: "left", slot: "nodes", minWidth: 230 },
  { prop: "handlers", label: "处理能力", align: "left", slot: "handlers", minWidth: 260 }
]

const selectedRows = ref<Executor[]>([])
const nextCursor = ref("")
const hasMore = ref(false)
const loadingMore = ref(false)

const handleSelectionChange = (selection: Executor[]) => {
  selectedRows.value = selection
}

const executorsData = ref<Executor[]>([])
const fetchExecutors = async (append = false) => {
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const { data } = await listExecutorsApi({
      limit: 20,
      cursor: append ? nextCursor.value : "",
      keyword: props.keyword.trim()
    })
    const list = data.executors || []
    executorsData.value = append ? [...executorsData.value, ...list] : list
    emit("countChange", executorsData.value.length)
    nextCursor.value = data.next_cursor || ""
    hasMore.value = data.has_more && Boolean(nextCursor.value)
  } catch (error) {
    if (!append) executorsData.value = []
    emit("countChange", executorsData.value.length)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const listExecutorsData = () => {
  nextCursor.value = ""
  return fetchExecutors()
}

const loadMoreExecutors = () => {
  if (!hasMore.value || loadingMore.value) return
  return fetchExecutors(true)
}

const loadedCount = computed(() => executorsData.value.length)

onMounted(() => {
  listExecutorsData()
})

watch(
  () => props.keyword,
  () => {
    listExecutorsData()
  }
)

defineExpose({
  listExecutorsData,
  loadedCount,
  hasMore
})
</script>

<style lang="scss" scoped>
.executor-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;

  :deep(.content-card) {
    border-color: #e5e7eb;
  }

  :deep(.data-table__body tr:hover > td) {
    background: #f8fafc;
  }

  :deep(.el-table__header th) {
    color: #475569;
    background: #f8fafc;
  }
}

.executor-identity {
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
  width: 28px;
  height: 28px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
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
  color: #111827;
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

.mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 82px;
  height: 24px;
  padding: 0 10px;
  color: #475569;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  .mode-dot {
    width: 6px;
    height: 6px;
    background: #64748b;
    border-radius: 999px;
  }

  &.is-push {
    color: #475569;
    background: #ffffff;
    border-color: #dbe3ef;

    .mode-dot {
      background: #94a3b8;
    }
  }

  &.is-unknown {
    color: #667085;
    background: #f8fafc;
    border-color: #e2e8f0;

    .mode-dot {
      background: #98a2b3;
    }
  }
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
    box-shadow: none;
  }
}

.node-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.node-count {
  color: #334155;
  font-size: 12px;
  font-weight: 600;
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handler-chip {
  color: #475467;
  background: #ffffff;
  border-color: #e5e7eb;
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
