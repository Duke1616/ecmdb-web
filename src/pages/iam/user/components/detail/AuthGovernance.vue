<script setup lang="ts">
import { ref } from "vue"
import { mfaDisableApi } from "@/api/iam/user"
import { ElMessage, ElMessageBox } from "element-plus"
import type { User } from "@/api/iam/user/type"
import { Lock } from "@element-plus/icons-vue"

// 子组件拆分
import MfaSetupDialog from "./sections/MfaSetupDialog.vue"
import PasskeyManageDialog from "./sections/PasskeyManageDialog.vue"

const props = defineProps<{
  user: User
}>()

const emits = defineEmits<{
  (e: "refresh"): void
}>()

// --- 状态控制 ---
const mfaLoading = ref(false)
const showMfaDialog = ref(false)
const showPasskeyDialog = ref(false)

// 组件引用
const mfaSetupRef = ref<InstanceType<typeof MfaSetupDialog> | null>(null)
const passkeyManageRef = ref<InstanceType<typeof PasskeyManageDialog> | null>(null)

/**
 * 处理 MFA 操作 (开启/关闭)
 */
const handleMfaAction = async () => {
  if (props.user.mfa_bound) {
    try {
      await ElMessageBox.confirm("确定要关闭二次验证 (MFA) 吗？这将降低您的账号安全性。", "关闭二次验证", {
        confirmButtonText: "确定关闭",
        cancelButtonText: "取消",
        type: "warning"
      })
      mfaLoading.value = true
      await mfaDisableApi()
      ElMessage.success("二次验证已关闭")
      emits("refresh")
    } catch (err) {
      if (err !== "cancel") console.error("关闭 MFA 失败:", err)
    } finally {
      mfaLoading.value = false
    }
  } else {
    showMfaDialog.value = true
    mfaSetupRef.value?.initSetup()
  }
}

const handleMfaSuccess = () => {
  emits("refresh")
}

/**
 * 打开 Passkey 管理
 */
const handleOpenPasskey = () => {
  showPasskeyDialog.value = true
  passkeyManageRef.value?.initData()
}
</script>

<template>
  <section class="auth-governance">
    <div class="auth-settings-card">
      <div class="section-header">
        <el-icon class="header-icon"><Lock /></el-icon>
        <span class="header-title">登录与安全</span>
      </div>

      <!-- 二次验证 (MFA) -->
      <div class="setting-row">
        <div class="setting-main">
          <span class="setting-title">二次验证 (MFA / TOTP)</span>
          <p class="setting-desc">使用身份验证器（如 Google Authenticator）增加登录校验。</p>
        </div>
        <div class="setting-action">
          <el-button
            :type="user.mfa_bound ? 'danger' : 'primary'"
            plain
            class="action-btn"
            :loading="mfaLoading"
            @click="handleMfaAction"
          >
            {{ user.mfa_bound ? "关闭验证" : "立即开启" }}
          </el-button>
        </div>
      </div>

      <!-- Passkey 绑定 -->
      <div class="setting-row">
        <div class="setting-main">
          <span class="setting-title">通行证 (Passkey)</span>
          <p class="setting-desc">使用面容、指纹或硬件密钥实现无密码登录，安全且便捷。</p>
        </div>
        <div class="setting-action">
          <el-button plain class="action-btn" @click="handleOpenPasskey"> 管理设备 </el-button>
        </div>
      </div>
    </div>

    <!-- 拆分出的子组件弹窗 -->
    <MfaSetupDialog ref="mfaSetupRef" v-model="showMfaDialog" @success="handleMfaSuccess" />
    <PasskeyManageDialog ref="passkeyManageRef" v-model="showPasskeyDialog" :user-id="user.id" />
  </section>
</template>

<style lang="scss" scoped>
.auth-settings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  min-height: 72px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;

  .header-icon {
    font-size: 20px;
    color: #3b82f6;
  }

  .header-title {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 0.5px;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 18px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #fcfdfe;
  }
}

.setting-main {
  flex: 1;
}

.setting-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f8fafc;
  color: #64748b;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #e2e8f0;

  &.success {
    background: #f0fdf4;
    color: #15803d;
    border-color: #dcfce7;
  }

  .el-icon {
    font-size: 14px;
  }
}

.setting-action {
  margin-left: 24px;
  flex-shrink: 0;
}

.action-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
</style>
