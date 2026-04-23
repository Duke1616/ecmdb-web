<script setup lang="ts">
import { Connection, Warning } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { User, Identity } from "@/api/iam/user/type"

defineProps<{
  user: User
}>()

/**
 * 动态获取身份源标识符
 */
const getIdentityId = (item: Identity) => {
  if (item.provider === "LDAP") return item.ldap_info?.dn
  if (item.provider === "WeChat") return item.wechat_info?.user_id
  if (item.provider === "Feishu") return item.feishu_info?.user_id
  return ""
}
</script>

<template>
  <PremiumList
    title="已绑定的身份源"
    :data="user.identities || []"
    :total="user.identities?.length || 0"
    indicator-color="#3b82f6"
    hide-pagination
    :show-search="false"
    show-selection
    :selectable="() => false"
    empty-text="主体暂未绑定任何外部身份源"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="source-cols header-label-font">
        <span>身份源类型 / 协议</span>
        <span>关联账号 / 外部标识</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 列表项内容 (对齐全局网格模式) -->
    <template #item="{ item: row }">
      <div class="source-grid-row">
        <!-- 身份源类型 -->
        <div class="cell-provider">
          <AssetIdentityCell
            :title="row.provider"
            :sub-title="row.provider === 'LDAP' ? 'RFC 4511' : 'OAuth 2.0'"
            :tag-style="false"
          />
        </div>

        <!-- 外部账号 -->
        <div class="cell-account">
          <div class="account-wrap">
            <el-icon class="link-icon"><Connection /></el-icon>
            <code class="account-code">{{ getIdentityId(row) || user.username }}</code>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="cell-actions">
          <el-button type="danger" link size="small" class="unbind-btn">
            <el-icon><Warning /></el-icon>
            <span>解除绑定</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.header-label-font {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.source-cols {
  display: grid;
  grid-template-columns: 240px 1fr 120px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.source-grid-row {
  display: grid;
  grid-template-columns: 240px 1fr 120px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  transition: background 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
}

.cell-account {
  .account-wrap {
    display: flex;
    align-items: center;
    gap: 8px;

    .link-icon {
      font-size: 14px;
      color: #94a3b8;
    }

    .account-code {
      font-size: 12px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-weight: 600;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.cell-actions {
  display: flex;
  justify-content: center;

  .unbind-btn {
    color: #cbd5e1;
    font-weight: 600;
    &:hover {
      color: #ef4444;
    }
  }
}
</style>
