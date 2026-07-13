<template>
  <aside class="pool-directory">
    <header class="directory-head">
      <div>
        <h3>资源池目录</h3>
      </div>
      <span class="count">{{ total }} 个</span>
    </header>

    <div class="kind-tabs">
      <button
        v-for="item in kindTabs"
        :key="item.value"
        type="button"
        class="kind-tab"
        :class="{ 'is-active': kind === item.value }"
        @click="handleKindChange(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="filter-panel">
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <div class="filter-options">
          <button
            v-for="item in statusOptions"
            :key="item.value"
            type="button"
            class="filter-chip"
            :class="{ 'is-active': status === item.value }"
            @click="setStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="kind === ExecutionPoolKind.Executor" class="filter-group">
        <span class="filter-label">模式</span>
        <div class="filter-options">
          <button
            v-for="item in modeOptions"
            :key="item.value"
            type="button"
            class="filter-chip"
            :class="{ 'is-active': mode === item.value }"
            @click="setMode(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="directory-list">
      <button
        v-for="pool in pools"
        :key="pool.name"
        class="pool-row"
        :class="{ 'is-active': selectedPoolName === pool.name }"
        type="button"
        @click="$emit('select', pool)"
      >
        <span class="state-mark" :class="pool.status === ExecutionPoolStatus.Enabled ? 'is-enabled' : 'is-disabled'" />
        <span class="row-body">
          <span class="row-title">
            {{ pool.name }}
            <span v-if="pool.isolation_level === ExecutionPoolIsolation.Dedicated" class="isolation-tag">专属</span>
          </span>
          <span class="row-desc">{{ pool.desc || "暂无描述" }}</span>
        </span>
      </button>

      <el-empty v-if="!loading && pools.length === 0" :image-size="82" description="暂无资源池" />
    </div>

    <footer v-if="total > pageSize" class="directory-page">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        background
        small
        layout="prev, pager, next"
        :total="total"
      />
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  ExecutionPoolKind,
  ExecutionPoolIsolation,
  ExecutionPoolMode,
  ExecutionPoolStatus,
  type ExecutionPool
} from "@/api/task/pool/type"

defineProps<{
  loading: boolean
  pools: ExecutionPool[]
  selectedPoolName: string
  total: number
}>()

const emit = defineEmits<{
  reload: []
  select: [pool: ExecutionPool]
}>()

const kind = defineModel<ExecutionPoolKind>("kind", { required: true })
const status = defineModel<ExecutionPoolStatus | "">("status", { required: true })
const mode = defineModel<ExecutionPoolMode | "">("mode", { required: true })
const currentPage = defineModel<number>("currentPage", { required: true })
const pageSize = defineModel<number>("pageSize", { required: true })

const modeOptions = computed(() => {
  if (kind.value === ExecutionPoolKind.Executor) {
    return [
      { label: "全部", value: "" },
      { label: "主动拉取", value: ExecutionPoolMode.Pull },
      { label: "调度推送", value: ExecutionPoolMode.Push }
    ] as const
  }

  return []
})

const kindTabs: Array<{ label: string; value: ExecutionPoolKind }> = [
  { label: "分布式调度", value: ExecutionPoolKind.Executor },
  { label: "消息推送", value: ExecutionPoolKind.Agent }
]

const statusOptions: Array<{ label: string; value: ExecutionPoolStatus | "" }> = [
  { label: "全部", value: "" },
  { label: "启用", value: ExecutionPoolStatus.Enabled },
  { label: "禁用", value: ExecutionPoolStatus.Disabled }
]

const handleKindChange = (value: ExecutionPoolKind) => {
  if (kind.value === value) return
  kind.value = value
  mode.value = ""
  emit("reload")
}

const setStatus = (value: ExecutionPoolStatus | "") => {
  if (status.value === value) return
  status.value = value
  emit("reload")
}

const setMode = (value: ExecutionPoolMode | "") => {
  if (mode.value === value) return
  mode.value = value
  emit("reload")
}
</script>

<style scoped lang="scss">
.pool-directory {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
}

.directory-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f7;

  h3 {
    margin: 0;
    color: #111827;
    font-size: 15px;
    line-height: 1.3;
  }
}

.count {
  color: #475569;
  font-size: 12px;
  line-height: 24px;
}

.isolation-tag {
  display: inline-flex;
  margin-left: 6px;
  padding: 1px 5px;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  vertical-align: 1px;
}

.kind-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: #f8fafc;
  border-bottom: 1px solid #e5edf6;
}

.kind-tab {
  position: relative;
  height: 36px;
  color: #64748b;
  background: transparent;
  border: 0;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &.is-active {
    color: #111827;
    background: #ffffff;
  }

  &.is-active::after {
    position: absolute;
    right: 50%;
    bottom: 0;
    width: 24px;
    height: 3px;
    background: #64748b;
    border-radius: 999px 999px 0 0;
    content: "";
    transform: translateX(50%);
  }
}

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
}

.filter-group {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.filter-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.filter-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.filter-chip {
  height: 28px;
  padding: 0 8px;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &.is-active {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #93c5fd;
  }
}

.directory-list {
  flex: 1;
  min-height: 240px;
  overflow: auto;
  padding: 10px;
}

.pool-row {
  width: 100%;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 10px;
  min-height: 64px;
  padding: 10px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s;

  & + & {
    margin-top: 4px;
  }

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &.is-active {
    background: #f3f8ff;
    border-color: #9ec5fe;
  }
}

.state-mark {
  width: 7px;
  height: 7px;
  margin-top: 7px;
  border-radius: 50%;
  background: #94a3b8;

  &.is-enabled {
    background: #16a34a;
  }
}

.row-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-title {
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.directory-page {
  display: flex;
  justify-content: center;
  padding: 10px;
  border-top: 1px solid #eef2f7;
}
</style>
