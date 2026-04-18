<script setup lang="ts">
import { DocumentCopy } from "@element-plus/icons-vue"
import type { User } from "@/api/iam/user/type"

defineProps<{
  user: User
  formatTimestamp: (ts: number | string) => string
}>()

const emit = defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <div class="governance-section-card">
    <div class="section-title">
      <span class="title-text">基础身份资产</span>
    </div>
    <div class="asset-grid">
      <div class="grid-col">
        <div class="kv-item">
          <div class="k">登录名称</div>
          <div class="v copyable">
            <span>{{ user.username }}</span>
            <el-icon class="copy-icon" @click="emit('copy', user.username)"><DocumentCopy /></el-icon>
          </div>
        </div>
        <div class="kv-item">
          <div class="k">显示名称</div>
          <div class="v">{{ user.nickname || "-" }}</div>
        </div>
      </div>
      <div class="grid-col">
        <div class="kv-item">
          <div class="k">岗位职称</div>
          <div class="v">{{ user.job_title || "-" }}</div>
        </div>
        <div class="kv-item">
          <div class="k">手机号码</div>
          <div class="v copyable">
            <span>{{ user.phone || "-" }}</span>
            <el-icon v-if="user.phone" class="copy-icon" @click="emit('copy', user.phone)"><DocumentCopy /></el-icon>
          </div>
        </div>
      </div>
      <div class="grid-col">
        <div class="kv-item">
          <div class="k">电子邮箱</div>
          <div class="v">{{ user.email || "-" }}</div>
        </div>
        <div class="kv-item">
          <div class="k">创建时间</div>
          <div class="v">{{ formatTimestamp(user.ctime) }}</div>
        </div>
      </div>
      <div class="grid-col">
        <div class="kv-item">
          <div class="k">最近登录</div>
          <div class="v">{{ user.last_login_at ? formatTimestamp(user.last_login_at) : "从未登录" }}</div>
        </div>
        <div class="kv-item">
          <div class="k">更新时间</div>
          <div class="v">{{ formatTimestamp(user.utime) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.governance-section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;

  .section-title {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    .title-text {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      padding-left: 10px;
      border-left: 3px solid #6366f1;
    }
  }
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  .kv-item {
    margin-bottom: 16px;
    &:last-child {
      margin-bottom: 0;
    }

    .k {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .v {
      font-size: 13px;
      color: #0f172a;
      font-weight: 700;
      &.copyable {
        display: flex;
        align-items: center;
        gap: 6px;
        .copy-icon {
          color: #6366f1;
          cursor: pointer;
          font-size: 12px;
          opacity: 0.5;
          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
