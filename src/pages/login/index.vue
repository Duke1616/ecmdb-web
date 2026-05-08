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

            <!-- 4. 智能告警 (统一为绿色) -->
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

            <!-- 7. 身份治理 (统一为绿色) -->
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

      <!-- 右侧：登录交互区 -->
      <div class="auth-section">
        <div class="login-card">
          <div class="owl-container">
            <Owl :close-eyes="isPasswordFocused" />
          </div>

          <div class="login-content">
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

            <!-- 绑定提示条 -->
            <div v-if="bindToken" class="bind-alert-box">
              <div class="alert-icon">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="alert-body">
                <div class="alert-title">账号绑定中</div>
                <div class="alert-desc">请验证您的本地账号以完成关联</div>
              </div>
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
                  <span>指纹登录</span>
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
    <TenantSelectModal v-model="showTenantSelect" :tenants="tenantList" />
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
  InfoFilled
} from "@element-plus/icons-vue"
import { startAuthentication } from "@simplewebauthn/browser"
import Login from "./login.vue"
import Owl from "./components/Owl.vue"
import TenantSelectModal from "./components/TenantSelectModal.vue"
import { getOidcRenderApi, passkeyLoginStartApi, passkeyLoginFinishApi } from "@/api/iam/user"
import { getEnabledProvidersApi } from "@/api/iam/identity-source"
import { IdentitySourceType, OIDCProviderType } from "@/api/iam/identity-source/type"
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
  } catch {
    console.error("加载身份源失败")
  }
})

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
    // 1. 获取服务端签发的 Challenge
    const optionsRes = await passkeyLoginStartApi()

    // 2. 唤起设备生物识别 / 硬件密钥验证
    let asseResp
    try {
      asseResp = await startAuthentication({ optionsJSON: optionsRes.data })
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        ElMessage.warning("用户取消了验证或设备不支持")
      } else {
        ElMessage.error(err.message || "生物识别验证失败")
      }
      return
    }

    // 3. 将加密签名发回服务器验证
    const verifyRes: any = await passkeyLoginFinishApi(asseResp)
    const businessData = verifyRes.data

    // 4. 处理多租户分支
    if (businessData && businessData.must_select_tenant) {
      tenantList.value = businessData.tenants
      showTenantSelect.value = true
    } else {
      ElMessage.success("通行证登录成功")
      router.push({ path: "/" })
    }
  } catch (error: any) {
    ElMessage.error(error.message || "通行证验证异常")
  }
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
    width: 660px; // 限制宽度以保持紧凑
    animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px; // 缩小间距
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
  }

  .brand-card {
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 0 0 24px 0;
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
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    font-size: 14px;
    // 拟真质感：渐变底色 + 微边框 + 绿光阴影
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
    // 提升对比度与呼吸感
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

.login-card {
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
  margin-bottom: 12px;
  border: 1px solid #f1f5f9;
  .switcher-item {
    flex: 1;
    height: 34px;
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

.bind-alert-box {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: linear-gradient(to right, #f0fdf4, #ffffff);
  border: 1px solid #dcfce7;
  border-radius: 12px;
  margin-bottom: 20px;
  animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  .alert-icon {
    color: #10b981;
    font-size: 18px;
    margin-right: 12px;
    margin-top: 2px;
  }
  .alert-title {
    font-size: 13px;
    font-weight: 700;
    color: #166534;
    margin-bottom: 2px;
  }
  .alert-desc {
    font-size: 11px;
    color: #15803d;
    line-height: 1.4;
  }
}

.quick-login-wrap {
  margin-top: 24px;
  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
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
      padding: 12px 4px;
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

@media (max-width: 1200px) {
  .hero-section {
    display: none;
  }
}
</style>
