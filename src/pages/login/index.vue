<template>
  <div class="login-container">
    <div class="bg-pattern" />

    <div class="split-layout">
      <!-- 左侧：Bento 5.0 对等平衡版 -->
      <div class="hero-section">
        <div class="bento-wrapper">
          <!-- 品牌标题卡 (高度压缩) -->
          <div class="bento-card brand-card">
            <div class="logo-wrapper">
              <img src="@@/assets/images/layouts/logo-标准.png" class="main-logo" />
            </div>
            <h1 class="hero-title">运维资源<br />统一治理平台</h1>
          </div>

          <div class="bento-grid">
            <!-- 2. CMDB -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Box /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">CMDB 资源中心</span>
                <span class="info-desc">资源信息统一维护</span>
              </div>
            </div>

            <!-- 3. 任务调度 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">分布式任务调度</span>
                <span class="info-desc">任务执行统一编排</span>
              </div>
            </div>

            <!-- 4. 智能告警 (统一为绿色) -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">智能告警中心</span>
                <span class="info-desc">告警规则集中管理</span>
              </div>
            </div>

            <!-- 5. 工单流程 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">工单流程中心</span>
                <span class="info-desc">流程审批规范流转</span>
              </div>
            </div>

            <!-- 6. 多租户 -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><CopyDocument /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">多租户逻辑隔离</span>
                <span class="info-desc">租户数据逻辑隔离</span>
              </div>
            </div>

            <!-- 7. 身份治理 (统一为绿色) -->
            <div class="bento-card biz-card">
              <div class="card-icon-wrap">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="card-info">
                <span class="info-title">统一身份治理 IGA</span>
                <span class="info-desc">账号权限统一管理</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：登录交互区 -->
      <div class="auth-section">
        <div class="login-card">
          <div class="owl-container">
            <Owl :close-eyes="isPasswordFocused" />
          </div>

          <div class="login-content">
            <div v-if="inviteInfo" class="task-heading">
              <div class="alert-icon">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="alert-body">
                <div class="alert-title">入驻邀请：{{ inviteInfo.tenant_name }}</div>
                <div class="alert-desc">登录后将自动为您发起入驻申请</div>
              </div>
            </div>

            <div v-else-if="bindToken" class="task-heading">
              <div class="alert-icon">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="alert-body">
                <div class="alert-title">账号绑定中</div>
                <div class="alert-desc">请验证您的本地账号以完成关联</div>
              </div>
            </div>

            <div v-else class="auth-heading">
              <h2>欢迎登录</h2>
            </div>

            <div class="mode-switcher">
              <div
                class="switcher-item"
                :class="{
                  active: activeName === IdentitySourceType.LOCAL,
                  'is-disabled': !isEnabled(IdentitySourceType.LOCAL)
                }"
                @click="handleTabChange(IdentitySourceType.LOCAL)"
              >
                密码
              </div>
              <div
                class="switcher-item"
                :class="{
                  active: activeName === IdentitySourceType.LDAP,
                  'is-disabled': !isEnabled(IdentitySourceType.LDAP)
                }"
                @click="handleTabChange(IdentitySourceType.LDAP)"
              >
                AD 域
              </div>
              <div class="switcher-slider" :style="sliderStyle" />
            </div>

            <Login
              :active="activeName"
              :bind-token="bindToken"
              @focus="handleFieldFocus"
              @blur="isPasswordFocused = false"
            />

            <div v-if="!bindToken" class="quick-login-wrap">
              <div class="divider"><span class="divider-text">快捷登录</span></div>
              <div class="social-row-grid">
                <div
                  class="social-box"
                  :class="{ 'is-disabled': !isEnabled(IdentitySourceType.PASSKEY) }"
                  @click="handlePasskeyLogin"
                >
                  <svg class="passkey-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C10.07 2 8.22 2.76 6.84 4.14C5.46 5.52 4.7 7.37 4.7 9.3V10M12 22V20M7.5 17.5V14.5M16.5 17.5V14.5M12 11V15M17.3 9.3C17.3 7.37 16.54 5.52 15.16 4.14C13.78 2.76 11.93 2 10 2"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M9 11.5C9 10.12 10.12 9 11.5 9C12.88 9 14 10.12 14 11.5V13"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>通行密钥</span>
                </div>
                <div
                  class="social-box"
                  :class="{ 'is-disabled': !isEnabled(OIDCProviderType.FEISHU) }"
                  @click="handleFeishuLogin"
                >
                  <el-icon class="feishu-icon"><Promotion /></el-icon>
                  <span>飞书登录</span>
                </div>
                <div class="social-box is-disabled">
                  <el-icon class="wechat-icon"><ChatDotRound /></el-icon>
                  <span>企业微信</span>
                </div>
                <div class="social-box is-disabled">
                  <el-icon class="ding-icon"><Share /></el-icon>
                  <span>钉钉登录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 租户选择弹窗 (用于 Passkey 登录后的多租户情况) -->
    <TenantSelectModal v-model="showTenantSelect" :tenants="tenantList" :username="loginUsername" />

    <!-- MFA 二次验证弹窗 -->
    <MfaVerifyModal v-model="showMfaVerify" :mfa-token="mfaToken" @success="handleMfaSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
  Promotion,
  ChatDotRound,
  Share,
  Cpu,
  Box,
  Tickets,
  CopyDocument,
  Bell,
  Lock,
  InfoFilled,
  OfficeBuilding
} from "@element-plus/icons-vue"
import { startAuthentication } from "@simplewebauthn/browser"
import Login from "./login.vue"
import Owl from "./components/Owl.vue"
import TenantSelectModal from "./components/TenantSelectModal.vue"
import MfaVerifyModal from "./components/MfaVerifyModal.vue"
import { getOidcRenderApi, passkeyLoginStartApi, passkeyLoginFinishApi } from "@/api/iam/user"
import { getEnabledProvidersApi } from "@/api/iam/identity-source"
import { verifyInvitationApi } from "@/api/iam/invitation"
import { IdentitySourceType, OIDCProviderType } from "@/api/iam/identity-source/type"
import type { InvitationVO } from "@/api/iam/invitation/type"
import type { Tenant } from "@/api/iam/user/type"

const route = useRoute()
const router = useRouter()
const isDemoEnv = window.location.hostname === "82.156.165.98"

const bindToken = computed(() => route.query.bind_token as string)
const activeName = ref<IdentitySourceType>((route.query.mode as IdentitySourceType) || IdentitySourceType.LOCAL)
const isPasswordFocused = ref(false)
const enabledProviders = ref<string[]>([])

const showTenantSelect = ref(false)
const tenantList = ref<Tenant[]>([])
const loginUsername = ref("")
const inviteInfo = ref<InvitationVO | null>(null)
const showMfaVerify = ref(false)
const mfaToken = ref("")

const sliderStyle = computed(() => ({
  transform: `translateX(${activeName.value === IdentitySourceType.LOCAL ? "0" : "100%"})`
}))

const isEnabled = (type: string) => enabledProviders.value.includes(type)

onMounted(async () => {
  try {
    const res = await getEnabledProvidersApi()
    enabledProviders.value = res.data || []
    if (!isEnabled(IdentitySourceType.LOCAL)) {
      if (isEnabled(IdentitySourceType.LDAP)) activeName.value = IdentitySourceType.LDAP
    } else if (isEnabled(IdentitySourceType.LDAP) && !isDemoEnv && !route.query.mode) {
      activeName.value = IdentitySourceType.LDAP
    }
    // 检查邀请信息
    fetchInviteInfo()
  } catch {
    console.error("加载身份源失败")
  }
})

const fetchInviteInfo = async () => {
  const redirect = route.query.redirect as string
  if (!redirect || !redirect.includes("/join")) return

  try {
    const url = new URL(redirect, window.location.origin)
    const code = url.searchParams.get("code")
    if (code) {
      const res = await verifyInvitationApi(code)
      inviteInfo.value = res.data
    }
  } catch (e) {
    console.error("获取邀请信息失败", e)
  }
}

const handleTabChange = (mode: IdentitySourceType) => {
  if (!isEnabled(mode)) {
    ElMessage.warning(`尚未注册 ${mode === IdentitySourceType.LOCAL ? "本地密码" : "AD 域"} 身份源`)
    return
  }
  activeName.value = mode
}

const handleFieldFocus = (field: string) => {
  isPasswordFocused.value = field === "password"
}

const handleFeishuLogin = async () => {
  if (!isEnabled(OIDCProviderType.FEISHU)) return
  try {
    const res = await getOidcRenderApi("feishu")
    if (res.data) window.location.href = res.data
  } catch {
    ElMessage.error("获取授权失败")
  }
}

const handlePasskeyLogin = async () => {
  if (!isEnabled(IdentitySourceType.PASSKEY)) return

  try {
    // 1. 获取服务端签发的 Challenge (包含 options 和 session_token)
    const res = await passkeyLoginStartApi()
    const { options, session_token } = res.data

    // 2. 唤起设备生物识别 / 硬件密钥验证
    let asseResp
    try {
      // 提取真正的 WebAuthn 配置
      const authOptions = (options.publicKey || options) as any
      asseResp = await startAuthentication({ optionsJSON: authOptions })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        ElMessage.warning("用户取消了验证或设备不支持")
      } else {
        ElMessage.error((err as Error).message || "生物识别验证失败")
      }
      return
    }

    // 3. 将加密签名发回服务器验证，同时带上 session_token
    const verifyRes = await passkeyLoginFinishApi(asseResp, {
      "X-Passkey-Session": session_token
    })
    const businessData = verifyRes.data

    handleLoginSuccess(businessData)
  } catch (error: unknown) {
    // 只有非 Axios 错误（即非接口返回的业务错误）才在这里处理
    // 因为业务错误已经在 request 拦截器中弹窗了
    if (error instanceof Error && !(error as any).code) {
      console.error("[Passkey Login Error]:", error)
    }
  }
}

/**
 * 统一处理登录/验证成功后的后续逻辑
 */
const handleLoginSuccess = (businessData: any) => {
  if (!businessData) {
    router.push({ path: "/" })
    return
  }

  // 1. MFA 校验拦截
  if (businessData.mfa_required) {
    mfaToken.value = businessData.mfa_token
    showMfaVerify.value = true
    return
  }

  // 2. 租户选择拦截
  if (businessData.must_select_tenant) {
    loginUsername.value = businessData.user?.username || ""
    tenantList.value = businessData.tenants
    showTenantSelect.value = true
    return
  }

  // 3. 正常进入
  ElMessage.success("登录成功")
  const redirect = route.query.redirect as string
  if (redirect) {
    router.push(redirect)
  } else {
    router.push("/")
  }
}

const handleMfaSuccess = (businessData: any) => {
  handleLoginSuccess(businessData)
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #ffffff;
  overflow: hidden;
  font-family: "Inter", "PingFang SC", sans-serif;
  --login-shell-width: min(1540px, calc(100vw - 96px));
  --login-shell-gap: clamp(72px, 5vw, 108px);
  --login-hero-width: clamp(660px, 41vw, 780px);
  --login-card-width: clamp(400px, 24vw, 440px);
  --login-card-padding: clamp(34px, 2.1vw, 40px);
  --login-logo-height: clamp(44px, 2.8vw, 50px);
  --login-title-size: clamp(38px, 2.6vw, 46px);
  --login-bento-gap: clamp(12px, 0.8vw, 15px);
  --login-bento-padding: clamp(48px, 3.1vw, 58px) clamp(16px, 1vw, 18px) clamp(16px, 1vw, 18px);
  --login-bento-icon-size: clamp(28px, 1.8vw, 32px);
  --login-card-title-size: clamp(13px, 0.8vw, 14px);
  --login-card-desc-size: clamp(11px, 0.7vw, 12px);
  --login-form-gap: 18px;
  --login-input-height: clamp(30px, 1.8vw, 32px);
  --login-input-font-size: 14px;
  --login-submit-height: clamp(46px, 2.7vw, 50px);
  --login-submit-font-size: 16px;

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
  width: var(--login-shell-width);
  max-width: calc(100vw - 48px);
  height: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  gap: var(--login-shell-gap);
  justify-content: center;
}

.hero-section {
  flex: 0 1 var(--login-hero-width);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;

  .bento-wrapper {
    width: var(--login-hero-width);
    max-width: 100%;
    animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--login-bento-gap);
  }

  .bento-card {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(var(--card-accent-rgb, 16, 185, 129), 0.05), transparent 44%), #ffffff;
    border: 1px solid #e8eef5;
    border-radius: 16px;
    padding: var(--login-bento-padding);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.03),
      0 14px 32px -28px rgba(15, 23, 42, 0.42);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    &::after {
      content: "";
      position: absolute;
      inset: auto 18px 0;
      height: 2px;
      border-radius: 999px 999px 0 0;
      background: rgba(var(--card-accent-rgb, 16, 185, 129), 0.52);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover {
      border-color: rgba(var(--card-accent-rgb, 16, 185, 129), 0.28);
      box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 18px 38px -28px rgba(var(--card-accent-rgb, 16, 185, 129), 0.32);
      transform: translateY(-2px);

      &::after {
        opacity: 1;
      }
    }
  }

  .biz-card:nth-child(1) {
    --card-accent-rgb: 16, 185, 129;
  }

  .biz-card:nth-child(2) {
    --card-accent-rgb: 59, 130, 246;
  }

  .biz-card:nth-child(3) {
    --card-accent-rgb: 14, 165, 233;
  }

  .biz-card:nth-child(4) {
    --card-accent-rgb: 99, 102, 241;
  }

  .biz-card:nth-child(5) {
    --card-accent-rgb: 20, 184, 166;
  }

  .biz-card:nth-child(6) {
    --card-accent-rgb: 168, 85, 247;
  }

  .brand-card {
    position: relative;
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 0 0 28px 0;
    overflow: visible;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      bottom: 12px;
      width: 72px;
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(90deg, #10b981, #60a5fa);
    }

    &:hover {
      transform: none;
      border-color: transparent;
      box-shadow: none;

      &::after {
        opacity: 0;
      }
    }

    .logo-wrapper {
      margin-bottom: 18px;
      .main-logo {
        height: var(--login-logo-height);
      }
    }
    .hero-title {
      font-size: var(--login-title-size);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: 0;
      // 高级感渐变文字
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
    width: var(--login-bento-icon-size);
    height: var(--login-bento-icon-size);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(var(--card-accent-rgb, 16, 185, 129));
    font-size: 14px;
    // 拟真质感：渐变底色 + 微边框 + 绿光阴影
    background: linear-gradient(135deg, rgba(var(--card-accent-rgb, 16, 185, 129), 0.1) 0%, #ffffff 100%);
    border: 1px solid rgba(var(--card-accent-rgb, 16, 185, 129), 0.16);
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(var(--card-accent-rgb, 16, 185, 129), 0.1);
  }

  .card-info {
    .info-title {
      display: block;
      font-size: var(--login-card-title-size);
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    // 提升对比度与呼吸感
    .info-desc {
      font-size: var(--login-card-desc-size);
      color: #64748b;
      font-weight: 500;
      line-height: 1.5;
    }
  }
}

.auth-section {
  flex: 0 0 var(--login-card-width);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.login-card {
  width: var(--login-card-width);
  background: #ffffff;
  border-radius: 24px;
  padding: var(--login-card-padding);
  border: 1px solid #f1f5f9;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 25px 50px -12px rgba(0, 0, 0, 0.08);
  position: relative;
  animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-heading {
  position: relative;
  margin-bottom: 16px;
  padding-left: 14px;
  text-align: left;

  &::before {
    content: "";
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 0;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #10b981, #60a5fa);
  }

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 24px;
    line-height: 1.25;
    font-weight: 800;
    letter-spacing: 0;
  }
}

.task-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  text-align: left;

  .alert-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #dcfce7;
    color: #10b981;
    font-size: 18px;
  }

  .alert-title {
    color: #166534;
    font-size: 15px;
    line-height: 1.35;
    font-weight: 800;
  }

  .alert-desc {
    margin-top: 3px;
    color: #15803d;
    font-size: 12px;
    line-height: 1.45;
    font-weight: 500;
  }
}

.owl-container {
  position: absolute;
  top: -82px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
}

.mode-switcher {
  position: relative;
  display: flex;
  background: #f8fafc;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 10px;
  border: 1px solid #f1f5f9;
  .switcher-item {
    flex: 1;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    z-index: 2;
    transition: all 0.3s;
    &.active {
      color: #fff;
    }
    &.is-disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
  .switcher-slider {
    position: absolute;
    width: 50%;
    height: 100%;
    top: 0;
    left: 0;
    padding: 4px;
    box-sizing: border-box;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    &::after {
      content: "";
      display: block;
      width: 100%;
      height: 100%;
      background: #10b981;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
  }
}

.quick-login-wrap {
  margin-top: 18px;
  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
    &::before,
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
    }
    .divider-text {
      padding: 0 12px;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }
  .social-row-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    .social-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 4px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      span {
        font-size: 10px;
        color: #64748b;
        margin-top: 6px;
        font-weight: 600;
        white-space: nowrap;
      }
      i,
      svg {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .passkey-icon {
        color: #10b981;
      }
      .feishu-icon {
        color: #3b82f6;
      }
      .wechat-icon {
        color: #10b981;
      }
      .ding-icon {
        color: #0ea5e9;
      }
      &:hover:not(.is-disabled) {
        background: #ffffff;
        border-color: #e2e8f0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      &.is-disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
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

@media (min-width: 1600px) {
  .login-container {
    --login-shell-width: min(1640px, calc(100vw - 128px));
  }
}

@media (min-width: 1921px) {
  .login-container {
    --login-shell-width: min(1900px, calc(100vw - 160px));
    --login-shell-gap: clamp(112px, 5.8vw, 152px);
    --login-hero-width: clamp(860px, 39vw, 980px);
    --login-card-width: clamp(480px, 22vw, 520px);
    --login-card-padding: clamp(44px, 2.1vw, 50px);
    --login-logo-height: clamp(54px, 2.4vw, 62px);
    --login-title-size: clamp(48px, 2.25vw, 58px);
    --login-bento-gap: clamp(16px, 0.9vw, 20px);
    --login-bento-padding: clamp(62px, 2.8vw, 70px) clamp(20px, 1vw, 24px) clamp(20px, 1vw, 24px);
    --login-bento-icon-size: clamp(34px, 1.55vw, 38px);
    --login-card-title-size: clamp(15px, 0.72vw, 16px);
    --login-card-desc-size: clamp(12px, 0.62vw, 13px);
    --login-form-gap: 22px;
    --login-input-height: clamp(34px, 1.55vw, 37px);
    --login-input-font-size: 15px;
    --login-submit-height: clamp(50px, 2.25vw, 54px);
    --login-submit-font-size: 17px;
  }

  .hero-section {
    .brand-card {
      .logo-wrapper {
        margin-bottom: 20px;
      }
    }

    .bento-card {
      min-height: 126px;
    }

    .card-icon-wrap {
      top: 20px;
      left: 20px;
      font-size: 17px;
    }
  }

  .mode-switcher {
    margin-bottom: 12px;

    .switcher-item {
      height: 36px;
      font-size: 14px;
    }
  }

  .auth-heading {
    margin-bottom: 18px;

    h2 {
      font-size: 27px;
    }
  }

  .task-heading {
    margin-bottom: 18px;
    padding: 16px 18px;

    .alert-title {
      font-size: 16px;
    }

    .alert-desc {
      font-size: 13px;
    }
  }

  .quick-login-wrap {
    margin-top: 22px;

    .social-row-grid {
      gap: 10px;

      .social-box {
        padding: 12px 6px;

        span {
          font-size: 11px;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .hero-section {
    display: none;
  }

  .split-layout {
    width: 100%;
    max-width: none;
  }

  .auth-section {
    flex: 1;
  }

  .login-card {
    margin-top: 42px;
  }
}

@media (max-width: 520px) {
  .login-container {
    --login-card-width: min(400px, calc(100vw - 32px));
    --login-card-padding: 28px 24px;
  }

  .auth-heading {
    width: fit-content;
    margin-right: auto;
    margin-left: auto;
    text-align: left;

    h2 {
      font-size: 22px;
    }
  }
}
</style>
