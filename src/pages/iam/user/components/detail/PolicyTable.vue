<script setup lang="ts">
import { ref } from "vue"
import { Plus, Delete, Calendar } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import type { Policy } from "@/api/iam/policy/type"

const selection = defineModel<Policy[]>("selection", { default: () => [] })
const policyType = ref<number>()

defineProps<{
  loading: boolean
  data: Policy[]
  total: number
  currentPage: number
  pageSize: number
  formatTimestamp: (ts: number | string) => string
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: Policy]
  batchUnbind: []
  search: [keyword: string]
  filterChange: [type?: number]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="授权策略"
    search-placeholder="搜索策略名称或标识符"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    indicator-color="#3b82f6"
    show-selection
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义：统一字体样式 -->
    <template #column-header>
      <div class="policy-cols header-label-font">
        <span>策略标识</span>
        <span>权限效力描述</span>
        <span class="align-center">授权时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 检索扩展 -->
    <template #extra-filters>
      <el-select
        v-model="policyType"
        placeholder="全部类型"
        clearable
        class="resource-scope-filter"
        @change="emit('filterChange', $event)"
      >
        <el-option label="系统内置" :value="1" />
        <el-option label="自定义" :value="2" />
      </el-select>
    </template>

    <!-- 头部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>新增授权项</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button type="danger" size="small" @click="emit('batchUnbind')">批量撤销授权</el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="policy-grid-row">
        <div class="cell-identity">
          <div class="meta-info">
            <span class="name">{{ row.name }}</span>
            <div class="code-wrapper">
              <code>{{ row.code }}</code>
            </div>
          </div>
        </div>

        <div class="cell-description">
          <span class="desc-text" :title="row.desc">
            {{ row.desc || "此策略定义了对特定资源集合的精细化访问控制规则。" }}
          </span>
        </div>

        <div class="cell-time">
          <div class="time-item">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatTimestamp(row.ctime) }}</span>
          </div>
        </div>

        <div class="cell-actions">
          <el-button type="danger" link size="small" class="delete-btn" @click.stop="emit('unbind', row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }
}

.resource-scope-filter {
  width: 124px;
}

/* 表头字体统一规范 */
.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.policy-cols {
  display: grid;
  grid-template-columns: minmax(260px, 1.25fr) minmax(240px, 1.45fr) 140px 84px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.policy-grid-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.25fr) minmax(240px, 1.45fr) 140px 84px;
  align-items: center;
  gap: 24px;
  min-height: 76px;
}

.cell-identity {
  display: flex;
  align-items: center;
  min-width: 0;
  .meta-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
    .name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .code-wrapper {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #94a3b8;
      code {
        font-family: ui-monospace, SFMono-Regular, monospace;
        letter-spacing: -0.02em;
      }
    }
  }
}

.cell-description {
  min-width: 0;
  .desc-text {
    font-size: 13px;
    color: #64748b;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.cell-time {
  display: flex;
  justify-content: center;
  .time-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    .el-icon {
      color: #94a3b8;
    }
  }
}

.cell-actions {
  display: flex;
  justify-content: center;
  .delete-btn {
    color: #94a3b8;
    &:hover {
      color: #ef4444;
    }
  }
}

@media (max-width: 1200px) {
  .policy-cols,
  .policy-grid-row {
    grid-template-columns: minmax(220px, 1.2fr) minmax(220px, 1.35fr) 128px 72px;
    gap: 16px;
  }
}
</style>
