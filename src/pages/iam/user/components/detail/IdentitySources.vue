<script setup lang="ts">
import { Link, Refresh } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
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
    indicator-color="#10b981"
    hide-pagination
    empty-text="主体暂未绑定任何外部身份源"
  >
    <template #item="{ item }">
      <div class="item-card">
        <div class="item-content">
          <div class="identity-info">
            <div class="provider-info">
              <span class="provider-badge" :class="item.provider.toLowerCase()">{{ item.provider }}</span>
              <div class="id-row">
                <el-icon class="link-icon"><Link /></el-icon>
                <code class="provider-id">{{ getIdentityId(item) || user.username }}</code>
              </div>
            </div>
            <p class="desc-text">通过 {{ item.provider }} 协议同步的主体身份，支持跨域认证委派。</p>
          </div>

          <div class="item-actions">
            <el-button type="primary" link size="small" class="action-link">
              <el-icon><Refresh /></el-icon>
              <span>重新同步</span>
            </el-button>
            <el-button type="danger" link size="small" class="action-link">
              <el-icon><Unlink /></el-icon>
              <span>解除绑定</span>
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.item-card {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.25s ease;

  &:hover {
    border-color: #cbd5e1;
    background: #f0fdf4;
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
  }

  .item-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
}

.identity-info {
  .provider-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;

    .provider-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #e2e8f0;
      color: #475569;
      text-transform: uppercase;

      &.ldap {
        background: #dbeafe;
        color: #1e40af;
      }
      &.wechat {
        background: #dcfce7;
        color: #166534;
      }
      &.feishu {
        background: #e0e7ff;
        color: #4338ca;
      }
    }

    .id-row {
      display: flex;
      align-items: center;
      gap: 4px;
      .link-icon {
        font-size: 11px;
        color: #94a3b8;
      }
      .provider-id {
        font-size: 11px;
        color: #64748b;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      }
    }
  }

  .desc-text {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
    max-width: 500px;
  }
}

.item-actions {
  display: flex;
  gap: 12px;

  .action-link {
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
