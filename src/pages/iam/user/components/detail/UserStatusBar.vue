<script setup lang="ts">
import type { User } from "@/api/iam/user/type"

defineProps<{
  user?: User
}>()
</script>

<template>
  <div class="governance-status-bar">
    <div class="status-item">
      <div class="dot active" />
      <span class="label">控制台登录:</span>
      <span class="value success">已激活</span>
    </div>
    <div class="divider" />
    <div class="status-item">
      <span class="label">账号来源:</span>
      <span class="value source-type" :class="user?.source">
        {{
          user?.source === "local"
            ? "本地账户"
            : user?.source === "ldap"
              ? "LDAP 同步"
              : user?.source === "feishu"
                ? "飞书同步"
                : user?.source === "wechat"
                  ? "微信同步"
                  : user?.source || "未知"
        }}
      </span>
    </div>
    <template v-if="user?.is_member !== undefined">
      <div class="divider" />
      <div class="status-item">
        <div class="dot" :class="user?.is_member ? 'success' : 'inactive'" />
        <span class="label">入驻状态:</span>
        <span class="value" :class="user?.is_member ? 'success' : 'info'">
          {{ user?.is_member ? "已入驻本空间" : "尚未入驻" }}
        </span>
      </div>
    </template>
    <div class="divider" />
    <div class="status-item">
      <div class="dot inactive" />
      <span class="label">MFA 状态:</span>
      <span class="value warning">未绑定</span>
    </div>
    <div class="divider" />
    <div class="status-item">
      <div class="dot success" />
      <span class="label">风险等级:</span>
      <span class="value low">0 (安全)</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.governance-status-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;

  .status-item {
    display: flex;
    align-items: center;
    font-size: 13px;
    gap: 8px;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.active,
      &.success {
        background: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
      }
      &.inactive,
      &.warning {
        background: #f59e0b;
      }
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      font-weight: 700;
      &.success {
        color: #10b981;
      }
      &.warning {
        color: #f59e0b;
      }
      &.info {
        color: #94a3b8;
      }
      &.low {
        color: #6366f1;
      }
      &.source-type {
        &.ldap {
          color: #0ea5e9;
        }
        &.feishu {
          color: #2563eb;
        }
        &.wechat {
          color: #16a34a;
        }
        &.local {
          color: #64748b;
        }
      }
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
  }
}
</style>
