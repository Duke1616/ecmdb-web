<template>
  <Drawer
    v-model="visible"
    title="操作审计详情"
    subtitle="查看主体操作者、受控资产 URN 与数据变更快照"
    :header-icon="Document"
    size="560px"
    :show-footer="false"
  >
    <div v-if="record" class="drawer-body">
      <!-- 状态概要条 -->
      <div class="status-banner" :class="record.status === 'SUCCESS' ? 'is-success' : 'is-fail'">
        <div class="status-left">
          <span class="status-dot" />
          <span class="status-text">{{ record.status === "SUCCESS" ? "操作执行成功" : "操作执行失败" }}</span>
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

      <!-- 操作者信息卡片 -->
      <div class="info-card">
        <div class="card-title">操作者信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">操作账号</span>
            <span class="info-value font-semibold">{{ record.operator_name || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">操作人 UID</span>
            <span class="info-value uid-text">#{{ record.operator_id ?? "--" }}</span>
          </div>

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
            <span class="info-label">操作时间</span>
            <span class="info-value time-text">{{ formatTime(record.ctime) }}</span>
          </div>
        </div>
      </div>

      <!-- 目标受控资产卡片 -->
      <div class="info-card">
        <div class="card-title">受控目标资产</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">所属服务</span>
            <span class="info-value font-medium">{{ record.service || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">所属模块</span>
            <span class="info-value">{{ record.module || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">操作动作</span>
            <span class="info-value font-mono">{{ record.action || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">目标资源名称</span>
            <span class="info-value font-semibold">{{ record.resource_name || record.resource_id || "--" }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">资源 ID</span>
            <span class="info-value uid-text">{{ record.resource_id || "--" }}</span>
          </div>
        </div>

        <!-- 资源 URN -->
        <div v-if="record.resource_urn" class="urn-wrapper">
          <div class="urn-header">
            <span class="info-label">资源 URN</span>
            <el-button link type="primary" size="small" @click="handleCopy(record.resource_urn, '资源 URN 已复制')">
              复制
            </el-button>
          </div>
          <div class="urn-box" :title="record.resource_urn">
            {{ record.resource_urn }}
          </div>
        </div>
      </div>

      <!-- 终端网络环境卡片 -->
      <div class="info-card">
        <div class="card-title">终端网络环境</div>
        <div class="info-grid">
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

      <!-- 变更快照与参数上下文 (Snapshots - 仅当有快照数据时显示) -->
      <div v-if="record.after_state || record.before_state" class="info-card">
        <div class="card-title">变更快照与参数</div>

        <!-- 变更后/请求参数快照 -->
        <div v-if="record.after_state" class="snapshot-block">
          <div class="snapshot-header">
            <span class="info-label">请求体 / 变更后快照 (AfterState)</span>
            <el-button link type="primary" size="small" @click="handleCopy(formattedAfterState, '变更后快照已复制')">
              复制
            </el-button>
          </div>
          <pre class="snapshot-pre">{{ formattedAfterState }}</pre>
        </div>

        <!-- 变更前快照 -->
        <div v-if="record.before_state" class="snapshot-block">
          <div class="snapshot-header">
            <span class="info-label">变更前快照 (BeforeState)</span>
            <el-button link type="primary" size="small" @click="handleCopy(formattedBeforeState, '变更前快照已复制')">
              复制
            </el-button>
          </div>
          <pre class="snapshot-pre">{{ formattedBeforeState }}</pre>
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
import type { OperationLog } from "@/api/iam/audit/type"
import { formatUserAgent } from "../utils/ua"
import dayjs from "dayjs"

interface Props {
  record: OperationLog | null
}

const props = defineProps<Props>()

// NOTE: 该组件为纯 UI 抽屉控制器，显隐状态需与父组件双向同步
const visible = defineModel<boolean>("visible", { default: false })

const envInfo = computed(() => formatUserAgent(props.record?.user_agent))

const formatJsonString = (str?: string) => {
  if (!str) return ""
  try {
    const obj = JSON.parse(str)
    return JSON.stringify(obj, null, 2)
  } catch {
    return str
  }
}

const formattedAfterState = computed(() => formatJsonString(props.record?.after_state))
const formattedBeforeState = computed(() => formatJsonString(props.record?.before_state))

const formatTime = (ts?: number) => {
  if (!ts) return "--"
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss")
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

/* 资源 URN 区域 */
.urn-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;

  .urn-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }

  .urn-box {
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

/* 快照区域 */
.snapshot-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  .snapshot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }

  .snapshot-pre {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.6;
    color: #334155;
    background-color: #f8fafc;
    border: 1px solid #e7edf4;
    border-radius: 6px;
    padding: 12px 14px;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 220px;
    overflow-y: auto;
  }
}
</style>
