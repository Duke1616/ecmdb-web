<template>
  <FormDialog
    v-model="visible"
    title="安全凭据已生成"
    subtitle="密钥明文仅在此时呈现一次，请立即复制并妥善保管"
    width="520px"
    :header-icon="Key"
    confirm-text="我已妥善保存"
    :show-footer-info="false"
    :show-close="true"
    @confirm="visible = false"
    @cancel="visible = false"
  >
    <div class="credential-dialog-body">
      <!-- 极简精致的安全提醒条 -->
      <div class="security-warning-banner">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <span class="warning-text"> 基于安全合规要求，关闭此弹窗后系统将无法再次显示密钥明文。如遗失须重新重置。 </span>
      </div>

      <!-- 凭据信息卡片组 -->
      <div class="credential-cards">
        <div class="credential-row">
          <div class="row-label">接入应用</div>
          <div class="row-value app-name">
            <span>{{ clientName }}</span>
          </div>
        </div>

        <div class="credential-row">
          <div class="row-label">客户端标识 (Client ID)</div>
          <div class="row-value code-box">
            <span class="mono code-text">{{ clientId }}</span>
            <el-button link type="primary" size="small" class="copy-btn" @click="copyText(clientId, 'Client ID')">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>

        <div class="credential-row">
          <div class="row-label">客户端密钥 (Client Secret)</div>
          <div class="row-value code-box">
            <span class="mono code-text">{{ clientSecret }}</span>
            <el-button
              link
              type="primary"
              size="small"
              class="copy-btn"
              @click="copyText(clientSecret, 'Client Secret')"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { Key, WarningFilled, CopyDocument } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"
import { copyToClipboard } from "@@/utils/clipboard"

// NOTE: 该组件为纯 UI 安全凭据弹窗控制器，由父组件控制显示与关闭
const visible = defineModel<boolean>({ default: false })

defineProps<{
  clientName: string
  clientId: string
  clientSecret: string
}>()

const copyText = (text: string, title = "内容") => {
  copyToClipboard(text, `已复制 ${title} 到剪贴板`)
}
</script>

<style lang="scss" scoped>
:deep(.form-dialog-footer) {
  .cancel-btn {
    display: none;
  }
}

.credential-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 8px 0;
}

.security-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;

  .warning-icon {
    font-size: 15px;
    color: #d97706;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .warning-text {
    font-size: 12px;
    color: #92400e;
    line-height: 1.4;
  }
}

.credential-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.credential-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .row-label {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
  }

  .row-value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s;

    &.app-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    &.code-box {
      background: #f1f5f9;
      border-color: #cbd5e1;

      .code-text {
        font-size: 13px;
        color: #334155;
        word-break: break-all;
      }
    }
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
