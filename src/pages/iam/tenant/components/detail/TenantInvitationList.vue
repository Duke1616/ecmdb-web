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

const selection = defineModel<InvitationVO[]>("selection", { default: () => [] })

withDefaults(
  defineProps<{
    data: InvitationVO[]
    loading: boolean
    total: number
    currentPage: number
    pageSize: number
    tenantId?: number
    canAdd?: boolean
    canRevoke?: boolean
    canBatchRevoke?: boolean
    selectable?: (row: InvitationVO) => boolean
  }>(),
  {
    canAdd: true,
    canRevoke: true,
    canBatchRevoke: true
  }
)

const emit = defineEmits<{
  pageChange: [page: number]
  search: [val: string]
  revoke: [row: InvitationVO]
  batchRevoke: []
  refresh: []
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
      v-model:selection="selection"
      title="邀请凭证列表"
      :data="data"
      :loading="loading"
      :total="total"
      :current-page="currentPage"
      :pageSize="pageSize"
      @page-change="(page) => emit('pageChange', page)"
      :show-search="false"
      indicator-color="#3b82f6"
      show-selection
      :selectable="selectable"
      row-key="code"
    >
      <template #header-actions>
        <el-button class="u-gov-btn" :disabled="!canAdd" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          <span>初始化凭证</span>
        </el-button>
      </template>

      <template #batch-actions>
        <el-button class="u-gov-btn is-danger" :disabled="!canBatchRevoke" @click="emit('batchRevoke')">
          <el-icon><Delete /></el-icon>
          <span>批量撤回凭证</span>
        </el-button>
      </template>

      <template #column-header>
        <div class="gov-table-grid is-header is-invitation u-gov-label">
          <span>邀请码 / 分享</span>
          <span class="align-center">载荷情况</span>
          <span>预设角色</span>
          <span>有效期限</span>
          <span class="align-center">审批模式</span>
          <span class="align-center">操作</span>
        </div>
      </template>

      <template #item="{ item: row }">
        <div class="gov-table-grid is-row is-invitation">
          <div class="cell-identity">
            <AssetIdentityCell :title="row.code" sub-title="点击复制邀请链接" clickable @click="copyLink(row.code)" />
          </div>

          <div class="cell-payload">
            <div class="usage-info">
              <span class="used">{{ row.used_count }}</span>
              <span class="divider">/</span>
              <span class="total">{{ row.max_uses === 0 ? "∞" : row.max_uses }}</span>
            </div>
            <div class="usage-label">已用 / 上限</div>
          </div>

          <div class="cell-roles">
            <div class="role-tags">
              <template v-if="row.role_codes && row.role_codes.length > 0">
                <el-tag
                  v-for="role in row.role_codes"
                  :key="role"
                  size="small"
                  type="info"
                  effect="light"
                  class="role-tag"
                >
                  {{ role }}
                </el-tag>
              </template>
              <span v-else class="empty-text">默认角色</span>
            </div>
          </div>

          <div class="cell-time">
            <span class="time-text" :class="{ 'is-permanent': row.expire_at === 0 }">
              {{ row.expire_at === 0 ? "永久有效" : formatTime(row.expire_at) }}
            </span>
          </div>

          <div class="cell-status">
            <div class="minimal-status" :class="row.require_approval ? 'warning' : 'success'">
              <span class="dot" />
              <span class="text">{{ row.require_approval ? "需审核" : "自动通过" }}</span>
            </div>
          </div>

          <div class="cell-actions align-center">
            <el-button
              type="danger"
              link
              size="small"
              class="delete-btn"
              :disabled="!canRevoke"
              @click="handleRevoke(row)"
            >
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

.cell-roles {
  display: flex;
  align-items: center;
  min-width: 0;
  .role-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 100%;
  }
  .role-tag {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 4px;
    background: #f1f5f9;
    border-color: #e2e8f0;
    color: #475569;
    font-weight: 500;
  }
  .empty-text {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
  }
}

/* 调整 Grid 比例：邀请码(280) | 载荷(100) | 角色(自适应) | 时间(180) | 审批(100) | 操作(80) */
:deep(.is-invitation) {
  grid-template-columns: 280px 120px 1fr 200px 200px 80px !important;
  align-items: center;
}
</style>
