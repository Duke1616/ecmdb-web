<template>
  <Drawer
    v-model="visible"
    title="登录认证审计详情"
    subtitle="查看用户身份认证上下文与终端网络环境"
    :header-icon="Document"
    size="560px"
    :show-footer="false"
  >
    <div v-if="record" class="drawer-body">
      <!-- 状态概要条 -->
      <div class="status-banner" :class="getStatusClass(record.status)">
        <div class="status-left">
          <span class="status-dot" />
          <span class="status-text">{{ getStatusText(record.status) }}</span>
        </div>
        <div class="status-right">
          <span class="status-time">{{ formatTime(record.ctime) }}</span>
        </div>
      </div>

      <!-- 失败原因（若有） -->
      <div v-if="record.fail_reason" class="fail-banner">
        <el-icon class="fail-icon"><WarningFilled /></el-icon>
        <span class="fail-text">{{ record.fail_reason }}</span>
      </div>

      <!-- 认证信息卡片 -->
      <div class="info-card">
        <div class="card-title">认证主体信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">登录账号</span>
            <span class="info-value font-semibold">{{ record.username || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">用户 UID</span>
            <span class="info-value uid-text">#{{ record.user_id }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">认证方式</span>
            <span class="info-value font-medium">{{ getAuthTypeLabel(record.auth_type) }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">登录时间</span>
            <span class="info-value time-text">{{ formatTime(record.ctime) }}</span>
          </div>
        </div>
      </div>

      <!-- 网络与终端环境卡片 -->
      <div class="info-card">
        <div class="card-title">网络与终端环境</div>
        <div class="env-grid">
          <div class="info-item">
            <span class="info-label">客户端 IP</span>
            <div class="info-value ip-val">
              <code>{{ record.client_ip || "--" }}</code>
              <el-button
                v-if="record.client_ip"
                link
                type="primary"
                size="small"
                :icon="CopyDocument"
                class="copy-icon-btn"
                @click="handleCopy(record.client_ip, 'IP 已复制')"
              />
            </div>
          </div>

          <div class="info-item">
            <span class="info-label">操作系统</span>
            <span class="info-value">{{ envInfo.os }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">浏览器终端</span>
            <span class="info-value">{{ envInfo.browser }}</span>
          </div>
        </div>

        <!-- 完整 User-Agent 报文 -->
        <div class="ua-wrapper">
          <div class="ua-header">
            <span class="info-label">完整 User-Agent</span>
            <el-button
              v-if="record.user_agent"
              link
              type="primary"
              size="small"
              @click="handleCopy(record.user_agent, 'UA 已复制')"
            >
              复制
            </el-button>
          </div>
          <div class="ua-box" :title="record.user_agent">
            {{ record.user_agent || "--" }}
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Document, CopyDocument, WarningFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import type { AuthLog } from "@/api/iam/audit/type"
import { formatUserAgent } from "../utils/ua"
import dayjs from "dayjs"

interface Props {
  record: AuthLog | null
}

const props = defineProps<Props>()

// NOTE: 该组件为纯 UI 抽屉控制器，显隐状态需与父组件双向同步
const visible = defineModel<boolean>("visible", { default: false })

const envInfo = computed(() => formatUserAgent(props.record?.user_agent))

const formatTime = (ts?: number) => {
  if (!ts) return "--"
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss")
}

const getStatusClass = (status?: string) => {
  switch (status) {
    case "SUCCESS":
      return "is-success"
    case "LOCKED":
      return "is-locked"
    default:
      return "is-fail"
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case "SUCCESS":
      return "认证成功"
    case "LOCKED":
      return "账号锁定"
    default:
      return "认证失败"
  }
}

const getAuthTypeLabel = (authType?: string) => {
  const lower = (authType || "local").toLowerCase()
  switch (lower) {
    case "local":
    case "password":
      return "本地密码"
    case "ldap":
      return "LDAP 目录"
    case "oidc":
      return "OIDC / SSO"
    case "passkey":
      return "Passkey 密钥"
    case "mfa":
      return "MFA 二次验证"
    case "switch":
      return "租户空间切换"
    case "logout":
      return "退出登录"
    default:
      return authType || "--"
  }
}

const handleCopy = async (text?: string, msg = "复制成功") => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(msg)
  } catch {
    ElMessage.error("复制失败")
  }
}
</script>

<style lang="scss" scoped>
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 20px 24px;
}

/* 状态概要条 */
.status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 8px;
  border: 1px solid transparent;

  .status-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-text {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .auth-tag {
      font-weight: 500;
    }

    .status-time {
      font-size: 12px;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }

  &.is-success {
    background-color: #f0fdf4;
    border-color: #bbf7d0;

    .status-dot {
      background-color: #22c55e;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
    }
    .status-text {
      color: #15803d;
    }
  }

  &.is-fail {
    background-color: #fef2f2;
    border-color: #fecaca;

    .status-dot {
      background-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
    .status-text {
      color: #b91c1c;
    }
  }

  &.is-locked {
    background-color: #fffbeb;
    border-color: #fde68a;

    .status-dot {
      background-color: #f59e0b;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }
    .status-text {
      color: #b45309;
    }
  }
}

/* 失败告警条 */
.fail-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 12px;
  color: #dc2626;

  .fail-icon {
    font-size: 15px;
    flex-shrink: 0;
  }
}

/* 纯净白底信息卡片 */
.info-card {
  background: #ffffff;
  border: 1px solid #e7edf4;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  .card-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #1e293b;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "";
      width: 3px;
      height: 14px;
      background: #3b82f6;
      border-radius: 2px;
    }
  }
}

/* 2 列信息栅格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 28px;
}

/* 3 列环境栅格 */
.env-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .info-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .info-value {
    font-size: 13.5px;
    color: #0f172a;
    font-weight: 500;
    min-height: 22px;
    display: flex;
    align-items: center;

    &.font-semibold {
      font-weight: 600;
    }

    &.uid-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #475569;
    }

    &.time-text {
      color: #334155;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    &.ip-val {
      display: flex;
      align-items: center;
      gap: 6px;

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        color: #0f172a;
        font-weight: 600;
      }

      .copy-icon-btn {
        color: #94a3b8;
        padding: 0;
        height: auto;
        &:hover {
          color: #3b82f6;
        }
      }
    }
  }
}

/* 完整 User-Agent 报文 */
.ua-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;

  .ua-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }

  .ua-box {
    font-size: 11.5px;
    color: #475569;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    line-height: 1.6;
    background-color: #f8fafc;
    border: 1px solid #e7edf4;
    border-radius: 6px;
    padding: 10px 14px;
    word-break: break-all;
  }
}
</style>
