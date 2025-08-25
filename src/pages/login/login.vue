<template>
  <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
    <el-form-item prop="username">
      <el-input
        v-model.trim="loginFormData.username"
        placeholder="用户名"
        type="text"
        tabindex="1"
        :prefix-icon="User"
        size="large"
      />
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model.trim="loginFormData.password"
        placeholder="密码"
        type="password"
        tabindex="2"
        :prefix-icon="Lock"
        size="large"
        show-password
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </el-form-item>
    <el-button :loading="loading" class="login-btn" type="primary" size="large" @click.prevent="handleLogin"
      >登 录</el-button
    >
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { User, Lock } from "@element-plus/icons-vue"
import { type LoginRequestData } from "./apis/types"
import { ldapLoginApi, systemLoginApi } from "./apis"

const router = useRouter()

interface Props {
  active: string
}

const props = defineProps<Props>()
const emits = defineEmits(["focus", "blur"])

/** 失去焦点 */
const handleBlur = () => {
  emits("blur")
}
/** 获取焦点 */
const handleFocus = () => {
  emits("focus")
}

/** 登录表单元素的引用 */
const loginFormRef = ref<FormInstance | null>(null)

/** 登录按钮 Loading */
const loading = ref(false)

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: "",
  password: ""
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" }
  ],
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }]
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const loginApi = props.active === "ldap" ? ldapLoginApi : systemLoginApi
    loginApi(loginFormData)
      .then(() => {
        router.push({ path: "/" })
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
.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
