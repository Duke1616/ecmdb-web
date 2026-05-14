<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { TenantMember } from "@/api/iam/tenant/type"

const selection = defineModel<TenantMember[]>("selection", { default: () => [] })

withDefaults(
  defineProps<{
    loading: boolean
    data: TenantMember[]
    total: number
    currentPage: number
    pageSize: number
    formatTimestamp: (ts: string | number) => string
    showAssign?: boolean
    canAdd?: boolean
    canUnbind?: boolean
    canBatchUnbind?: boolean
  }>(),
  {
    showAssign: true,
    canAdd: true,
    canUnbind: true,
    canBatchUnbind: true
  }
)

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: TenantMember]
  batchUnbind: []
  search: [keyword: string]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="租户空间成员"
    search-placeholder="搜索成员姓名、用户名或邮箱"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    show-search
    indicator-color="#3b82f6"
    show-selection
    empty-text="该租户下暂无关联的成员"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="gov-table-grid is-header is-member u-gov-label">
        <span>用户信息 / 账号</span>
        <span>联系邮箱</span>
        <span>职位与职责</span>
        <span class="align-center">状态</span>
        <span>准入时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 头部操作 -->
    <template #header-actions>
      <div v-if="showAssign" class="header-action-stack">
        <el-button class="u-gov-btn" :disabled="!canAdd" @click="emit('add')">
          <el-icon><Plus /></el-icon>
          <span>分派成员</span>
        </el-button>
      </div>
    </template>

    <template #batch-actions>
      <el-button class="u-gov-btn is-danger" :disabled="!canBatchUnbind" @click="emit('batchUnbind')">
        <el-icon><Delete /></el-icon>
        <span>批量移除成员</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="gov-table-grid is-row is-member">
        <!-- 身份账号列 (使用共享组件) -->
        <div class="cell-identity">
          <AssetIdentityCell
            :title="row.nickname || row.username"
            :sub-title="row.username"
            :link-to="{ name: 'UserDetail', query: { username: row.username } }"
          />
        </div>

        <!-- 详细信息列 -->
        <div class="cell-email">
          <el-tooltip :content="row.email" placement="top" :show-after="500" :disabled="!row.email">
            <span class="email-text">{{ row.email || "—" }}</span>
          </el-tooltip>
        </div>

        <div class="cell-job">
          <el-tooltip :content="row.job_title" placement="top" :show-after="500" :disabled="!row.job_title">
            <span class="job-text">{{ row.job_title || "普通成员" }}</span>
          </el-tooltip>
        </div>

        <!-- 状态列 -->
        <div class="cell-status">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="plain" class="status-tag">
            {{ row.status === 1 ? "活跃" : "注销" }}
          </el-tag>
        </div>

        <!-- 时间列 -->
        <div class="cell-time">
          <span class="time-text">{{ formatTimestamp(row.ctime) }}</span>
        </div>

        <!-- 操作列 -->
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
