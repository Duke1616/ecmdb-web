<template>
  <div class="callback-container">
    <div class="callback-content">
      <el-result v-if="loading" icon="info" title="登录中" sub-title="正在处理飞书授权，请稍候...">
        <template #icon>
          <el-icon :size="60" class="is-loading">
            <Loading />
          </el-icon>
        </template>
      </el-result>
      <el-result v-else-if="error" icon="error" title="登录失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="goToLogin">返回登录页</el-button>
        </template>
      </el-result>
    </div>

    <!-- NOTE: 飞书 OAuth2 回调也需要租户选择，与 login.vue 保持一致 -->
    <TenantSelectModal v-model="showTenantSelect" :tenants="tenantList" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Loading } from "@element-plus/icons-vue"
import { oidcCallbackApi } from "@/api/iam/user"
import type { Tenant } from "@/api/iam/user/type"
import TenantSelectModal from "./components/TenantSelectModal.vue"

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref("")

/** 租户选择相关 */
const showTenantSelect = ref(false)
const tenantList = ref<Tenant[]>([])

const goToLogin = () => {
  router.push("/login")
}

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code || !state) {
    error.value = "缺少必要的授权参数"
    loading.value = false
    return
  }

  try {
    const res = await oidcCallbackApi({ code, state })
    const businessData = res.data

    // 如果返回了 bind_token，说明该账号尚未绑定，跳转到登录页进入绑定模式
    if (businessData.bind_token) {
      router.push({
        path: "/login",
        query: { bind_token: businessData.bind_token }
      })
      return
    }

    // 如果后端返回了 must_select_tenant，弹出租户选择弹窗
    if (businessData && businessData.must_select_tenant) {
      loading.value = false
      tenantList.value = businessData.tenants
      showTenantSelect.value = true
    } else {
      ElMessage.success("登录成功")
      router.push({ path: "/" })
    }
  } catch (err: any) {
    error.value = err.message || "飞书登录失败，请重试"
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-color: var(--el-bg-color);

  .callback-content {
    width: 480px;
    max-width: 90%;
  }
}

.is-loading {
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
