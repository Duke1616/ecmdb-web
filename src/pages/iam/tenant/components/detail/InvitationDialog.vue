<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Drawer } from "@@/components/Dialogs"
import {
  CopyDocument,
  Refresh,
  Message,
  UserFilled,
  Timer,
  ScaleToOriginal,
  Link,
  Check,
  QuestionFilled
} from "@element-plus/icons-vue"
import QrcodeVue from "qrcode.vue"
import { createInvitationApi } from "@/api/iam/invitation"
import { listRolesApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"

const visible = defineModel<boolean>({ default: false })

defineProps<{
  tenantId?: number
}>()

const emit = defineEmits<{
  success: []
}>()

const { toClipboard } = useClipboard()

/** 当前阶段：1=配置参数, 2=分享邀请 */
const step = ref(1)
const roles = ref<Role[]>([])
const submitting = ref(false)
const invitationCode = ref("")
const generatedLink = ref("")

const form = ref({
  max_uses: 1,
  expiry_days: 7,
  role_codes: [] as string[],
  require_approval: false
})

/** 可邀请人数预设选项 */
const useCountOptions = [
  { label: "1 人", value: 1 },
  { label: "5 人", value: 5 },
  { label: "10 人", value: 10 },
  { label: "不限", value: 0 }
]

/** 有效期限预设选项 */
const expiryOptions = [
  { label: "1 天", value: 1 },
  { label: "7 天", value: 7 },
  { label: "30 天", value: 30 },
  { label: "永久", value: 0 }
]

/** 获取角色列表 */
const fetchRoles = async () => {
  try {
    const res = await listRolesApi({ offset: 0, limit: 100 })
    roles.value = res.data.roles || []
  } catch (error) {
    console.error("Failed to fetch roles", error)
  }
}

/** 生成邀请链接 */
const handleGenerate = async () => {
  submitting.value = true
  try {
    const res = await createInvitationApi({
      max_uses: form.value.max_uses,
      expiry_days: form.value.expiry_days,
      role_codes: form.value.role_codes,
      require_approval: form.value.require_approval
    })
    invitationCode.value = res.data.code
    const baseUrl = window.location.origin
    generatedLink.value = `${baseUrl}/join?code=${res.data.code}`
    step.value = 2
    ElMessage.success("邀请链接已生成")
    emit("success")
  } catch (error) {
    console.error("Generate invitation failed:", error)
    ElMessage.error("生成邀请链接失败，请稍后重试")
  } finally {
    submitting.value = false
  }
}

/** 复制链接 */
const copyLink = async () => {
  try {
    await toClipboard(generatedLink.value)
    ElMessage.success("链接已复制到剪贴板")
  } catch (e) {
    ElMessage.error("复制失败，请尝试手动选择复制")
  }
}

/** 重置状态 */
const reset = () => {
  step.value = 1
  invitationCode.value = ""
  generatedLink.value = ""
  form.value = {
    max_uses: 1,
    expiry_days: 7,
    role_codes: [] as string[],
    require_approval: false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <Drawer
    v-model="visible"
    title="邀请成员入驻"
    subtitle="生成邀请链接或二维码，邀请新成员加入租户空间"
    size="520px"
    :header-icon="Message"
    :show-footer="false"
    @closed="reset"
  >
    <div class="invitation-drawer">
      <!-- 阶段一：配置参数 -->
      <div v-if="step === 1" class="stage config-stage">
        <div class="config-card">
          <!-- 可邀请人数 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><ScaleToOriginal /></el-icon>
              <span>可邀请人数</span>
            </div>
            <div class="segmented-control">
              <div
                v-for="opt in useCountOptions"
                :key="opt.value"
                class="segment-item"
                :class="{ active: form.max_uses === opt.value }"
                @click="form.max_uses = opt.value"
              >
                {{ opt.label }}
              </div>
            </div>
            <p class="section-desc">达到上限后，该邀请链接将自动失效</p>
          </div>

          <!-- 有效期限 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><Timer /></el-icon>
              <span>有效期限</span>
            </div>
            <div class="segmented-control">
              <div
                v-for="opt in expiryOptions"
                :key="opt.value"
                class="segment-item"
                :class="{ active: form.expiry_days === opt.value }"
                @click="form.expiry_days = opt.value"
              >
                {{ opt.label }}
              </div>
            </div>
            <p class="section-desc">超过有效期后，邀请链接将自动失效</p>
          </div>

          <!-- 预设角色权限 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><UserFilled /></el-icon>
              <span>预设角色权限</span>
            </div>
            <el-select
              v-model="form.role_codes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择成员入驻后自动绑定的角色"
              class="role-select"
            >
              <el-option v-for="role in roles" :key="role.code" :label="role.name" :value="role.code">
                <div class="role-option">
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-code">{{ role.code }}</span>
                </div>
              </el-option>
            </el-select>
            <p class="section-desc">新成员通过邀请入驻后，将自动拥有选中的角色权限</p>
          </div>

          <!-- 入驻审批 -->
          <div class="approval-row">
            <div class="approval-left">
              <span class="approval-title">{{ form.require_approval ? "人工审核" : "自动通过" }}</span>
              <el-tooltip content="开启后，成员扫码后需经管理员审核方可正式加入租户" placement="top">
                <el-icon class="approval-help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-switch
              v-model="form.require_approval"
              style="--el-switch-on-color: #f59e0b; --el-switch-off-color: #10b981"
            />
          </div>

          <el-button type="primary" class="generate-btn" :loading="submitting" @click="handleGenerate">
            <el-icon><Link /></el-icon>
            <span>生成邀请链接</span>
          </el-button>
        </div>
      </div>

      <!-- 阶段二：分享邀请 -->
      <div v-else class="stage result-stage">
        <!-- 成功状态 -->
        <div class="success-badge">
          <div class="success-icon">
            <el-icon><Check /></el-icon>
          </div>
          <h4>邀请链接已生成</h4>
          <p>将以下链接或二维码分享给需要邀请的成员</p>
        </div>

        <!-- 二维码卡片 -->
        <div class="qr-card">
          <qrcode-vue :value="generatedLink" :size="200" level="H" render-as="svg" foreground="#1e293b" />
          <span class="qr-hint">扫码即可加入租户</span>
        </div>

        <!-- 链接卡片 -->
        <div class="link-card">
          <div class="link-header">
            <el-icon><Link /></el-icon>
            <span>专属邀请链接</span>
          </div>
          <div class="link-body">
            <div class="link-url">{{ generatedLink }}</div>
            <el-button type="primary" class="copy-btn" @click="copyLink">
              <el-icon><CopyDocument /></el-icon>
              <span>复制</span>
            </el-button>
          </div>
        </div>

        <!-- 邀请参数摘要 -->
        <div class="summary-card">
          <div class="sum-item">
            <span class="sum-label">可邀请</span>
            <span class="sum-value">{{ form.max_uses === 0 ? "不限人数" : form.max_uses + " 人" }}</span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">有效期</span>
            <span class="sum-value">{{ form.expiry_days === 0 ? "永久有效" : form.expiry_days + " 天" }}</span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">预设角色</span>
            <span class="sum-value">{{ form.role_codes.length > 0 ? form.role_codes.length + " 个" : "默认" }}</span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">审批模式</span>
            <span class="sum-value">{{ form.require_approval ? "人工审核" : "自动入驻" }}</span>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="result-actions">
          <el-button class="reset-btn" @click="reset">
            <el-icon><Refresh /></el-icon>
            <span>重新配置</span>
          </el-button>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
.invitation-drawer {
  padding: 8px 0 20px;
}

/* 阶段容器 */
.stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ==================== 配置阶段 ==================== */

.config-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-section + .form-section {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;

  .el-icon {
    color: #3b82f6;
    font-size: 15px;
  }

  .mode-tag {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    height: 22px;
    padding: 0 8px;
  }
}

.section-desc {
  margin: 0;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

/* 分段控制器 */
.segmented-control {
  display: flex;
  gap: 8px;

  .segment-item {
    flex: 1;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;

    &:hover {
      border-color: #94a3b8;
      color: #475569;
    }

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 700;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    }
  }
}

/* 角色选择 */
.role-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #3b82f6 inset;
  }
}

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .role-name {
    font-weight: 500;
    font-size: 13px;
  }

  .role-code {
    font-size: 11px;
    color: #94a3b8;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
}

/* 审批开关行 */
.approval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
}

.approval-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.approval-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.approval-help {
  font-size: 16px;
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s ease;

  &:hover {
    color: #3b82f6;
  }
}

:deep(.el-switch__core) {
  height: 24px;
  border-radius: 12px;
}

:deep(.el-switch__inner) {
  font-size: 11px;
  font-weight: 600;
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: #2563eb;
  border: none;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.1);
  transition: all 0.15s ease;
  letter-spacing: 0.02em;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  &:active {
    background: #1e40af;
    transform: scale(0.998);
  }

  .el-icon {
    margin-right: 6px;
    font-size: 15px;
  }
}

/* ==================== 结果阶段 ==================== */

.result-stage {
  align-items: center;
}

.success-badge {
  text-align: center;

  .success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    .el-icon {
      font-size: 28px;
    }
  }

  h4 {
    margin: 0 0 6px 0;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

/* 二维码卡片 */
.qr-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .qr-hint {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
}

/* 链接卡片 */
.link-card {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .link-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;

    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }
  }

  .link-body {
    display: flex;
    align-items: center;
    gap: 10px;

    .link-url {
      flex: 1;
      font-size: 12px;
      color: #334155;
      font-family: ui-monospace, SFMono-Regular, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .copy-btn {
      flex-shrink: 0;
      border-radius: 8px;
      font-weight: 600;
      padding: 0 16px;
      height: 36px;
    }
  }
}

/* 摘要卡片 */
.summary-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;

  .sum-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .sum-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .sum-value {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .sum-divider {
    width: 1px;
    height: 28px;
    background: #cbd5e1;
  }
}

/* 底部操作 */
.result-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 4px;

  .reset-btn {
    color: #64748b;
    font-weight: 500;
    font-size: 13px;

    &:hover {
      color: #3b82f6;
    }

    .el-icon {
      margin-right: 4px;
    }
  }
}
</style>
