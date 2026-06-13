<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { GroupUser } from "@/api/iam/group/type"

const selection = defineModel<GroupUser[]>("selection", { default: () => [] })

withDefaults(
  defineProps<{
    loading: boolean
    data: GroupUser[]
    total: number
    currentPage: number
    pageSize: number
    formatTimestamp: (ts: string | number | undefined) => string
    selectable?: (row: GroupUser) => boolean
    canAdd?: boolean
    canRemove?: boolean
    canBatchRemove?: boolean
  }>(),
  {
    canAdd: true,
    canRemove: true,
    canBatchRemove: true
  }
)

const emit = defineEmits<{
  pageChange: [page: number]
  search: [keyword: string]
  add: []
  remove: [row: GroupUser]
  batchRemove: []
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="用户组成员"
    search-placeholder="搜索成员姓名、用户名或邮箱"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-search="true"
    indicator-color="#3b82f6"
    show-selection
    row-key="username"
    :selectable="selectable"
    empty-text="该用户组下暂无成员"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <template #column-header>
      <div class="member-cols u-gov-label">
        <span>用户信息 / 账号</span>
        <span>联系邮箱</span>
        <span>岗位职责</span>
        <span class="align-center">状态</span>
        <span>加入时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <template #header-actions>
      <el-button class="u-gov-btn" :disabled="!canAdd" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>添加成员</span>
      </el-button>
    </template>

    <template #batch-actions>
      <el-button class="u-gov-btn is-danger" :disabled="!canBatchRemove" @click="emit('batchRemove')">
        <el-icon><Delete /></el-icon>
        <span>批量移除</span>
      </el-button>
    </template>

    <template #item="{ item: row }">
      <div class="member-grid-row">
        <div class="cell-identity">
          <AssetIdentityCell
            :title="row.nickname || row.username"
            :sub-title="row.username"
            :link-to="{ name: 'UserDetail', query: { username: row.username } }"
          />
        </div>

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

        <div class="cell-status">
          <el-tag :type="row.status === 'disabled' ? 'info' : 'success'" size="small" effect="plain" class="status-tag">
            {{ row.status === "disabled" ? "禁用" : "活跃" }}
          </el-tag>
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
            :disabled="!canRemove"
            @click.stop="emit('remove', row)"
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
.member-cols,
.member-grid-row {
  display: grid;
  grid-template-columns: 200px 1.4fr 1fr 90px 1.1fr 90px;
  gap: 24px;
  width: 100%;
  align-items: center;
}

.member-grid-row {
  min-height: 72px;
}

.align-center,
.cell-status,
.cell-actions {
  text-align: center;
}

.email-text,
.job-text,
.time-text {
  font-size: 12px;
  color: #64748b;
}

.time-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.status-tag {
  border-radius: 6px;
  font-weight: 600;
}
</style>
