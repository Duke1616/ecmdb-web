<script setup lang="ts">
import { ref } from "vue"
import { Plus, Link, Check, Close, CopyDocument, Delete } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import InvitationDialog from "./InvitationDialog.vue"
import { useTenantGovernance } from "../../composables/useTenantGovernance"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"
import dayjs from "dayjs"

const props = defineProps<{
  tenantId: number
}>()

const activeTab = ref("links")
const invitationDialogVisible = ref(false)
const { toClipboard } = useClipboard()

const {
  links,
  linksTotal,
  linksLoading,
  linksQuery,
  handleLinksPageChange,
  handleRevokeInvitation,
  fetchLinks,
  requests,
  requestsTotal,
  requestsLoading,
  requestsQuery,
  handleRequestsPageChange,
  handleApproval
} = useTenantGovernance(() => props.tenantId, activeTab)

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
  <div class="invitation-governance">
    <!-- 功能切换页签 -->
    <el-tabs v-model="activeTab" class="governance-tabs">
      <!-- 邀请链接治理 -->
      <el-tab-pane name="links">
        <template #label>
          <div class="tab-label">
            <el-icon><Link /></el-icon>
            <span>活跃邀请链接</span>
            <el-badge v-if="linksTotal > 0" :value="linksTotal" class="tab-badge" />
          </div>
        </template>

        <PremiumList
          title="邀请资产列表"
          :data="links"
          :loading="linksLoading"
          :total="linksTotal"
          :current-page="linksQuery.currentPage"
          :page-size="linksQuery.pageSize"
          @page-change="handleLinksPageChange"
          :show-search="false"
          indicator-color="#3b82f6"
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
              <!-- 邀请码标识 -->
              <div class="cell-identity">
                <AssetIdentityCell :title="row.code" sub-title="点击复制邀请链接" @click="copyLink(row.code)" />
              </div>

              <!-- 载荷情况 -->
              <div class="cell-payload">
                <div class="usage-info">
                  <span class="used">{{ row.used_count }}</span>
                  <span class="divider">/</span>
                  <span class="total">{{ row.max_uses === 0 ? "∞" : row.max_uses }}</span>
                </div>
                <div class="usage-label">已用 / 上限</div>
              </div>

              <!-- 过期时间 -->
              <div class="cell-expiry">
                <span class="time-text" :class="{ 'is-permanent': row.expire_at === 0 }">
                  {{ row.expire_at === 0 ? "永久有效" : formatTime(row.expire_at) }}
                </span>
              </div>

              <!-- 审批模式 -->
              <div class="cell-mode">
                <el-tag :type="row.require_approval ? 'warning' : 'success'" effect="plain" size="small">
                  {{ row.require_approval ? "需审核" : "自动通过" }}
                </el-tag>
              </div>

              <!-- 动作 -->
              <div class="cell-actions align-center">
                <el-button type="primary" link size="small" @click="copyLink(row.code)">
                  <el-icon><CopyDocument /></el-icon>
                  <span>复制</span>
                </el-button>
                <el-button type="danger" link size="small" @click="handleRevokeInvitation(row)">
                  <el-icon><Delete /></el-icon>
                  <span>撤回</span>
                </el-button>
              </div>
            </div>
          </template>
        </PremiumList>
      </el-tab-pane>

      <!-- 入驻申请审批 -->
      <el-tab-pane name="requests">
        <template #label>
          <div class="tab-label">
            <el-icon><Check /></el-icon>
            <span>入驻申请审批</span>
            <el-badge v-if="requestsTotal > 0" :value="requestsTotal" type="danger" class="tab-badge" />
          </div>
        </template>

        <PremiumList
          title="审批任务队列"
          :data="requests"
          :loading="requestsLoading"
          :total="requestsTotal"
          :current-page="requestsQuery.currentPage"
          :page-size="requestsQuery.pageSize"
          @page-change="handleRequestsPageChange"
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
              <!-- 用户信息 -->
              <div class="cell-user">
                <AssetIdentityCell :title="row.nickname || row.username" :sub-title="row.username" />
              </div>

              <!-- 邀请码 -->
              <div class="cell-code mono">
                {{ row.invitation_code || "自主入驻" }}
              </div>

              <!-- 时间 -->
              <div class="cell-time">
                <span class="time-text">{{ formatTime(row.ctime) }}</span>
              </div>

              <!-- 角色数量 -->
              <div class="cell-roles">
                <el-tooltip :content="row.role_codes.join(', ')" placement="top" v-if="row.role_codes.length > 0">
                  <el-tag size="small" type="info">{{ row.role_codes.length }} 个预设角色</el-tag>
                </el-tooltip>
                <span v-else class="text-muted">无</span>
              </div>

              <!-- 操作 -->
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
      </el-tab-pane>
    </el-tabs>

    <!-- 弹窗：生成邀请链接 -->
    <InvitationDialog v-model="invitationDialogVisible" :tenant-id="tenantId" @success="fetchLinks" />
  </div>
</template>

<style lang="scss" scoped>
.invitation-governance {
  padding: 8px 0;
}

.governance-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;

    .tab-badge {
      margin-left: 4px;
      :deep(.el-badge__content) {
        border: none;
        transform: translateY(-2px);
      }
    }
  }
}

/* 列表栅格定义 - 邀请链接 */
.invitation-governance .link-cols {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1.2fr;
  align-items: stretch;
  gap: 16px;
}

/* 列表栅格定义 - 申请审批 */
.invitation-governance .request-cols {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1.2fr;
  align-items: stretch;
  gap: 16px;
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
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
}

:deep(.toolbar-action-btn) {
  height: 32px;
  font-size: 12px;
  border-radius: 6px;
  font-weight: 600;
}
</style>
