<template>
  <div class="result-stage">
    <!-- 成功提示条 -->
    <div class="success-banner">
      <div class="success-icon-wrap">
        <el-icon><Check /></el-icon>
      </div>
      <div class="success-text">
        <strong>{{ isDetailMode ? "邀请凭证详情" : "邀请链接已就绪" }}</strong>
        <span>{{ isDetailMode ? "该凭证的治理配置摘要" : "链接已生成，可立即分发给新成员" }}</span>
      </div>
    </div>

    <!-- QR + 链接：水平排列 -->
    <div class="share-row">
      <!-- 二维码 -->
      <div class="qr-wrap">
        <qrcode-vue :value="displayLink" :size="120" level="H" render-as="svg" foreground="#0f172a" />
        <span class="qr-label">扫码申请加入</span>
      </div>

      <!-- 链接复制 -->
      <div class="link-wrap">
        <div class="link-label">
          <el-icon><LinkIcon /></el-icon>
          <span>专属邀请链接</span>
        </div>
        <div class="link-copy-row">
          <div class="link-url-box">{{ displayLink }}</div>
          <el-button type="primary" class="copy-btn" @click="emit('copy')">
            <el-icon><CopyDocument /></el-icon>
            <span>复制</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 参数摘要：横向一行 4 格 -->
    <div class="meta-strip">
      <div class="meta-item">
        <div class="meta-icon users">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="meta-info">
          <span class="meta-label">可邀请</span>
          <span class="meta-value">{{ displaySummary.max_uses === 0 ? "不限" : displaySummary.max_uses + " 人" }}</span>
        </div>
      </div>
      <div class="meta-divider" />
      <div class="meta-item">
        <div class="meta-icon timer">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="meta-info">
          <span class="meta-label">有效期</span>
          <span class="meta-value">{{ displayExpiry }}</span>
        </div>
      </div>
      <div class="meta-divider" />
      <div class="meta-item">
        <div class="meta-icon roles">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="meta-info">
          <span class="meta-label">绑定角色</span>
          <span class="meta-value">{{
            displaySummary.role_codes.length ? displaySummary.role_codes.length + " 个" : "默认"
          }}</span>
        </div>
      </div>
      <div class="meta-divider" />
      <div class="meta-item">
        <div class="meta-icon shield">
          <el-icon><QuestionFilled /></el-icon>
        </div>
        <div class="meta-info">
          <span class="meta-label">审批</span>
          <span class="meta-value">{{ displaySummary.require_approval ? "人工审核" : "自动准入" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Link as LinkIcon, CopyDocument, UserFilled, Timer, QuestionFilled } from "@element-plus/icons-vue"
import QrcodeVue from "qrcode.vue"

defineProps<{
  isDetailMode: boolean
  displayLink: string
  displaySummary: any
  displayExpiry: string
}>()

const emit = defineEmits<{
  copy: []
}>()
</script>

<style lang="scss" scoped>
.result-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 14px;

  .success-icon-wrap {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
  }

  .success-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    strong {
      font-size: 15px;
      font-weight: 800;
      color: #065f46;
    }
    span {
      font-size: 12px;
      color: #047857;
    }
  }
}

.share-row {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.qr-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  }
  .qr-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
  }
}

.link-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;

  .link-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .link-copy-row {
    display: flex;
    gap: 10px;
    align-items: center;
    .link-url-box {
      flex: 1;
      min-width: 0;
      height: 38px;
      line-height: 38px;
      padding: 0 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 12px;
      font-family: ui-monospace, monospace;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .copy-btn {
      height: 38px;
      border-radius: 10px;
      font-weight: 700;
    }
  }
}

.meta-strip {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.meta-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
  margin: 0 16px;
}

.meta-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  .meta-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    &.users {
      background: #eff6ff;
      color: #3b82f6;
    }
    &.timer {
      background: #fef3c7;
      color: #d97706;
    }
    &.roles {
      background: #f5f3ff;
      color: #8b5cf6;
    }
    &.shield {
      background: #ecfdf5;
      color: #10b981;
    }
  }
  .meta-info {
    display: flex;
    flex-direction: column;
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
  }
}
</style>
