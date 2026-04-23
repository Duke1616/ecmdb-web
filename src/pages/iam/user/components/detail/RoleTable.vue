<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { Role } from "@/api/iam/role/type"

const selection = defineModel<Role[]>("selection", { default: () => [] })

defineProps<{
  loading: boolean
  data: Role[]
  total: number
  currentPage: number
  pageSize: number
  formatTimestamp: (ts: string | number) => string
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: Role]
  batchUnbind: []
  search: [keyword: string]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="关联角色列表"
    search-placeholder="搜索角色名称或标识码..."
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-search="true"
    indicator-color="#3b82f6"
    show-selection
    row-key="id"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="role-cols header-label-font">
        <span>角色名称 / 标识</span>
        <span>角色描述</span>
        <span>关联时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 顶部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>分派角色</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button type="danger" plain size="small" @click="emit('batchUnbind')">
        <el-icon><Delete /></el-icon>
        <span>批量移除</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="role-grid-row">
        <!-- 角色标识 (使用共享组件) -->
        <div class="cell-identity">
          <AssetIdentityCell
            :title="row.name"
            :sub-title="row.code"
            :link-to="{ name: 'RoleDetail', query: { code: row.code } }"
          />
        </div>

        <div class="cell-desc">
          <span class="desc-text">{{ row.desc || "—" }}</span>
        </div>

        <div class="cell-time">
          <span class="time-text">{{ row.ctime ? formatTimestamp(row.ctime) : "—" }}</span>
        </div>

        <div class="cell-actions">
          <el-button type="danger" link size="small" class="delete-btn" @click.stop="emit('unbind', row)">
            <el-icon><Delete /></el-icon>
            <span>移除</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
}

.header-label-font {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-cols {
  display: grid;
  grid-template-columns: 240px 1fr 180px 100px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.role-grid-row {
  display: grid;
  grid-template-columns: 240px 1fr 180px 100px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  transition: background 0.2s;

  &:hover {
    background: #f8fafc;
  }
}

.cell-identity {
  // 逻辑已托管
}

.cell-desc .desc-text {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-time .time-text {
  font-size: 13px;
  color: #8a99ad;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.cell-actions {
  display: flex;
  justify-content: center;
  .delete-btn {
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 600;
    &:hover {
      color: #ef4444;
    }
  }
}
</style>
