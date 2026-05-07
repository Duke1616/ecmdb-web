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
    <el-button :loading="loading" class="refined-submit-btn" @click.prevent="handleLogin"> 登 录 </el-button>

    <!-- 租户选择弹窗 -->
    <TenantSelectModal v-model="showTenantSelect" :tenants="tenantList" />
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { type FormInstance, type FormRules } from "element-plus"
import { Message, Lock } from "@element-plus/icons-vue"
import { loginLdapApi, loginSystemApi } from "@/api/iam/user"
import type { LoginLdapRequest, Tenant } from "@/api/iam/user/type"
import TenantSelectModal from "./components/TenantSelectModal.vue"

const router = useRouter()
const props = defineProps<{ active: string }>()
const emits = defineEmits(["focus", "blur"])

const handleBlur = () => emits("blur")
const handleFocus = (field: string) => emits("focus", field)

const loginFormRef = ref<FormInstance | null>(null)
const loading = ref(false)
const showTenantSelect = ref(false)
const tenantList = ref<Tenant[]>([])

const loginFormData: LoginLdapRequest = reactive({ username: "", password: "" })

onMounted(() => {
  const isDemoEnv = window.location.hostname === "82.156.165.98"
  if (isDemoEnv) {
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
    const loginApi = props.active === "ldap" ? loginLdapApi : loginSystemApi
    loginApi(loginFormData)
      .then((res: any) => {
        const businessData = res.data
        if (businessData && businessData.must_select_tenant) {
          tenantList.value = businessData.tenants
          showTenantSelect.value = true
        } else {
          router.push({ path: "/" })
        }
      })
      .catch(() => {
        loginFormData.password = ""
      })
      .finally(() => {
        loading.value = false
      })
  })
}
</script>

<style lang="scss" scoped>
.premium-compact-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
    &.no-label-item {
      margin-bottom: 12px;
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
  margin-top: 8px;
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
    background-color: #f8fafc !important; // 稍微带一点灰，提升输入感
    box-shadow: none !important;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 10px 14px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &.is-focus {
      background-color: #ffffff !important;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    }
  }
  .el-input__inner {
    color: #0f172a;
    font-size: 14px;
    height: 32px;
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
  height: 48px;
  background: linear-gradient(to bottom, #10b981, #059669);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  margin-top: 16px;
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
