<template>
  <ProGovernanceLayout
    title="接入应用"
    subtitle="管理支持单点登录的第三方系统与内部应用"
    search-placeholder="搜索应用名称或 Client ID..."
    v-model:keyword="query.keyword"
    :primary-action="{ capability: IAM_CAPABILITIES.OAuthClient.Add, label: '新建应用' }"
    @search="handleRefresh"
    @refresh="handleRefresh"
    @primary-action="handleCreate"
  >
    <!-- 治理列表 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <!-- 应用核心标识 -->
      <template #client_info="{ row }">
        <AssetIdentityCell :title="row.name" :sub-title="row.client_id" centered />
      </template>

      <!-- 回调地址 -->
      <template #redirect_uris="{ row }">
        <div class="redirect-uris-wrapper">
          <template v-if="row.redirect_uris && row.redirect_uris.length > 0">
            <el-tooltip placement="top" :show-after="100">
              <template #content>
                <div class="uris-tooltip-box">
                  <div v-for="(uri, idx) in row.redirect_uris" :key="idx" class="uri-item-line mono">
                    {{ uri }}
                  </div>
                </div>
              </template>
              <div class="uri-trigger">
                <span class="uri-text mono">{{ row.redirect_uris[0] }}</span>
                <el-tag v-if="row.redirect_uris.length > 1" size="small" type="info" round class="count-tag">
                  +{{ row.redirect_uris.length - 1 }}
                </el-tag>
              </div>
            </el-tooltip>
          </template>
          <span v-else class="text-muted">--</span>
        </div>
      </template>

      <!-- 客户端类型 -->
      <template #client_type="{ row }">
        <el-tag :type="row.is_public ? 'warning' : 'primary'" size="small" effect="light">
          {{ row.is_public ? "公共客户端" : "机密客户端" }}
        </el-tag>
      </template>

      <!-- 授权策略 -->
      <template #consent_type="{ row }">
        <div class="status-indicator" :class="row.auto_consent ? 'active' : 'info'">
          <span class="dot" />
          {{ row.auto_consent ? "免确认授权" : "需手动授权" }}
        </div>
      </template>

      <!-- 创建时间 -->
      <template #ctime="{ row }">
        <span class="time-text">{{ formatDateTime(row.ctime) }}</span>
      </template>

      <!-- 操作权限 -->
      <template #actions="{ row }">
        <OperateBtn :items="clientOperateItems" :operate-item="row" :max-length="2" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 应用新增与编辑弹窗 -->
    <OAuthClientDrawer v-model="formVisible" :id="currentEditId" @success="handleFormSuccess" />

    <!-- 密钥一次性安全呈现弹窗 -->
    <SecretDisplayDialog v-model="secretDialogVisible" v-bind="currentSecretInfo" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Edit, Delete, Key } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import OAuthClientDrawer from "./components/OAuthClientDrawer.vue"
import SecretDisplayDialog from "./components/SecretDisplayDialog.vue"
import { useOAuthClientList } from "./composables/useOAuthClientList"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { Column } from "@@/components/DataTable/types"
import type { OAuthClient } from "@/api/iam/idp/type"

const {
  clients,
  total,
  currentPage,
  pageSize,
  query,
  loading,
  formVisible,
  currentEditId,
  secretDialogVisible,
  currentSecretInfo,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleResetSecret,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useOAuthClientList()

const tableProps = computed(() => ({
  loading: loading.value,
  data: clients.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  showPagination: true,
  showSelection: false,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

const clientOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: IAM_CAPABILITIES.OAuthClient.Edit },
  {
    name: "重置",
    code: "reset_secret",
    type: "warning",
    icon: Key,
    capability: IAM_CAPABILITIES.OAuthClient.ResetSecret
  },
  { name: "注销", code: "delete", type: "danger", icon: Delete, capability: IAM_CAPABILITIES.OAuthClient.Delete }
]

const handleOperate = (row: OAuthClient, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "reset_secret") handleResetSecret(row)
  if (code === "delete") handleDelete(row)
}

const formatDateTime = (val?: string) => {
  if (!val) return "--"
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString("zh-CN", { hour12: false })
}

const tableColumns: Column[] = [
  { label: "应用信息", prop: "name", slot: "client_info", minWidth: 200, align: "center" },
  { label: "回调地址", prop: "redirect_uris", slot: "redirect_uris", minWidth: 380, align: "center" },
  { label: "客户端类型", prop: "is_public", slot: "client_type", minWidth: 120, align: "center" },
  { label: "授权策略", prop: "auto_consent", slot: "consent_type", minWidth: 140, align: "center" },
  { label: "创建时间", prop: "ctime", slot: "ctime", minWidth: 170, align: "center" }
]
</script>

<style lang="scss" scoped>
.redirect-uris-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;

  .uri-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    width: 100%;
    max-width: 100%;

    &:hover .uri-text {
      color: var(--el-color-primary);
    }
  }

  .uri-text {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-text-color-regular);
    transition: color 0.15s;
    text-align: center;
  }

  .count-tag {
    flex-shrink: 0;
  }
}

.uris-tooltip-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 480px;
  padding: 2px 0;

  .uri-item-line {
    font-size: 12px;
    line-height: 1.4;
    word-break: break-all;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.time-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.active {
    color: var(--el-color-success);
    .dot {
      background-color: var(--el-color-success);
    }
  }

  &.info {
    color: var(--el-color-info);
    .dot {
      background-color: var(--el-color-info);
    }
  }
}
</style>
