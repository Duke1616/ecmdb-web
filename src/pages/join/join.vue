<template>
  <div class="join-container">
    <div class="bg-pattern" />

    <div class="split-layout">
      <!-- 左侧：Bento 5.0 对等平衡版 (同步登录页风格) -->
      <div class="hero-section">
        <div class="bento-wrapper">
          <!-- 品牌标题卡 (高度压缩) -->
          <div class="bento-card brand-card">
            <div class="logo-wrapper">
              <img src="@@/assets/images/layouts/logo-标准.png" class="main-logo" />
            </div>
            <h1 class="hero-title">企业级运维<br />一体化治理平台</h1>
          </div>

          <div class="bento-grid">
            <!-- 2. CMDB -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Box /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">CMDB 资源中心</span>
                <span class="info-desc">全量资产动态纳管</span>
              </div>
            </div>

            <!-- 3. 任务调度 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">分布式任务调度</span>
                <span class="info-desc">海量任务毫秒级分发</span>
              </div>
            </div>

            <!-- 4. 智能告警 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">智能告警中心</span>
                <span class="info-desc">多维收敛与精准通知</span>
              </div>
            </div>

            <!-- 5. 工单流程 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">工单流程中心</span>
                <span class="info-desc">标准化业务全生命周期</span>
              </div>
            </div>

            <!-- 6. 多租户 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><CopyDocument /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">多租户逻辑隔离</span>
                <span class="info-desc">安全合规的业务沙箱</span>
              </div>
            </div>

            <!-- 7. 身份治理 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">统一身份治理 IGA</span>
                <span class="info-desc">权限精细化全流程管控</span>
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
              <!-- 移除冗余徽章 -->
              <h1 class="main-title">接受入驻邀请</h1>
              <p class="header-desc">您正受邀加入平台，请确认入驻信息</p>
            </div>

            <!-- 加入上下文：租户与配额组合 -->
            <div class="join-context-section">
              <div class="context-item tenant-info">
                <div class="item-label">目标租户空间</div>
                <div class="tenant-meta">
                  <div class="tenant-icon">
                    <el-icon><OfficeBuilding /></el-icon>
                  </div>
                  <div class="tenant-details">
                    <div class="tenant-name">{{ invitation.tenant_name }}</div>
                    <div class="role-labels">
                      <span v-for="role in invitation.role_codes" :key="role" class="role-tag">
                        {{ role }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 席位配额 (仅非成员可见) -->
              <div v-if="!invitation.is_member && invitation.max_uses > 0" class="context-item quota-info">
                <div class="quota-meta">
                  <div class="label-group">
                    <el-icon class="label-icon"><User /></el-icon>
                    <span class="label-text">当前席位剩余</span>
                  </div>
                  <div class="quota-stats">
                    <span class="current">{{ invitation.max_uses - invitation.used_count }}</span>
                    <span class="divider">/</span>
                    <span class="total">{{ invitation.max_uses }}</span>
                  </div>
                </div>
                <div class="quota-progress-bar">
                  <div
                    class="progress-inner"
                    :style="{
                      width: `${((invitation.max_uses - invitation.used_count) / invitation.max_uses) * 100}%`
                    }"
                  />
                </div>
              </div>
            </div>

            <!-- 治理策略列表 -->
            <div class="policy-framework">
              <div class="section-title">治理策略与权限定义</div>
              <div class="policy-grid">
                <!-- 成员身份提示 (若已是成员) -->
                <div v-if="invitation.is_member" class="policy-card is-member">
                  <el-icon class="p-icon"><CircleCheck /></el-icon>
                  <div class="p-content">
                    <div class="p-title">成员身份已确认</div>
                    <div class="p-desc">您已在当前空间内，无需重复操作。</div>
                  </div>
                </div>

                <!-- 审批/自动授权策略 -->
                <div class="policy-card">
                  <el-icon class="p-icon" :class="{ 'is-warning': invitation.require_approval }">
                    <component :is="invitation.require_approval ? Timer : CircleCheck" />
                  </el-icon>
                  <div class="p-content">
                    <div class="p-title">{{ invitation.require_approval ? "人工审批流" : "自动权限授予" }}</div>
                    <div class="p-desc">
                      {{ invitation.require_approval ? "申请入驻需管理员手动核准" : "加入后立即获得对应的访问权限" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="action-section">
              <el-button
                type="primary"
                :loading="submitting"
                class="join-action-btn"
                :class="{ 'member-entry': invitation.is_member }"
                @click="handleJoin"
              >
                <span>{{ invitation.is_member ? "直接进入系统" : getToken() ? "确认加入" : "登录并加入" }}</span>
                <el-icon class="ml-2"><ArrowRight /></el-icon>
              </el-button>
              <p class="service-hint">点击加入即代表同意《租户空间治理协议》</p>
            </div>
          </div>

          <transition name="fade">
            <div v-if="success" class="success-overlay">
              <div class="success-card">
                <div class="check-icon-wrap">
                  <el-icon><Check /></el-icon>
                </div>
                <h2 class="status-title">申请已提交</h2>
                <p class="status-desc">
                  {{
                    invitation?.require_approval
                      ? "您的入驻申请已发送至管理员，请耐心等待核准。"
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
  Box,
  Cpu,
  Bell,
  Tickets,
  CopyDocument,
  User
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
  } catch (err: any) {
    error.value = err.message || "邀请链接可能已过期或被撤回"
  } finally {
    loading.value = false
  }
}

const handleJoin = async () => {
  if (invitation.value?.is_member) {
    router.push("/")
    return
  }

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

.hero-section {
  flex: 1.4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 60px;

  .bento-wrapper {
    width: 660px;
    animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .bento-card {
    position: relative;
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 48px 16px 16px 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
    }
  }

  .brand-card {
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 0 0 24px 0;
    &:hover {
      transform: none;
      box-shadow: none;
    }
    .logo-wrapper {
      margin-bottom: 16px;
      .main-logo {
        height: 44px;
      }
    }
    .hero-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .card-icon-wrap {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    font-size: 14px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    border: 1px solid #e6f6ec;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.08);
  }

  .card-info {
    .info-title {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .info-desc {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      line-height: 1.5;
    }
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
  width: 400px;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px;
  border: 1px solid #f1f5f9;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 25px 50px -12px rgba(0, 0, 0, 0.08);
  position: relative;
  animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-header {
  margin-bottom: 32px;
  .main-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .header-desc {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
}

.join-context-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;

  .context-item {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 16px;

    .item-label {
      font-size: 11px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
  }

  .tenant-meta {
    display: flex;
    gap: 12px;
    align-items: center;

    .tenant-icon {
      width: 40px;
      height: 40px;
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #10b981;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .tenant-name {
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .role-labels {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      .role-tag {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        background: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }
    }
  }

  .quota-info {
    .quota-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .label-group {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 12px;
        font-weight: 700;
      }

      .quota-stats {
        .current {
          font-size: 18px;
          font-weight: 800;
          color: #10b981;
        }
        .divider {
          margin: 0 2px;
          color: #cbd5e1;
        }
        .total {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 700;
        }
      }
    }

    .quota-progress-bar {
      height: 5px;
      background: #e2e8f0;
      border-radius: 100px;
      overflow: hidden;
      .progress-inner {
        height: 100%;
        background: #10b981;
        border-radius: 100px;
        transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }
  }
}

.policy-framework {
  margin-bottom: 32px;
  .section-title {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .policy-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .policy-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    transition: all 0.2s ease;

    &.is-member {
      background: #f0fdf4;
      border-color: #dcfce7;
      .p-icon {
        color: #10b981;
      }
      .p-title {
        color: #166534;
      }
      .p-desc {
        color: #15803d;
      }
    }

    .p-icon {
      font-size: 18px;
      color: #10b981;
      margin-top: 2px;
      &.is-warning {
        color: #f59e0b;
      }
    }

    .p-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .p-desc {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      line-height: 1.4;
    }
  }
}

.join-action-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(to bottom, #10b981, #059669);
  border: none;
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
  }

  &.member-entry {
    background: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    &:hover {
      background: #2563eb;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
    }
  }
}

.service-hint {
  margin-top: 16px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  font-weight: 500;
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

.error-state {
  text-align: center;
  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
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

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
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
}
</style>
