<script setup lang="ts">
import { ref } from "vue"
import { Lock, CircleCheckFilled } from "@element-plus/icons-vue"
import { loginMfaVerifyApi } from "@/api/iam/user"
import { ElMessage } from "element-plus"

const props = defineProps<{
  mfaToken: string
}>()

const visible = defineModel<boolean>({ default: false })
const loading = ref(false)
const code = ref("")

const emits = defineEmits<{
  (e: "success", data: any): void
}>()

const handleVerify = async () => {
  if (code.value.length !== 6) {
    ElMessage.warning("请输入 6 位验证码")
    return
  }

  loading.value = true
  try {
    const { data } = await loginMfaVerifyApi({
      mfa_token: props.mfaToken,
      code: code.value
    })
    ElMessage.success("身份验证通过")
    visible.value = false
    emits("success", data)
  } catch (err: any) {
    // 只有当尝试次数耗尽或 Token 过期（4010403）时，才强制关闭弹窗
    if (err?.code === 4010403) {
      visible.value = false
    }

    code.value = ""
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="二次身份验证"
    width="440px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    append-to-body
    class="mfa-verify-dialog"
  >
    <div class="mfa-verify-content">
      <div class="header-icon-box">
        <el-icon><Lock /></el-icon>
      </div>
      <div class="header-title">请输入动态验证码</div>
      <div class="header-desc">
        您的账号已开启二次验证保护，请打开身份验证器 App (如 Google Authenticator) 查看 6 位数字验证码。
      </div>

      <div class="input-section">
        <el-input
          v-model="code"
          placeholder="000000"
          maxlength="6"
          class="mfa-code-input"
          @keyup.enter="handleVerify"
          auto-focus
        >
          <template #prefix>
            <el-icon><CircleCheckFilled /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="action-section">
        <el-button type="primary" class="verify-btn" :loading="loading" @click="handleVerify">
          验 证 并 登 录
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss">
.mfa-verify-dialog {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .el-dialog__header {
    margin-right: 0;
    padding: 32px 32px 0;
    text-align: center;
    .el-dialog__title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
    }
  }
  .el-dialog__body {
    padding: 24px 40px 40px;
  }
}

.mfa-verify-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .header-icon-box {
    width: 64px;
    height: 64px;
    background: #f0fdf4;
    color: #10b981;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }

  .header-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .header-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .input-section {
    width: 100%;
    margin-bottom: 24px;

    .mfa-code-input {
      :deep(.el-input__wrapper) {
        height: 56px;
        font-size: 24px;
        letter-spacing: 8px;
        text-align: center;
        border-radius: 12px;
        background: #f8fafc;
        box-shadow: none;
        border: 1px solid #e2e8f0;
        &.is-focus {
          background: #ffffff;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
      }
      :deep(.el-input__inner) {
        text-align: center;
        padding-left: 8px;
      }
    }
  }

  .action-section {
    width: 100%;
    .verify-btn {
      width: 100%;
      height: 52px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);
      transition: all 0.2s;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 20px -5px rgba(16, 185, 129, 0.3);
      }
    }
  }
}
</style>
