<template>
  <el-form
    ref="loginFormRef"
    :model="loginFormData"
    :rules="loginFormRules"
    class="premium-compact-form"
    @keyup.enter="handleLogin"
  >
    <!-- 账号输入 (无 Label) -->
    <el-form-item prop="username">
      <el-input
        v-model.trim="loginFormData.username"
        placeholder="账号 / 邮箱"
        tabindex="1"
        :prefix-icon="Message"
        class="refined-input"
        @focus="handleFocus('username')"
        @blur="handleBlur"
      />
    </el-form-item>

    <!-- 密码输入 (无 Label) -->
    <el-form-item prop="password" class="no-label-item">
      <el-input
        v-model.trim="loginFormData.password"
        placeholder="登录密码"
        type="password"
        tabindex="2"
        :prefix-icon="Lock"
        show-password
        class="refined-input"
        @focus="handleFocus('password')"
        @blur="handleBlur"
      />
      <!-- 忘记密码移动到输入框下方右侧 -->
      <div class="input-footer">
        <el-link :underline="false" class="forgot-link">忘记密码?</el-link>
      </div>
    </el-form-item>

    <!-- 提交按钮 -->
    <el-button :loading="loading" class="refined-submit-btn" @click.prevent="handleLogin">
      {{ props.bindToken ? "验证并绑定" : "登 录" }}
    </el-button>

    <!-- 租户选择弹窗 -->
    <TenantSelectModal v-model="showTenantSelect" :tenants="tenantList" :username="loginFormData.username" />

    <!-- MFA 二次验证弹窗 -->
    <MfaVerifyModal v-model="showMfaVerify" :mfa-token="mfaToken" @success="handleLoginSuccess" />
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { type FormInstance, type FormRules } from "element-plus"
import { Message, Lock } from "@element-plus/icons-vue"
import { loginLdapApi, loginSystemApi, bindConfirmApi } from "@/api/iam/user"
import type { LoginLdapRequest, Tenant } from "@/api/iam/user/type"
import TenantSelectModal from "./components/TenantSelectModal.vue"
import MfaVerifyModal from "./components/MfaVerifyModal.vue"
import { isDemoHost } from "./utils/demo-env"

const router = useRouter()
const route = useRoute()
const props = defineProps<{
  active: string
  bindToken?: string
}>()
const emits = defineEmits(["focus", "blur"])

const handleBlur = () => emits("blur")
const handleFocus = (field: string) => emits("focus", field)

const loginFormRef = ref<FormInstance | null>(null)
const loading = ref(false)

// 弹窗状态
const showTenantSelect = ref(false)
const tenantList = ref<Tenant[]>([])
const showMfaVerify = ref(false)
const mfaToken = ref("")

const loginFormData: LoginLdapRequest = reactive({ username: "", password: "" })

onMounted(() => {
  if (isDemoHost()) {
    loginFormData.username = "demo"
    loginFormData.password = "123456"
  }
})

const loginFormRules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
}

function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) return
    loading.value = true

    const reqPromise = props.bindToken
      ? bindConfirmApi({
          username: loginFormData.username,
          password: loginFormData.password,
          bind_token: props.bindToken
        })
      : props.active === "ldap"
        ? loginLdapApi(loginFormData)
        : loginSystemApi(loginFormData)

    reqPromise
      .then((res: any) => {
        handleLoginSuccess(res.data)
      })
      .catch(() => {
        loginFormData.password = ""
      })
      .finally(() => {
        loading.value = false
      })
  })
}

/**
 * 统一处理登录/验证成功后的后续逻辑（租户选择/直接进入）
 */
function handleLoginSuccess(businessData: any) {
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
    tenantList.value = businessData.tenants
    showTenantSelect.value = true
    return
  }

  // 3. 正常进入
  const redirect = route.query.redirect as string
  if (redirect) {
    router.push(redirect)
  } else {
    router.push("/")
  }
}
</script>

<style lang="scss" scoped>
.premium-compact-form {
  :deep(.el-form-item) {
    margin-bottom: var(--login-form-gap, 24px);
    &.no-label-item {
      margin-bottom: 8px;
    }
    .el-form-item__label {
      display: none !important;
    }
  }
}

.input-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  .forgot-link {
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    &:hover {
      color: #10b981;
    }
  }
}

:deep(.refined-input) {
  .el-input__wrapper {
    background-color: #f8fafc !important;
    box-shadow: none !important;
    border: 1px solid #edf2f7;
    border-radius: 12px;
    padding: 9px 14px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &.is-focus {
      background-color: #ffffff !important;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    }
  }
  .el-input__inner {
    color: #0f172a;
    font-size: var(--login-input-font-size, 14px);
    height: var(--login-input-height, 32px);
    &::placeholder {
      color: #94a3b8;
    }
  }
  .el-input__prefix-icon {
    font-size: 18px;
    color: #94a3b8;
  }
}

.refined-submit-btn {
  width: 100%;
  height: var(--login-submit-height, 48px);
  background: linear-gradient(to bottom, #10b981, #059669);
  border: none;
  color: white;
  font-size: var(--login-submit-font-size, 16px);
  font-weight: 700;
  border-radius: 12px;
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transition: all 0.2s;
  &:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
  }
  &:active {
    transform: translateY(0);
  }
}
</style>
