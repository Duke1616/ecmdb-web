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
                :class="`is-${String(row.mode || 'unknown').toLowerCase()}`"
              >
                <span class="status-dot" />
                {{ formatMode(row.mode) }}
              </span>
              <span v-else-if="row.topic" class="status-badge">
                <span class="status-dot" />
                {{ row.topic }}
              </span>
              <span v-else class="status-badge is-empty">未配置 Topic</span>
            </div>
          </div>

          <div class="resource-meta">
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
import { computed, onMounted, ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listResourcesApi } from "@/api/task/resource"
import { ResourceKind, ResourceMode, type Resource } from "@/api/task/resource/type"

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

const emptyText = computed(() => (props.kind === ResourceKind.Executor ? "暂无执行器" : "暂无推送节点"))
const iconFallback = computed(() => (props.kind === ResourceKind.Executor ? "E" : "A"))

const fetchResources = async () => {
  loading.value = true
  try {
    const { data } = await listResourcesApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      keyword: props.keyword.trim(),
      kind: props.kind
    })
    resources.value = data.resources || []
    paginationData.total = data.total || 0
    emit("countChange", resources.value.length)
  } catch {
    resources.value = []
    paginationData.total = 0
    emit("countChange", 0)
  } finally {
    loading.value = false
  }
}

const listResourcesData = () => {
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
  if (mode === ResourceMode.Pull) return "主动拉取"
  if (mode === ResourceMode.Push) return "调度推送"
  return "未知"
}

const loadedCount = computed(() => resources.value.length)

onMounted(listResourcesData)

watch(
  () => props.keyword,
  () => listResourcesData()
)

watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => fetchResources()
)

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
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
}

.meta-label {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
}

.meta-value {
  min-width: 0;
}

.handler-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.handler-chip,
.more-chip {
  min-height: 24px;
  padding: 0 8px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.muted-text {
  color: #94a3b8;
  font-size: 12px;
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
</style>
