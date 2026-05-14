<script setup lang="ts">
import { Check, Close } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { JoinRequestVO } from "@/api/iam/invitation/type"
import dayjs from "dayjs"

withDefaults(
  defineProps<{
    data: JoinRequestVO[]
    loading: boolean
    total: number
    currentPage: number
    pageSize: number
    canHandle?: boolean
  }>(),
  {
    canHandle: true
  }
)

const emit = defineEmits<{
  (e: "page-change", page: number): void
  (e: "search", val: string): void
  (e: "approve", id: number, approve: boolean): void
}>()

const handleApproval = (id: number, approve: boolean) => {
  emit("approve", id, approve)
}

const formatTime = (ts: number) => {
  if (!ts) return "—"
  return dayjs(ts).format("YYYY-MM-DD HH:mm")
}
</script>

<template>
  <div class="request-list-page">
    <PremiumList
      title="审批任务队列"
      :data="data"
      :loading="loading"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @page-change="(page) => emit('page-change', page)"
      :show-search="false"
      show-selection
      disabled
    >
      <template #column-header>
        <div class="gov-table-grid is-header is-request u-gov-label">
          <span>申请人信息</span>
          <span>来源凭证</span>
          <span>申请时间</span>
          <span>预设角色</span>
          <span class="align-center">审批操作</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="gov-table-grid is-row is-request">
          <div class="cell-user">
            <AssetIdentityCell :title="row.nickname || row.username" :sub-title="row.username" />
          </div>

          <div class="cell-code mono">
            {{ row.invitation_code || "自主入驻" }}
          </div>

          <div class="cell-time">
            <span class="time-text">{{ formatTime(row.ctime) }}</span>
          </div>

          <div class="cell-roles">
            <el-tooltip v-if="row.role_codes.length > 0" :content="row.role_codes.join(', ')" placement="top">
              <el-tag size="small" type="info" effect="plain" class="role-tag">
                {{ row.role_codes.length }} 个预设角色
              </el-tag>
            </el-tooltip>
            <span v-else class="text-muted">无</span>
          </div>

          <div class="cell-actions">
            <el-button
              type="success"
              link
              size="small"
              class="action-btn approve-btn"
              :disabled="!canHandle"
              @click="handleApproval(row.id, true)"
            >
              <el-icon><Check /></el-icon>
              <span>通过</span>
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              class="action-btn reject-btn"
              :disabled="!canHandle"
              @click="handleApproval(row.id, false)"
            >
              <el-icon><Close /></el-icon>
              <span>拒绝</span>
            </el-button>
          </div>
        </div>
      </template>
    </PremiumList>
  </div>
</template>

<style lang="scss" scoped>
.cell-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 12px;
  color: #64748b;
  &.mono {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
  }
}

.cell-actions {
  .action-btn {
    &.approve-btn {
      color: #10b981;
      &:hover {
        color: #059669;
        transform: translateY(-1px);
      }
    }

    &.reject-btn {
      color: #94a3b8;
      &:hover {
        color: #ef4444;
        transform: translateY(-1px);
      }
    }
  }
}

.text-muted {
  font-size: 12px;
  color: #cbd5e1;
}
</style>
