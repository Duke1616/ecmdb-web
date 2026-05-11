<script setup lang="ts">
import { Check, Close } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { JoinRequestVO } from "@/api/iam/invitation/type"
import dayjs from "dayjs"

defineProps<{
  data: JoinRequestVO[]
  loading: boolean
  total: number
  currentPage: number
  pageSize: number
}>()

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
        <div class="request-cols header-label-font">
          <span>申请人信息</span>
          <span>来源凭证</span>
          <span>申请时间</span>
          <span>预设角色</span>
          <span class="align-center">审批操作</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="request-cols row-hover">
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
@use "./governance-table.scss";

.request-cols {
  display: grid !important;
  /* 比例对齐，操作列固定宽度 */
  grid-template-columns: 1.5fr 1.2fr 1.2fr 1fr 140px;
  align-items: center;
  gap: 24px;
  width: 100%;
  flex: 1 1 0%;
  box-sizing: border-box;

  &.row-hover {
    min-height: 72px;
    transition: background 0.2s;
    border-bottom: 1px solid #f1f5f9;
    &:hover {
      background: #f8fafc;
    }
  }

  /* 统一对齐类 */
  .align-center {
    text-align: center;
    display: block;
    width: 100%;
  }
}

.cell-user {
  display: flex;
  align-items: center;
  overflow: hidden;
}

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

.time-text {
  font-size: 13px;
  color: #8a99ad;
  font-weight: 500;
}

.role-tag {
  border-radius: 6px;
  font-weight: 500;
}

.cell-actions {
  display: flex;
  justify-content: center;
  gap: 12px;

  .action-btn {
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;

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
