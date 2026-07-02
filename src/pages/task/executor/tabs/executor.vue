<template>
  <div class="executor-page" v-loading="loading">
    <el-empty v-if="executorsData.length === 0" :image-size="200" description="暂无执行器" />

    <div class="executor-list" v-else>
      <div
        v-for="row in executorsData"
        :key="row.name"
        class="executor-item-card"
        :class="{ 'is-offline': !row.nodes || row.nodes.length === 0 }"
      >
        <div class="executor-main">
          <div class="executor-heading">
            <div class="executor-title">
              <span class="executor-icon" :class="{ 'is-offline': !row.nodes || row.nodes.length === 0 }">
                {{ row.name?.slice(0, 1)?.toUpperCase() || "E" }}
              </span>
              <div class="executor-name-group">
                <div class="executor-name">{{ row.name }}</div>
                <el-tooltip v-if="row.desc" :content="row.desc" placement="top" :show-after="300">
                  <div class="executor-desc">{{ row.desc }}</div>
                </el-tooltip>
                <div v-else class="executor-desc is-empty">暂无描述</div>
              </div>
            </div>

            <div class="executor-status">
              <span class="mode-badge" :class="`is-${String(row.mode || 'unknown').toLowerCase()}`">
                <span class="mode-dot" />
                {{ row.mode === "PULL" ? "主动拉取" : row.mode === "PUSH" ? "调度推送" : "未知" }}
              </span>
            </div>
          </div>

          <div class="executor-meta">
            <div class="meta-item">
              <span class="meta-label">在线节点</span>
              <div class="meta-value">
                <div v-if="row.nodes && row.nodes.length > 0" class="node-info">
                  <span class="status-dot is-online" />
                  <span class="node-count">{{ row.nodes.length }} 个节点</span>
                  <div class="node-addresses">
                    <el-tooltip v-for="node in row.nodes.slice(0, 3)" :key="node.id" :content="node.id" placement="top">
                      <span class="node-address">{{ node.address }}</span>
                    </el-tooltip>
                    <span v-if="row.nodes.length > 3" class="more-chip">+{{ row.nodes.length - 3 }}</span>
                  </div>
                </div>
                <div v-else class="node-info is-offline">
                  <span class="status-dot" />
                  <span class="offline-text">无在线节点</span>
                </div>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">处理能力</span>
              <div class="meta-value">
                <div v-if="row.handlers && row.handlers.length > 0" class="handler-list">
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
                <span v-else class="muted-text">暂无处理方法</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
const nextCursor = ref("")
const hasMore = ref(false)
const loadingMore = ref(false)
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
  gap: 12px;
  height: 100%;
}

.executor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.executor-item-card {
  border: 1px solid #e5eaf3;
  border-left: 3px solid #3b82f6; // 默认在线时为蓝色
  border-radius: 8px;
  background: #fbfdff;
  transition: all 0.2s ease;

  &:hover {
    border-color: #bdd7f5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.is-offline {
    border-left-color: #cbd5e1; // 离线时为中性灰色
    background: #fafafa;
  }
}

.executor-main {
  padding: 16px 20px;
}

.executor-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.executor-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.executor-icon {
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

  &.is-offline {
    color: #64748b;
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
}

.executor-name-group {
  min-width: 0;
}

.executor-name {
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.executor-desc {
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

.executor-status {
  flex-shrink: 0;
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
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;

  .mode-dot {
    width: 6px;
    height: 6px;
    background: #64748b;
    border-radius: 999px;
  }

  &.is-pull {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;

    .mode-dot {
      background: #3b82f6;
    }
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

.executor-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px 24px;
  margin-top: 14px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
  min-width: 0;
}

.meta-label {
  flex-shrink: 0;
  width: 64px;
  color: #94a3b8;
  font-weight: 500;
}

.meta-value {
  flex: 1;
  min-width: 0;
  color: #334155;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;

  &.is-offline {
    color: #94a3b8;
  }
}

.status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 999px;

  &.is-online {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
  }
}

.node-count {
  font-weight: 600;
  color: #334155;
  font-size: 12px;
}

.node-addresses,
.handler-list {
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
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.node-address {
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.handler-chip {
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;

  &:hover {
    background: #e5e7eb;
  }
}

.more-chip {
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-size: 11px;
}

.offline-text,
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

.load-more-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  color: #64748b;
  font-size: 12px;

  :deep(.el-button) {
    height: 32px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
}
</style>
