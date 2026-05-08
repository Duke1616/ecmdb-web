<script setup lang="ts">
import { ref } from "vue"
import { startRegistration } from "@simplewebauthn/browser"
import {
  passkeyRegisterStartApi,
  passkeyRegisterFinishApi,
  listMyIdentitiesApi,
  unbindIdentityApi
} from "@/api/iam/user"
import { ElMessage, ElMessageBox } from "element-plus"
import type { IdentityVo } from "@/api/iam/user/type"
import { Refresh } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"

const props = defineProps<{
  userId: number
}>()

const visible = defineModel<boolean>({ default: false })

const loading = ref(false)
const boundPasskeys = ref<IdentityVo[]>([])

/**
 * 获取已绑定的 Passkey 列表
 */
const fetchBoundPasskeys = async () => {
  loading.value = true
  try {
    const { data } = await listMyIdentitiesApi({ provider: "passkey" })
    boundPasskeys.value = data || []
  } catch (err) {
    console.error("获取通行证列表失败:", err)
  } finally {
    loading.value = false
  }
}

/**
 * 绑定 Passkey (WebAuthn 注册)
 */
const handleBindPasskey = async () => {
  loading.value = true
  try {
    const { data } = await passkeyRegisterStartApi()
    const creationOptions = (data.options.publicKey || data.options) as any
    const attestationResponse = await startRegistration(creationOptions)
    await passkeyRegisterFinishApi(attestationResponse, {
      "X-Passkey-Session": data.session_token
    })

    ElMessage.success("通行证 (Passkey) 绑定成功")
    await fetchBoundPasskeys()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      ElMessage.warning("用户取消了操作或操作超时")
    }
  } finally {
    loading.value = false
  }
}

/**
 * 解除 Passkey 绑定
 */
const handleUnbindPasskey = async (identityId: string) => {
  try {
    await ElMessageBox.confirm("确定要移除该设备吗？移除后将无法使用该设备进行快捷登录。", "移除设备", {
      confirmButtonText: "确定移除",
      cancelButtonText: "取消",
      type: "warning"
    })

    loading.value = true
    await unbindIdentityApi({
      user_id: props.userId,
      provider: "passkey",
      identity_id: identityId
    })

    ElMessage.success("设备已移除")
    await fetchBoundPasskeys()
  } catch (err) {
    if (err !== "cancel") console.error("解绑失败:", err)
  } finally {
    loading.value = false
  }
}

// 暴露初始化方法
defineExpose({ initData: fetchBoundPasskeys })
</script>

<template>
  <FormDialog
    v-model="visible"
    title="管理通行证 (Passkey)"
    subtitle="监控并管理已绑定的生物识别凭据与硬件密钥"
    width="600px"
    header-icon="Monitor"
    @cancel="visible = false"
    :show-footer="false"
  >
    <div class="passkey-manager-layout" v-loading="loading">
      <div class="manager-header">
        <span class="count">已绑定 {{ boundPasskeys.length }} 个设备</span>
        <el-button :icon="Refresh" link @click="fetchBoundPasskeys" class="resync-btn" />
      </div>

      <el-scrollbar class="device-scrollbar" max-height="400px">
        <div v-if="boundPasskeys.length > 0" class="device-list">
          <div v-for="item in boundPasskeys" :key="item.identity_id" class="device-item">
            <div class="status-bar" />
            <div class="item-content">
              <div class="header-row">
                <span class="device-name">{{ item.passkey_info?.nickname || "未知设备" }}</span>
                <div class="id-badge">{{ item.identity_id.slice(0, 8) }}...</div>
              </div>
              <div class="footer-row">
                <span class="sign-count">已验证次数: {{ item.passkey_info?.sign_count || 0 }}</span>
                <el-button link type="danger" class="remove-btn" @click="handleUnbindPasskey(item.identity_id)">
                  解除绑定
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂未绑定任何设备" :image-size="80" />
      </el-scrollbar>

      <div class="manager-footer mt-6">
        <el-button type="primary" class="w-full h-10" :loading="loading" @click="handleBindPasskey">
          添加新通行证
        </el-button>
      </div>
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
.passkey-manager-layout {
  padding: 4px;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;

  .count {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-item {
  position: relative;
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    transform: translateY(-1px);

    .status-bar {
      width: 6px;
    }
  }

  .status-bar {
    width: 4px;
    background: #3b82f6;
    transition: width 0.2s;
  }

  .item-content {
    flex: 1;
    padding: 12px 16px;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .device-name {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .id-badge {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
    }
  }

  .footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .sign-count {
      font-size: 12px;
      color: #94a3b8;
    }

    .remove-btn {
      font-size: 12px;
      font-weight: 600;
    }
  }
}

.w-full {
  width: 100%;
}
</style>
