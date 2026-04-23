<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { TenantMember } from "@/api/iam/tenant/type"

const selection = ref<TenantMember[]>([])

defineProps<{
  loading: boolean
  data: TenantMember[]
  total: number
  currentPage: number
  pageSize: number
  formatTimestamp: (ts: string | number) => string
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: TenantMember]
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
    indicator-color="#3b82f6"
    show-selection
    empty-text="该租户下暂无关联的成员"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="member-cols header-label-font">
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
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>分派成员</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="member-grid-row">
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
          <span class="email-text">{{ row.email || "—" }}</span>
        </div>

        <div class="cell-job">
          <span class="job-text">{{ row.job_title || "普通成员" }}</span>
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

.member-cols {
  display: grid;
  grid-template-columns: 200px 1.5fr 1fr 100px 1.2fr 100px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.member-grid-row {
  display: grid;
  grid-template-columns: 200px 1.5fr 1fr 100px 1.2fr 100px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  width: 100%;
}

.cell-identity {
  // 逻辑已托管
}

.cell-email .email-text {
  font-size: 13px;
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.cell-job .job-text {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.cell-status {
  display: flex;
  justify-content: center;
}

.cell-time .time-text {
  font-size: 13px;
  color: #8a99ad;
  font-weight: 500;
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
