<template>
  <div class="resource-page" v-loading="loading">
    <div v-if="resources.length === 0" class="resource-empty">
      <el-empty :image-size="120" :description="emptyText" />
    </div>

    <div v-else class="resource-list">
      <div v-for="row in resources" :key="row.name" class="resource-card">
        <div class="resource-main">
          <div class="resource-heading">
            <div class="resource-title">
              <span class="resource-icon">{{ row.name?.slice(0, 1)?.toUpperCase() || iconFallback }}</span>
              <div class="resource-name-group">
                <div class="resource-name">{{ row.name }}</div>
                <el-tooltip v-if="row.desc" :content="row.desc" placement="top" :show-after="300">
                  <div class="resource-desc">{{ row.desc }}</div>
                </el-tooltip>
                <div v-else class="resource-desc is-empty">暂无描述</div>
              </div>
            </div>

            <div class="resource-status">
              <span
                v-if="kind === ResourceKind.Executor"
                class="status-badge"
                :class="`is-${String(row.dispatch_mode).toLowerCase()}`"
              >
                <span class="status-dot" />
                {{ formatMode(row.dispatch_mode) }}
              </span>
              <span v-else class="status-badge is-kafka">
                <span class="status-dot" />
                KAFKA
              </span>
              <span v-if="row.isolation_level === ResourceIsolation.Dedicated" class="status-badge is-dedicated">
                专属
              </span>
            </div>
          </div>

          <div class="resource-meta">
            <div class="meta-item">
              <span class="meta-label">{{ kind === ResourceKind.Agent ? "消息队列" : "在线节点" }}</span>
              <div class="meta-value">
                <div v-if="kind === ResourceKind.Agent && row.topic" class="queue-list">
                  <span class="queue-chip">
                    <span class="status-dot" />
                    <span class="queue-name">{{ row.topic }}</span>
                  </span>
                </div>
                <span v-else-if="kind === ResourceKind.Agent" class="muted-text">暂无队列</span>
                <div v-else-if="row.nodes?.length" class="node-list">
                  <span class="node-summary">
                    <span class="node-dot" />
                    <span class="node-count">{{ row.nodes.length }}</span>
                    <span>个节点</span>
                  </span>
                  <el-tooltip
                    v-for="node in row.nodes.slice(0, 3)"
                    :key="node.id || node.address"
                    :content="node.id || node.address"
                    placement="top"
                    :show-after="300"
                  >
                    <span class="node-address">{{ node.address }}</span>
                  </el-tooltip>
                  <el-tooltip v-if="row.nodes.length > 3" placement="top">
                    <template #content>
                      <div class="handler-more-list">
                        <div v-for="node in row.nodes.slice(3)" :key="node.id || node.address">
                          {{ node.address }}
                        </div>
                      </div>
                    </template>
                    <span class="more-chip">+{{ row.nodes.length - 3 }}</span>
                  </el-tooltip>
                </div>
                <span v-else class="muted-text">暂无在线节点</span>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">处理能力</span>
              <div class="meta-value">
                <div v-if="row.handlers?.length" class="handler-list">
                  <el-tooltip
                    v-for="handler in row.handlers.slice(0, 5)"
                    :key="handler.name"
                    :content="handler.desc || '暂无描述'"
                    placement="top"
                    :show-after="300"
                  >
                    <span class="handler-chip">{{ handler.name }}</span>
                  </el-tooltip>
                  <el-tooltip v-if="row.handlers.length > 5" placement="top">
                    <template #content>
                      <div class="handler-more-list">
                        <div v-for="handler in row.handlers.slice(5)" :key="handler.name">{{ handler.name }}</div>
                      </div>
                    </template>
                    <span class="more-chip">+{{ row.handlers.length - 5 }}</span>
                  </el-tooltip>
                </div>
                <span v-else class="muted-text">{{
                  kind === ResourceKind.Executor ? "暂无处理方法" : "暂无处理器"
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="paginationData.total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="paginationData.currentPage"
        v-model:page-size="paginationData.pageSize"
        background
        small
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listResourcesApi } from "@/api/task/resource"
import { ResourceDispatchMode, ResourceIsolation, ResourceKind, type Resource } from "@/api/task/resource/type"

const props = withDefaults(
  defineProps<{
    kind: ResourceKind
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
const resources = ref<Resource[]>([])
const { paginationData } = usePagination({ pageSize: 10, pageSizes: [10, 20, 50] })
let requestSequence = 0
let searchTimer: ReturnType<typeof setTimeout> | null = null

const emptyText = computed(() => (props.kind === ResourceKind.Executor ? "暂无执行器" : "暂无推送节点"))
const iconFallback = computed(() => (props.kind === ResourceKind.Executor ? "E" : "A"))

const fetchResources = async () => {
  const currentRequest = ++requestSequence
  const params = {
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    keyword: props.keyword.trim(),
    kind: props.kind
  }
  loading.value = true
  try {
    const { data } = await listResourcesApi(params)
    if (currentRequest !== requestSequence) return

    resources.value = data.resources || []
    paginationData.total = data.total || 0
    emit("countChange", resources.value.length)
  } catch {
    if (currentRequest !== requestSequence) return

    resources.value = []
    paginationData.total = 0
    emit("countChange", 0)
  } finally {
    if (currentRequest === requestSequence) {
      loading.value = false
    }
  }
}

const listResourcesData = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  if (paginationData.currentPage !== 1) {
    paginationData.currentPage = 1
    return Promise.resolve()
  }
  return fetchResources()
}

const handlePageSizeChange = () => {
  paginationData.currentPage = 1
}

const formatMode = (mode?: string) => {
  if (mode === ResourceDispatchMode.Pull) return "主动拉取"
  if (mode === ResourceDispatchMode.Push) return "调度推送"
  return "未知"
}

const loadedCount = computed(() => resources.value.length)

onMounted(listResourcesData)

watch(
  () => props.keyword,
  () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      searchTimer = null
      void listResourcesData()
    }, 300)
  }
)

watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => fetchResources()
)

onBeforeUnmount(() => {
  requestSequence++
  if (searchTimer) clearTimeout(searchTimer)
})

defineExpose({
  listResourcesData,
  loadedCount
})
</script>

<style lang="scss" scoped>
.resource-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.resource-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}

.resource-empty {
  flex: 1;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-card {
  border: 1px solid #e5eaf3;
  border-left: 3px solid #3b82f6;
  border-radius: 8px;
  background: #fbfdff;
  transition: all 0.2s ease;

  &:hover {
    border-color: #bdd7f5;
    box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  }
}

.resource-main {
  padding: 16px 20px;
}

.resource-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.resource-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.resource-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: #3b82f6;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}

.resource-name-group {
  min-width: 0;
}

.resource-name {
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.resource-desc {
  max-width: 500px;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-empty {
    color: #94a3b8;
  }
}

.resource-status {
  flex-shrink: 0;
}

.status-badge,
.handler-chip,
.more-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge {
  gap: 6px;
  min-height: 24px;
  padding: 0 10px;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;

  &.is-pull {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  &.is-kafka {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  &.is-dedicated {
    color: #9a3412;
    background: #fff7ed;
    border-color: #fdba74;
  }

  &.is-empty,
  &.is-unknown {
    color: #64748b;
    background: #f8fafc;
    border-color: #e2e8f0;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.resource-meta {
  display: grid;
  grid-template-columns: minmax(380px, 1.08fr) minmax(300px, 0.92fr);
  align-items: center;
  gap: 10px 28px;
  margin-top: 16px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e8eef6;
  border-radius: 8px;
}

.meta-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-label {
  width: 58px;
  flex-shrink: 0;
  color: #8a98ad;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
}

.meta-value {
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 24px;
}

.handler-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.queue-list {
  display: flex;
  align-items: center;
  min-width: 0;
}

.node-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.handler-chip,
.more-chip {
  min-height: 26px;
  padding: 0 9px;
  color: #374151;
  background: #f6f8fb;
  border: 1px solid #e3e8f0;
  border-radius: 6px;
  line-height: 1;
}

.node-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  color: #26364d;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.node-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px #dcfce7;
}

.node-count {
  color: #1f2937;
  font-size: 14px;
  font-weight: 800;
}

.node-address {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  color: #047857;
  background: #f0fdf7;
  border: 1px solid #8ee7b8;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.queue-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  min-height: 24px;
  padding: 0 10px;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.queue-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.muted-text {
  color: #94a3b8;
  font-size: 12px;
  line-height: 26px;
}

.handler-more-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 220px;
}

.pagination-container {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: auto;
  min-height: 52px;
  padding: 12px 16px 0;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

:deep(.el-pagination) {
  --el-pagination-button-width: 28px;
  --el-pagination-button-height: 28px;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .resource-meta {
    grid-template-columns: 1fr;
  }
}
</style>
