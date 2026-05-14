<template>
  <ProGovernanceLayout
    title="认证管理"
    subtitle="多租户身份治理中心，集成 Windows AD、飞书 OIDC 等企业级身份源"
    :add-config="{ label: '集成身份源' }"
    @refresh="handleRefresh"
    @add="handleCreate"
  >
    <!-- 治理列表 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <template #name="{ row }">
        <AssetIdentityCell :title="row.name" :sub-title="row.id" centered />
      </template>

      <template #type="{ row }">
        <div class="provider-cell">
          <img :src="getProviderInfo(row).icon" class="provider-icon" alt="icon" />
          <span class="main-name-text">{{ getProviderInfo(row).label }}</span>
        </div>
      </template>

      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "已启用" : "已禁用" }}
        </el-tag>
      </template>

      <template #sync="{ row }">
        <template v-if="row.type === IdentitySourceType.LDAP">
          <el-button type="primary" link class="sync-btn" @click="handleSyncUsers">
            <el-icon class="mr-1"><Refresh /></el-icon>
            同步用户
          </el-button>
        </template>
        <template v-else>
          <span class="text-slate-400">--</span>
        </template>
      </template>

      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 配置侧滑窗 (Drawer) - 严格遵循 TaskManager 标准 -->
    <Drawer
      v-model="formVisible"
      :title="currentEditId ? '治理现有身份源' : '集成新企业身份源'"
      :subtitle="
        currentEditId
          ? '调整当前集成协议的连接参数与属性映射逻辑'
          : '配置基于标准协议的身份提供商，实现企业级 SSO 统一接入'
      "
      size="38%"
      :header-icon="Share"
      :confirm-loading="submitting"
      @confirm="handleDrawerConfirm"
      @cancel="formVisible = false"
    >
      <IdentitySourceForm
        ref="formRef"
        :key="currentEditId || 'new'"
        :is-edit="!!currentEditId"
        :data="editData"
        @success="handleFormSuccess"
      />
    </Drawer>

    <!-- LDAP 同步弹窗 -->
    <LdapSyncDialog v-model="syncVisible" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from "vue"
import { Share, Edit, VideoPause, VideoPlay, Delete, Refresh } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import { Drawer } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import IdentitySourceForm from "./components/IdentitySourceForm.vue"
import LdapSyncDialog from "./components/LdapSyncDialog.vue"
import { useIdentitySource } from "./composables/useIdentitySource"
import { IdentitySourceType, OIDCProviderType, type IdentitySourceVO } from "@/api/iam/identity-source/type"

// 导入自定义 SVG 图标
import adIcon from "./svg/Windows AD.svg"
import ldapIcon from "./svg/ldap.svg"
import feishuIcon from "./svg/feishu.svg"
import oidcIcon from "./svg/oidc.svg"
import passkeyIcon from "./svg/webauthn.svg"
import localIcon from "./svg/pass.svg"

import type { Column } from "@@/components/DataTable/types"

const {
  loading,
  sources,
  formVisible,
  syncVisible,
  currentEditId,
  editData,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleToggleStatus,
  handleSyncUsers,
  handleFormSuccess
} = useIdentitySource()

/**
 * 打包表格通用属性，实现模板瘦身
 */
const tableProps = computed(() => ({
  loading: loading.value,
  data: sources.value,
  showPagination: false,
  showSelection: false
}))

const formRef = ref<InstanceType<typeof IdentitySourceForm>>()
const submitting = ref(false)

const tableColumns: Column[] = [
  { label: "身份源名称", prop: "name", slot: "name", align: "center" },
  { label: "集成类型", prop: "type", slot: "type", align: "center" },
  { label: "运行状态", prop: "enabled", slot: "enabled", align: "center" },
  { label: "用户同步", prop: "sync", slot: "sync", width: 140, align: "center" }
]

const getOperateItems = (row: IdentitySourceVO) => {
  const items = []
  items.push({ name: "配置", code: "edit", type: "primary", icon: markRaw(Edit) })

  if (row.enabled) {
    items.push({ name: "禁用", code: "toggle", type: "warning", icon: markRaw(VideoPause) })
  } else {
    items.push({ name: "启用", code: "toggle", type: "success", icon: markRaw(VideoPlay) })
  }

  items.push({ name: "删除", code: "delete", type: "danger", icon: markRaw(Delete) })
  return items
}

const handleOperate = (row: IdentitySourceVO, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "toggle") handleToggleStatus(row)
  if (code === "delete") handleDelete(row)
}

const handleDrawerConfirm = async () => {
  if (!formRef.value) return
  submitting.value = true
  try {
    await formRef.value.submit()
  } finally {
    submitting.value = false
  }
}

const getProviderInfo = (row: IdentitySourceVO) => {
  if (row.type === IdentitySourceType.LDAP) {
    // 简单判定是否为 AD (通过名称或特定配置，这里简单以名称判定示例，实际可按业务逻辑)
    const isAD = row.name.toLowerCase().includes("ad") || row.name.includes("域")
    return {
      label: isAD ? "Windows AD" : "LDAP",
      icon: isAD ? adIcon : ldapIcon
    }
  }
  if (row.type === IdentitySourceType.OIDC) {
    const isFeishu = row.oidc?.provider_type === OIDCProviderType.FEISHU
    return {
      label: isFeishu ? "飞书 SSO" : "通用 OIDC",
      icon: isFeishu ? feishuIcon : oidcIcon
    }
  }
  if (row.type === IdentitySourceType.PASSKEY) {
    return { label: "Passkey", icon: passkeyIcon }
  }
  return { label: "静态密码", icon: localIcon }
}
</script>

<style lang="scss" scoped>
.eiam-governance-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-name-text {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.provider-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .provider-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
}

.sync-btn {
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
  &:hover {
    color: #2563eb;
  }
  .mr-1 {
    margin-right: 4px;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, monospace;
}
</style>
