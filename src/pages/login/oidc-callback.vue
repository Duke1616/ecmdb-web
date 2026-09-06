<template>
  <div class="callback-container">
    <!-- 背景流光与环境光影 -->
    <div class="bg-mesh-gradient" />
    <div class="bg-grid-pattern" />
    <div class="ambient-glow glow-top" />
    <div class="ambient-glow glow-bottom" />

    <!-- 高级毛玻璃主体卡片 -->
    <div class="glass-card">
      <!-- 顶部高光亮线（微物理拟真光影） -->
      <div class="card-specular-highlight" />

      <!-- 品牌区 -->
      <div class="brand-section">
        <img src="@@/assets/images/layouts/logo-标准.png" class="brand-logo" alt="ECMDB" />
      </div>

      <!-- 核心状态呈现区 -->
      <transition name="state-fade" mode="out-in">
        <!-- 1. 加载中状态 -->
        <div v-if="status === 'loading'" key="loading" class="state-block">
          <div class="status-orb-wrapper loading-wrapper">
            <div class="orbit-ring" />
            <div class="core-orb">
              <el-icon :size="24" class="spin-icon"><Loading /></el-icon>
            </div>
          </div>

          <h3 class="state-title">正在安全校验会话</h3>
          <p class="state-desc">正在与统一身份中心安全同步令牌凭证</p>

          <!-- 极简高质感流光进度条 -->
          <div class="stream-line-track">
            <div class="stream-glow-runner" />
          </div>
        </div>

        <!-- 2. 成功状态 -->
        <div v-else-if="status === 'success'" key="success" class="state-block">
          <div class="status-orb-wrapper success-wrapper">
            <div class="glow-halo" />
            <div class="core-orb">
              <el-icon :size="26"><CircleCheckFilled /></el-icon>
            </div>
          </div>

          <h3 class="state-title text-success">认证成功</h3>
          <p class="state-desc">身份校验通过，正在为您重定向至目标系统...</p>

          <div class="actions-group">
            <button class="prime-action-btn" @click="handleManualRedirect">
              <span>立即进入</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </button>
          </div>
        </div>

        <!-- 3. 失败/异常状态 -->
        <div v-else-if="status === 'error'" key="error" class="state-block">
          <div class="status-orb-wrapper error-wrapper">
            <div class="glow-halo" />
            <div class="core-orb">
              <el-icon :size="26"><CircleCloseFilled /></el-icon>
            </div>
          </div>

          <h3 class="state-title">登录验证未完成</h3>

          <!-- 精致微胶囊状态条 -->
          <div class="error-badge-pill">
            <span class="pill-dot" />
            <span class="pill-text">{{ errorMessage }}</span>
          </div>

          <!-- 操作按钮区 -->
          <div class="actions-group">
            <button class="prime-action-btn" @click="goToLogin">
              <el-icon class="refresh-icon"><RefreshRight /></el-icon>
              <span>重新发起登录</span>
            </button>
            <button class="ghost-action-btn" @click="goToHome">
              <span>返回系统首页</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- 底部安全信任背书 -->
      <div class="security-endorsement">
        <span class="secure-dot" />
        <span class="secure-text">EIAM 统一身份管理 · 企业级端到端加密传输</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Loading, CircleCheckFilled, CircleCloseFilled, RefreshRight, ArrowRight } from "@element-plus/icons-vue"
import { getProfileApi } from "@/api/iam/user"
import { acceptCredentialResponse } from "@/common/auth/credential"

type Status = "loading" | "success" | "error"

const route = useRoute()
const router = useRouter()

const status = ref<Status>("loading")
const errorMessage = ref("")
let targetRedirect = "/"

const goToLogin = () => router.push("/login")
const goToHome = () => router.push("/")

const handleManualRedirect = () => {
  router.push(targetRedirect)
}

onMounted(async () => {
  const code = route.query.code as string
  const errorParam = route.query.error as string

  // 上游 OIDC 授权被拒绝（如用户取消或拒绝授权）
  if (errorParam) {
    status.value = "error"
    errorMessage.value = (route.query.error_description as string) || "授权请求已被取消或拒绝"
    return
  }

  // 缺少必须的授权 code
  if (!code) {
    status.value = "error"
    errorMessage.value = "缺少有效授权码 (Code)，请重新发起登录"
    return
  }

  try {
    /**
     * Cookie 模式下，后端已在服务端建立会话，此处校验 Session Cookie 是否有效。
     */
    await getProfileApi()
    acceptCredentialResponse(undefined, true)

    status.value = "success"

    targetRedirect = sessionStorage.getItem("sso_redirect_after_login") || "/"
    sessionStorage.removeItem("sso_redirect_after_login")

    setTimeout(() => {
      router.push(targetRedirect)
    }, 700)
  } catch {
    status.value = "error"
    errorMessage.value = "登录凭证同步失败，会话可能已过期或被拦截"
  }
})
</script>

<style lang="scss" scoped>
.callback-container {
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

// 柔和微网格背景
.bg-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(148, 163, 184, 0.28) 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  z-index: 0;
}

// 背景网格渐变微暗影
.bg-mesh-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(241, 245, 249, 0.8) 0%, #f8fafc 100%);
  z-index: 0;
}

// 大气环境微光晕
.ambient-glow {
  position: absolute;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  filter: blur(130px);
  pointer-events: none;
  z-index: 0;

  &.glow-top {
    top: -200px;
    left: 20%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0) 70%);
  }

  &.glow-bottom {
    bottom: -200px;
    right: 20%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 70%);
  }
}

// 高级玻璃拟态卡片 (Glassmorphism Premium)
.glass-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 410px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 34px 32px 22px;
  box-shadow:
    0 0 0 1px rgba(226, 232, 240, 0.65),
    0 4px 6px -1px rgba(15, 23, 42, 0.03),
    0 24px 48px -12px rgba(15, 23, 42, 0.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

// 顶部高光亮线（拟真折射光）
.card-specular-highlight {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 999px;
}

// 品牌区域
.brand-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;

  .brand-logo {
    height: 27px;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.04));
  }
}

// 状态主体
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}

// 状态立体光晕徽标系统
.status-orb-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin-bottom: 18px;

  .core-orb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    z-index: 2;
    transition: transform 0.2s ease;
  }

  // 1. 加载光环
  &.loading-wrapper {
    .core-orb {
      background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
      color: #0284c7;
      border: 1px solid rgba(14, 165, 233, 0.25);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12);
    }

    .orbit-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid transparent;
      border-top-color: #0ea5e9;
      border-right-color: #38bdf8;
      animation: spin 1s linear infinite;
    }

    .spin-icon {
      animation: spin 1.2s ease-in-out infinite;
    }
  }

  // 2. 成功光环
  &.success-wrapper {
    .glow-halo {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
      animation: pulse 2s infinite ease-in-out;
    }

    .core-orb {
      background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.16);
    }
  }

  // 3. 失败光环
  &.error-wrapper {
    .glow-halo {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, transparent 70%);
      animation: pulse 2s infinite ease-in-out;
    }

    .core-orb {
      background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.26);
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.14);
    }
  }
}

.state-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin: 0 0 8px;

  &.text-success {
    color: #059669;
  }
}

.state-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 18px;
  max-width: 320px;
}

// 现代微胶囊状态条 (Modern Pill)
.error-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  background: rgba(254, 242, 242, 0.85);
  border: 1px solid rgba(254, 202, 202, 0.7);
  border-radius: 999px;
  padding: 6px 14px;
  margin-bottom: 22px;
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.04);

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    flex-shrink: 0;
  }

  .pill-text {
    font-size: 12px;
    font-weight: 500;
    color: #991b1b;
    line-height: 1.4;
    word-break: break-all;
    text-align: left;
  }
}

// 动态微进度条
.stream-line-track {
  width: 100%;
  max-width: 220px;
  height: 3px;
  background-color: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 6px;
  margin-bottom: 12px;

  .stream-glow-runner {
    width: 45%;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0284c7 0%, #10b981 100%);
    animation: streamRun 1.5s ease-in-out infinite;
  }
}

// 操作按钮群
.actions-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

// 高质感主操作按钮（Linear 风格，微物理质感）
.prime-action-btn {
  position: relative;
  width: 100%;
  height: 40px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid rgba(2, 132, 199, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    0 2px 4px rgba(2, 132, 199, 0.18),
    0 8px 16px -4px rgba(2, 132, 199, 0.28);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: linear-gradient(180deg, #0369a1 0%, #075985 100%);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.35),
      0 4px 8px rgba(2, 132, 199, 0.25),
      0 12px 20px -4px rgba(2, 132, 199, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(2, 132, 199, 0.2);
  }

  .arrow-icon,
  .refresh-icon {
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  &:hover .arrow-icon {
    transform: translateX(3px);
  }

  &:hover .refresh-icon {
    transform: rotate(90deg);
  }
}

// 辅助幽灵按钮
.ghost-action-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    color: #0f172a;
    background-color: rgba(241, 245, 249, 0.6);
  }
}

// 底部安全标签
.security-endorsement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  width: 100%;

  .secure-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
  }

  .secure-text {
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 0.2px;
  }
}

// 动效定义
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@keyframes streamRun {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(250%);
  }
}

.state-fade-enter-active,
.state-fade-leave-active {
  transition: all 0.22s ease;
}

.state-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.state-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
