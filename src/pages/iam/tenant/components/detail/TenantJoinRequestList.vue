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
      indicator-color="#f59e0b"
    >
      <template #column-header>
        <div class="gov-table-cols header-label-font request-cols">
          <span>申请人信息</span>
          <span>来源凭证</span>
          <span>申请时间</span>
          <span>预设角色</span>
          <span class="align-center">审批操作</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="gov-table-grid-row request-cols">
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
              <el-tag size="small" type="info">{{ row.role_codes.length }} 个预设角色</el-tag>
            </el-tooltip>
            <span v-else class="text-muted">无</span>
          </div>

          <div class="cell-actions align-center">
            <el-button type="success" link size="small" @click="handleApproval(row.id, true)">
              <el-icon><Check /></el-icon>
              <span>通过</span>
            </el-button>
            <el-button type="danger" link size="small" @click="handleApproval(row.id, false)">
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
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1.2fr;
  align-items: center;
  gap: 16px;
}

.time-text {
  font-size: 12px;
  color: #64748b;
}

.text-muted {
  font-size: 12px;
  color: #94a3b8;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 12px;
  color: #475569;
}

.cell-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
