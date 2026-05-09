<script setup lang="ts">
import { ref } from "vue"
import { Plus, CopyDocument, Delete } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import InvitationDialog from "./InvitationDialog.vue"
import type { InvitationVO } from "@/api/iam/invitation/type"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"
import dayjs from "dayjs"

defineProps<{
  data: InvitationVO[]
  loading: boolean
  total: number
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: "page-change", page: number): void
  (e: "search", val: string): void
  (e: "revoke", row: InvitationVO): void
  (e: "refresh"): void
}>()

const { toClipboard } = useClipboard()
const invitationDialogVisible = ref(false)

const handleRevoke = (row: InvitationVO) => {
  emit("revoke", row)
}

const copyLink = async (code: string) => {
  const url = `${window.location.origin}/join?code=${code}`
  try {
    await toClipboard(url)
    ElMessage.success("链接已复制")
  } catch (e) {
    ElMessage.error("复制失败")
  }
}

const formatTime = (ts: number) => {
  if (!ts) return "—"
  return dayjs(ts).format("YYYY-MM-DD HH:mm")
}
</script>

<template>
  <div class="invitation-list-page">
    <PremiumList
      title="邀请资产列表"
      :data="data"
      :loading="loading"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @page-change="(page) => emit('page-change', page)"
      :show-search="false"
      indicator-color="#3b82f6"
      show-selection
      disabled
    >
      <template #header-actions>
        <el-button type="primary" class="toolbar-action-btn" @click="invitationDialogVisible = true">
          <el-icon><Plus /></el-icon>
          <span>初始化凭证</span>
        </el-button>
      </template>

      <template #column-header>
        <div class="gov-table-cols header-label-font link-cols">
          <span>邀请码 / 分享</span>
          <span>载荷情况</span>
          <span>有效期限</span>
          <span>审批模式</span>
          <span class="align-center">操作治理</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="gov-table-grid-row link-cols">
          <div class="cell-identity">
            <AssetIdentityCell :title="row.code" sub-title="点击复制邀请链接" @click="copyLink(row.code)" />
          </div>

          <div class="cell-payload">
            <div class="usage-info">
              <span class="used">{{ row.used_count }}</span>
              <span class="divider">/</span>
              <span class="total">{{ row.max_uses === 0 ? "∞" : row.max_uses }}</span>
            </div>
            <div class="usage-label">已用 / 上限</div>
          </div>

          <div class="cell-expiry">
            <span class="time-text" :class="{ 'is-permanent': row.expire_at === 0 }">
              {{ row.expire_at === 0 ? "永久有效" : formatTime(row.expire_at) }}
            </span>
          </div>

          <div class="cell-mode">
            <el-tag :type="row.require_approval ? 'warning' : 'success'" effect="plain" size="small">
              {{ row.require_approval ? "需审核" : "自动通过" }}
            </el-tag>
          </div>

          <div class="cell-actions align-center">
            <el-button type="primary" link size="small" @click="copyLink(row.code)">
              <el-icon><CopyDocument /></el-icon>
              <span>复制</span>
            </el-button>
            <el-button type="danger" link size="small" @click="handleRevoke(row)">
              <el-icon><Delete /></el-icon>
              <span>撤回</span>
            </el-button>
          </div>
        </div>
      </template>
    </PremiumList>

    <InvitationDialog v-model="invitationDialogVisible" @success="emit('refresh')" />
  </div>
</template>

<style lang="scss" scoped>
@use "./governance-table.scss";

.link-cols {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1.2fr;
  align-items: stretch;
  gap: 16px;
}

.cell-identity {
  display: flex;
  align-items: center;
  height: 100%;
}

.cell-payload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  width: fit-content;

  .usage-info {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    .divider {
      color: #cbd5e1;
      margin: 0 4px;
    }
    .total {
      color: #94a3b8;
      font-weight: 500;
    }
  }
  .usage-label {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }
}

.cell-expiry {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
}

.cell-mode {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
}

.time-text {
  font-size: 12px;
  color: #64748b;
  &.is-permanent {
    color: #3b82f6;
    font-weight: 600;
  }
}

.cell-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
}
</style>
