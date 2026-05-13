<script setup lang="ts">
import { ref, watch } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
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
  tenantId?: number
}>()

const emit = defineEmits<{
  (e: "page-change", page: number): void
  (e: "search", val: string): void
  (e: "revoke", row: InvitationVO): void
  (e: "refresh"): void
}>()

const { toClipboard } = useClipboard()
const invitationDialogVisible = ref(false)
const selectedInvitation = ref<InvitationVO | null>(null)

const handleRevoke = (row: InvitationVO) => {
  emit("revoke", row)
}

const handleCreate = () => {
  selectedInvitation.value = null
  invitationDialogVisible.value = true
}

// 监听弹窗关闭，清空选中
watch(invitationDialogVisible, (val) => {
  if (!val) {
    selectedInvitation.value = null
  }
})

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
      :pageSize="pageSize"
      @page-change="(page) => emit('page-change', page)"
      :show-search="false"
      indicator-color="#3b82f6"
      show-selection
      disabled
    >
      <template #header-actions>
        <el-button class="u-gov-btn" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          <span>初始化凭证</span>
        </el-button>
      </template>

      <template #column-header>
        <div class="gov-table-grid is-header is-invitation u-gov-label">
          <span>邀请码 / 分享</span>
          <span class="align-center">载荷情况</span>
          <span>有效期限</span>
          <span class="align-center">审批模式</span>
          <span class="align-center">操作</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="gov-table-grid is-row is-invitation">
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

          <div class="cell-time">
            <span class="time-text" :class="{ 'is-permanent': row.expire_at === 0 }">
              {{ row.expire_at === 0 ? "永久有效" : formatTime(row.expire_at) }}
            </span>
          </div>

          <div class="cell-status">
            <el-tag :type="row.require_approval ? 'warning' : 'success'" effect="plain" size="small">
              {{ row.require_approval ? "需审核" : "自动通过" }}
            </el-tag>
          </div>

          <div class="cell-actions">
            <el-button type="danger" link size="small" class="delete-btn" @click="handleRevoke(row)">
              <el-icon><Delete /></el-icon>
              <span>撤回</span>
            </el-button>
          </div>
        </div>
      </template>
    </PremiumList>

    <InvitationDialog
      v-model="invitationDialogVisible"
      :tenant-id="tenantId"
      :initial-data="selectedInvitation"
      @success="emit('refresh')"
    />
  </div>
</template>

<style lang="scss" scoped>
.cell-payload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

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

.time-text {
  &.is-permanent {
    color: #3b82f6 !important;
  }
}
</style>
