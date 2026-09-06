<template>
  <div class="consent-container">
    <!-- 背景流光与环境光影 -->
    <div class="bg-mesh-gradient" />
    <div class="bg-grid-pattern" />
    <div class="ambient-glow glow-top" />
    <div class="ambient-glow glow-bottom" />

    <!-- 高级毛玻璃主体卡片 -->
    <div class="glass-card">
      <!-- 顶部高光亮线（微物理拟真光影） -->
      <div class="card-specular-highlight" />

      <!-- 加载态 -->
      <div v-if="loading" class="state-block">
        <div class="loading-orb">
          <el-icon :size="28" class="spin-icon"><Loading /></el-icon>
        </div>
        <h3 class="state-title">正在获取授权详情</h3>
        <p class="state-desc">正在建立端到端安全确认会话...</p>
      </div>

      <!-- 异常状态 -->
      <div v-else-if="error" class="state-block">
        <div class="error-orb">
          <el-icon :size="30"><CircleCloseFilled /></el-icon>
        </div>
        <h3 class="state-title">授权确认会话无效</h3>
        <p class="state-desc">{{ error }}</p>
        <button class="prime-action-btn mt-6" @click="goToLogin">
          <el-icon><RefreshRight /></el-icon>
          <span>返回登录页</span>
        </button>
      </div>

      <!-- 授权确认主要交互区 -->
      <div v-else-if="consentInfo" class="consent-content">
        <!-- 应用身份与关系建立区 -->
        <div class="app-identity-section">
          <div class="app-avatar-wrapper">
            <el-image v-if="consentInfo.client_logo" :src="consentInfo.client_logo" class="app-logo" fit="contain">
              <template #error>
                <div class="logo-fallback">
                  <el-icon :size="24"><Platform /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="logo-fallback">
              <el-icon :size="24"><Platform /></el-icon>
            </div>
          </div>

          <h2 class="app-name">{{ consentInfo.client_name || consentInfo.client_id }}</h2>
          <p class="app-sub-title">申请使用您的 EIAM 账号授权登录</p>
        </div>

        <!-- 当前授权账号微徽章 -->
        <div class="account-pill">
          <div class="user-avatar-circle">
            <el-icon :size="14"><User /></el-icon>
          </div>
          <span class="account-label">当前授权账号：</span>
          <span class="account-name">{{ consentInfo.username }}</span>
        </div>

        <div class="divider" />

        <!-- 权限申请清单 -->
        <div class="scopes-section">
          <div class="scopes-header">
            <span class="section-title">该应用将获得以下权限：</span>
          </div>

          <div class="scopes-list">
            <div v-for="(desc, index) in displayDescriptions" :key="index" class="scope-item">
              <div class="scope-icon-wrap">
                <el-icon :size="15" class="check-icon"><CircleCheckFilled /></el-icon>
              </div>
              <span class="scope-text">{{ desc }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮组 -->
        <div class="actions-container">
          <button class="prime-action-btn consent-btn" :disabled="submitting" @click="handleConsent(true)">
            <el-icon v-if="submitting && currentAction === 'approve'" class="spin-icon"><Loading /></el-icon>
            <el-icon v-else><Check /></el-icon>
            <span>同意授权并登录</span>
          </button>

          <button class="ghost-action-btn cancel-btn" :disabled="submitting" @click="handleConsent(false)">
            <span>拒绝</span>
          </button>
        </div>
      </div>

      <!-- 底部安全背书 -->
      <div class="security-endorsement">
        <span class="secure-dot" />
        <span class="secure-text">EIAM 统一身份认证 · RFC 6749 标准授权通道</span>
      </div>

      <!-- 隐藏的表单用于原生 POST 提交以触发服务端的 302 跨域重定向 -->
      <form ref="consentFormRef" method="POST" action="/oauth/v2/consent" style="display: none">
        <input type="hidden" name="consent_id" :value="consentInfo?.consent_id || ''" />
        <input type="hidden" name="approved" :value="approvedValue" />
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  RefreshRight,
  Platform,
  User,
  Check
} from "@element-plus/icons-vue"
import { getConsentInfoApi } from "@/api/iam/idp"
import type { ConsentInfo } from "@/api/iam/idp/type"

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const error = ref("")
const consentInfo = ref<ConsentInfo | null>(null)
const currentAction = ref<"approve" | "deny">("approve")
const approvedValue = ref("true")
const consentFormRef = ref<HTMLFormElement | null>(null)

const goToLogin = () => router.push("/login")

const displayDescriptions = computed(() => {
  if (consentInfo.value?.scope_descriptions && consentInfo.value.scope_descriptions.length > 0) {
    return consentInfo.value.scope_descriptions
  }
  return ["获取您的基本个人信息以供单点登录识别"]
})

const handleConsent = (approved: boolean) => {
  if (submitting.value || !consentInfo.value) return
  submitting.value = true
  currentAction.value = approved ? "approve" : "deny"
  approvedValue.value = approved ? "true" : "false"

  // 原生表单提交：由浏览器直接向后端 POST /oauth/v2/consent 发送请求
  // 后端签发 code 或处理拒绝后将直接 302 重定向到下游业务系统（如 GitLab 的 redirect_uri）
  nextTick(() => {
    if (consentFormRef.value) {
      consentFormRef.value.submit()
    }
  })
}

onMounted(async () => {
  const consentId = route.query.consent_id as string
  if (!consentId) {
    error.value = "缺少必要的授权会话标识 (consent_id)"
    loading.value = false
    return
  }

  try {
    const res = await getConsentInfoApi(consentId)
    consentInfo.value = res.data
  } catch (err: any) {
    error.value = err.message || "授权会话已失效或不存在，请重新发起登录"
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.consent-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background-color: #f8fafc;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  padding: 24px;
  box-sizing: border-box;
}

.bg-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(148, 163, 184, 0.28) 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  z-index: 0;
}

.bg-mesh-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(241, 245, 249, 0.8) 0%, #f8fafc 100%);
  z-index: 0;
}

.ambient-glow {
  position: absolute;
  width: 540px;
  height: 540px;
  border-radius: 50%;
  filter: blur(130px);
  pointer-events: none;
  z-index: 0;

  &.glow-top {
    top: -180px;
    left: 25%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 70%);
  }

  &.glow-bottom {
    bottom: -180px;
    right: 25%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0) 70%);
  }
}

.glass-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 36px 32px 24px;
  box-shadow:
    0 0 0 1px rgba(226, 232, 240, 0.65),
    0 4px 6px -1px rgba(15, 23, 42, 0.03),
    0 24px 48px -12px rgba(15, 23, 42, 0.09);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-specular-highlight {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 999px;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 0;
  width: 100%;

  .loading-orb,
  .error-orb {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .loading-orb {
    background: #f1f5f9;
    color: #0284c7;
  }

  .error-orb {
    background: #fef2f2;
    color: #ef4444;
  }

  .state-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .state-desc {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

.consent-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-identity-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  text-align: center;

  .app-avatar-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    background: #ffffff;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(226, 232, 240, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 12px;

    .app-logo {
      width: 44px;
      height: 44px;
    }

    .logo-fallback {
      color: #6366f1;
    }
  }

  .app-name {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .app-sub-title {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

.account-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.8);
  border: 1px solid #e2e8f0;
  font-size: 12px;
  margin-bottom: 18px;

  .user-avatar-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #cbd5e1;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;
  }

  .account-label {
    color: #64748b;
  }

  .account-name {
    font-weight: 600;
    color: #0f172a;
  }
}

.divider {
  width: 100%;
  height: 1px;
  background: #f1f5f9;
  margin-bottom: 16px;
}

.scopes-section {
  width: 100%;
  margin-bottom: 24px;

  .scopes-header {
    margin-bottom: 10px;
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  .scopes-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(248, 250, 252, 0.7);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 14px;
  }

  .scope-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .scope-icon-wrap {
      margin-top: 2px;
      color: #10b981;
      display: flex;
      align-items: center;
    }

    .scope-text {
      font-size: 13px;
      line-height: 1.4;
      color: #334155;
    }
  }
}

.actions-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.prime-action-btn {
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.ghost-action-btn {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.security-endorsement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  .secure-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  }

  .secure-text {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
  }
}

.spin-icon {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
