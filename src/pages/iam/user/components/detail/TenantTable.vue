<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { Tenant } from "@/api/iam/tenant/type"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const { hasPermission } = usePermission()

const selection = defineModel<Tenant[]>("selection", { default: () => [] })

defineProps<{
  loading: boolean
  data: Tenant[]
  total: number
  currentPage: number
  pageSize: number
  formatTimestamp: (ts: string | number) => string
  canAdd?: boolean
  canUnbind?: boolean
  canBatchUnbind?: boolean
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: Tenant]
  batchUnbind: []
  search: [keyword: string]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="关联租户列表"
    search-placeholder="搜索租户名称或空间编码..."
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
      <div class="gov-table-cols header-label-font">
        <span>空间名称 / 编码</span>
        <span>访问域名</span>
        <span>关联时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 顶部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" :disabled="!canAdd" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>加入租户</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button type="danger" plain size="small" :disabled="!canBatchUnbind" @click="emit('batchUnbind')">
        <el-icon><Delete /></el-icon>
        <span>批量移除</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="gov-table-grid-row">
        <!-- 空间标识 (使用分享组件) -->
        <div class="cell-identity">
          <AssetIdentityCell
            :title="row.name"
            :sub-title="row.code"
            :link-to="
              hasPermission(IAM_CAPABILITIES.Tenant.Detail)
                ? { name: 'TenantDetail', query: { id: row.id } }
                : undefined
            "
          />
        </div>

        <div class="cell-domain">
          <span class="domain-text">{{ row.domain || "—" }}</span>
        </div>

        <div class="cell-time">
          <span class="time-text">{{ row.ctime ? formatTimestamp(row.ctime) : "—" }}</span>
        </div>

        <div class="cell-actions">
          <el-button
            type="danger"
            link
            size="small"
            class="delete-btn"
            :disabled="!canUnbind"
            @click.stop="emit('unbind', row)"
          >
            <el-icon><Delete /></el-icon>
            <span>移除</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
@use "./governance-table.scss";
</style>
