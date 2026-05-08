<script setup lang="ts">
import { ref, nextTick } from "vue"
import { CopyDocument } from "@element-plus/icons-vue"
import { mfaTotpSetupApi, mfaTotpBindApi } from "@/api/iam/user"
import { ElMessage } from "element-plus"
import type { MfaTotpSetupResponse } from "@/api/iam/user/type"
import { FormDialog } from "@@/components/Dialogs"
import QrcodeVue from "qrcode.vue"

const visible = defineModel<boolean>({ default: false })
const emits = defineEmits<{
  (e: "success"): void
}>()

const loading = ref(false)
const setupData = ref<MfaTotpSetupResponse | null>(null)

// 分段式输入状态
const codes = ref(["", "", "", "", "", ""])
const inputRefs = ref<any[]>([])

/**
 * 初始化 MFA 配置
 */
const initSetup = async () => {
  loading.value = true
  try {
    const { data } = await mfaTotpSetupApi()
    setupData.value = data
    codes.value = ["", "", "", "", "", ""]
    // 自动聚焦第一个框
    nextTick(() => {
      inputRefs.value[0]?.focus()
    })
  } catch (err) {
    console.error("获取 MFA 配置失败:", err)
    visible.value = false
  } finally {
    loading.value = false
  }
}

/**
 * 处理输入逻辑
 */
const handleInput = (index: number, e: any) => {
  const val = e.target.value
  if (val && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }

  // 检查是否输完 6 位，自动触发验证
  if (codes.value.every((c) => c !== "")) {
    handleBind()
  }
}

const handleKeydown = (index: number, e: KeyboardEvent) => {
  if (e.key === "Backspace" && !codes.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

/**
 * 复制密钥
 */
const copySecret = () => {
  if (setupData.value?.secret) {
    navigator.clipboard.writeText(setupData.value.secret)
    ElMessage.success("密钥已复制到剪贴板")
  }
}

/**
 * 确认绑定 MFA
 */
const handleBind = async () => {
  const fullCode = codes.value.join("")
  if (fullCode.length !== 6) {
    ElMessage.warning("请输入 6 位完整验证码")
    return
  }

  loading.value = true
  try {
    await mfaTotpBindApi({
      code: fullCode,
      secret: setupData.value?.secret || ""
    })
    ElMessage.success("二次验证 (MFA) 开启成功")
    visible.value = false
    emits("success")
  } finally {
    loading.value = false
  }
}

defineExpose({ initSetup })
</script>

<template>
  <FormDialog
    v-model="visible"
    title="配置二次验证 (MFA)"
    subtitle="加强账号安全，防止未经授权的访问"
    width="460px"
    header-icon="Iphone"
    @confirm="handleBind"
    @cancel="visible = false"
    :confirm-loading="loading"
  >
    <div class="mfa-premium-layout">
      <!-- 步骤 1: 扫描 -->
      <div class="setup-section">
        <div class="section-label">
          <span class="step-badge">1</span>
          扫描二维码
        </div>
        <div class="qrcode-container">
          <div class="scanner-frame">
            <div class="corner top-left" />
            <div class="corner top-right" />
            <div class="corner bottom-left" />
            <div class="corner bottom-right" />
            <div class="qrcode-content" v-loading="loading">
              <qrcode-vue
                v-if="setupData?.qrcode_url"
                :value="setupData.qrcode_url"
                :size="140"
                level="H"
                render-as="svg"
              />
            </div>
          </div>
          <div class="manual-entry">
            <p>无法扫描？请手动输入密钥：</p>
            <div class="secret-box" @click="copySecret">
              <code>{{ setupData?.secret || "********" }}</code>
              <el-icon><CopyDocument /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤 2: 验证 -->
      <div class="setup-section mt-6">
        <div class="section-label">
          <span class="step-badge">2</span>
          验证并激活
        </div>
        <p class="step-hint">输入身份验证器中显示的 6 位动态验证码</p>

        <div class="segmented-input-wrapper">
          <input
            v-for="(digit, index) in codes"
            :key="index"
            :ref="(el) => (inputRefs[index] = el)"
            v-model="codes[index]"
            type="text"
            maxlength="1"
            class="digit-input"
            @input="handleInput(index, $event)"
            @keydown="handleKeydown(index, $event)"
          />
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
.mfa-premium-layout {
  padding: 4px 10px 10px;
}

.setup-section {
  .section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;

    .step-badge {
      width: 20px;
      height: 20px;
      background: #3b82f6;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
  }

  .step-hint {
    font-size: 12px;
    color: #64748b;
    margin: -6px 0 16px 30px;
  }
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.scanner-frame {
  position: relative;
  padding: 8px;
  background: #ffffff;

  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border: 2px solid #3b82f6;
  }

  .top-left {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 6px;
  }
  .top-right {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
    border-top-right-radius: 6px;
  }
  .bottom-left {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 6px;
  }
  .bottom-right {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 6px;
  }

  .qrcode-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
    min-height: 140px;
  }
}

.manual-entry {
  text-align: center;
  p {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  .secret-box {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: #f8fafc;
    border: 1px dashed #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f1f5f9;
      border-color: #3b82f6;
      color: #3b82f6;
    }

    code {
      font-family: ui-monospace, monospace;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
  }
}

.segmented-input-wrapper {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;

  .digit-input {
    width: 40px;
    height: 48px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.05);
      transform: translateY(-1px);
    }
  }
}
</style>
