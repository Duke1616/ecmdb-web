<template>
  <div class="join-container">
    <div class="bg-pattern" />

    <div class="split-layout">
      <!-- 左侧：Bento 品牌展示 (同步登录页风格) -->
      <div class="hero-section">
        <div class="bento-wrapper">
          <div class="bento-card brand-card">
            <div class="logo-wrapper">
              <img src="@@/assets/images/layouts/logo-标准.png" class="main-logo" />
            </div>
            <h1 class="hero-title">加入企业级<br />一体化治理空间</h1>
          </div>

          <div class="bento-grid">
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">租户隔离治理</span>
                <span class="info-desc">多维业务安全边界管控</span>
              </div>
            </div>
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">身份源联合</span>
                <span class="info-desc">全协议身份自动化同步</span>
              </div>
            </div>
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">零信任接入</span>
                <span class="info-desc">动态授权与细粒度风控</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：邀请交互区 -->
      <div class="auth-section">
        <div class="join-card">
          <div v-if="loading" class="loading-state">
            <el-skeleton :rows="4" animated />
          </div>

          <div v-else-if="error" class="error-state">
            <div class="error-content">
              <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
              <h2 class="status-title">链接已失效</h2>
              <p class="status-desc">{{ error }}</p>
              <el-button class="gov-btn" @click="router.push('/login')">返回登录</el-button>
            </div>
          </div>

          <div v-else-if="invitation" class="invitation-main">
            <div class="card-header">
              <h2 class="welcome-label">WELCOME</h2>
              <h1 class="main-title">接受入驻邀请</h1>
            </div>

            <div class="tenant-display">
              <div class="display-label">目标租户工作空间</div>
              <div class="display-value">{{ invitation.tenant_name }}</div>
              <div class="role-stack">
                <span v-for="role in invitation.role_codes" :key="role" class="role-chip">
                  {{ role }}
                </span>
              </div>
            </div>

            <div class="policy-list">
              <div class="policy-item">
                <el-icon class="p-icon" :class="{ 'is-approval': invitation.require_approval }">
                  <component :is="invitation.require_approval ? Timer : CircleCheck" />
                </el-icon>
                <div class="p-text">
                  <div class="p-title">{{ invitation.require_approval ? "需人工审批" : "自动授予权限" }}</div>
                  <div class="p-desc">
                    {{
                      invitation.require_approval ? "您的入驻申请需要管理员手动审核" : "接受邀请后将立即获得访问权限"
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="action-section">
              <el-button type="primary" :loading="submitting" class="join-action-btn" @click="handleJoin">
                <span>{{ getToken() ? "确认加入" : "登录并加入" }}</span>
                <el-icon class="ml-2"><ArrowRight /></el-icon>
              </el-button>
              <p class="hint-text">点击代表您已阅读并同意租户治理服务协议</p>
            </div>
          </div>

          <!-- 成功覆盖层 -->
          <transition name="fade">
            <div v-if="success" class="success-overlay">
              <div class="success-card">
                <div class="check-icon-wrap">
                  <el-icon><Check /></el-icon>
                </div>
                <h2 class="status-title">{{ invitation?.require_approval ? "申请已提交" : "加入成功" }}</h2>
                <p class="status-desc">
                  {{
                    invitation?.require_approval
                      ? "请等待管理员审核，审批结果将通过邮件通知。"
                      : "您已成功加入该租户，即将跳转..."
                  }}
                </p>
                <el-button type="primary" class="gov-btn" @click="router.push('/')">进入系统</el-button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
  OfficeBuilding,
  CircleCheck,
  Timer,
  ArrowRight,
  CircleCloseFilled,
  Check,
  Lock,
  Connection
} from "@element-plus/icons-vue"
import { verifyInvitationApi, acceptInvitationApi } from "@/api/iam/invitation"
import type { InvitationVO } from "@/api/iam/invitation/type"
import { getToken } from "@@/utils/cache/cookies"

const route = useRoute()
const router = useRouter()
const code = route.query.code as string

const loading = ref(true)
const submitting = ref(false)
const invitation = ref<InvitationVO | null>(null)
const error = ref<string | null>(null)
const success = ref(false)

const fetchInvitation = async () => {
  if (!code) {
    error.value = "未找到有效的邀请凭证"
    loading.value = false
    return
  }
  try {
    const res = await verifyInvitationApi(code)
    invitation.value = res.data

    // 如果用户已登录，执行自动关联逻辑
    if (getToken()) {
      handleJoin()
    }
  } catch (err: any) {
    error.value = err.message || "邀请链接可能已过期或被撤回"
  } finally {
    loading.value = false
  }
}

const handleJoin = async () => {
  if (!getToken()) {
    ElMessage.info("请先完成身份认证")
    router.push({
      path: "/login",
      query: { redirect: route.fullPath }
    })
    return
  }

  submitting.value = true
  try {
    const res = await acceptInvitationApi({ code })
    success.value = true
    if (!res.data.require_approval) {
      setTimeout(() => router.push("/"), 1500)
    }
  } catch (err: any) {
    // 错误已由全局拦截器处理
  } finally {
    submitting.value = false
  }
}

onMounted(fetchInvitation)
</script>

<style lang="scss" scoped>
.join-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #ffffff;
  overflow: hidden;
  font-family: "Inter", "PingFang SC", sans-serif;

  .bg-pattern {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.5;
    z-index: 0;
  }
}

.split-layout {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* 复用登录页 Hero 风格 */
.hero-section {
  flex: 1.4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 60px;

  .bento-wrapper {
    width: 600px;
    animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .bento-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 48px 16px 16px;
    position: relative;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  }

  .brand-card {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0 0 32px 0;
    .main-logo {
      height: 44px;
      margin-bottom: 16px;
    }
    .hero-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .card-icon-wrap {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    background: #f0fdf4;
    border-radius: 8px;
    font-size: 16px;
  }

  .info-title {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
  }
  .info-desc {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
  }
}

.auth-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 60px;
}

.join-card {
  width: 440px;
  background: #ffffff;
  border-radius: 24px;
  padding: 48px;
  border: 1px solid #f1f5f9;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 25px 50px -12px rgba(0, 0, 0, 0.08);
  position: relative;
  animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-header {
  margin-bottom: 32px;
  .welcome-label {
    font-size: 12px;
    font-weight: 800;
    color: #3b82f6;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  .main-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
}

.tenant-display {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;

  .display-label {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .display-value {
    font-size: 20px;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 12px;
  }

  .role-stack {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    .role-chip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
  }
}

.policy-list {
  margin-bottom: 40px;
  .policy-item {
    display: flex;
    gap: 14px;
    .p-icon {
      font-size: 20px;
      color: #10b981;
      &.is-approval {
        color: #f59e0b;
      }
    }
    .p-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .p-desc {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }
}

.join-action-btn {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  background: #10b981;
  border: none;
  color: #fff;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.15);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
  .ml-2 {
    margin-left: 8px;
  }
}

.hint-text {
  margin-top: 16px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.status-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 16px 0 8px;
}
.status-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
  text-align: center;
}
.error-icon {
  font-size: 56px;
  color: #ef4444;
  margin-bottom: 16px;
}

.gov-btn {
  border-radius: 10px;
  height: 40px;
  padding: 0 24px;
  font-weight: 700;
}

.success-overlay {
  position: absolute;
  inset: 0;
  background: #ffffff;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  z-index: 10;
  .success-card {
    text-align: center;
  }
  .check-icon-wrap {
    width: 64px;
    height: 64px;
    background: #ecfdf5;
    color: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 24px;
  }
}

.error-state {
  text-align: center;
  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .hero-section {
    display: none;
  }
  .auth-section {
    padding: 20px;
    justify-content: center;
  }
}
</style>
