<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { FormDialog } from "@@/components/Dialogs"
import {
  CopyDocument,
  Message,
  UserFilled,
  Timer,
  ScaleToOriginal,
  Link,
  Check,
  QuestionFilled,
  Lock,
  Promotion,
  CircleCheckFilled
} from "@element-plus/icons-vue"
import QrcodeVue from "qrcode.vue"
import { createInvitationApi } from "@/api/iam/invitation"
import { listRolesApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import type { InvitationVO } from "@/api/iam/invitation/type"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"
import dayjs from "dayjs"

// 该组件为独立的状态控制器，用于管理邀请凭证的创建与展示
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  tenantId?: number
  initialData?: InvitationVO | null
}>()

const emit = defineEmits<{
  success: []
}>()

const { toClipboard } = useClipboard()

// --- 状态定义 ---
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

// --- 计算属性 ---
const isDetailMode = computed(() => !!props.initialData)

const displayLink = computed(() => {
  if (props.initialData) {
    return `${window.location.origin}/join?code=${props.initialData.code}`
  }
  return generatedLink.value
})

const displaySummary = computed(() => {
  if (props.initialData) return props.initialData
  return {
    max_uses: form.value.max_uses,
    role_codes: form.value.role_codes,
    require_approval: form.value.require_approval,
    expire_at: 0
  }
})

const displayExpiry = computed(() => {
  if (props.initialData) {
    return props.initialData.expire_at === 0 ? "永久有效" : dayjs(props.initialData.expire_at).format("YYYY-MM-DD")
  }
  return form.value.expiry_days === 0 ? "永久有效" : `${form.value.expiry_days} 天`
})

// --- 逻辑处理 ---
const fetchRoles = async () => {
  try {
    const res = await listRolesApi({
      offset: 0,
      limit: 100,
      tenant_id: props.tenantId
    })
    roles.value = res.data.roles || []
  } catch (error) {
    console.error("Failed to fetch roles", error)
  }
}

const handleGenerate = async () => {
  submitting.value = true
  try {
    const res = await createInvitationApi({
      max_uses: form.value.max_uses,
      expiry_days: form.value.expiry_days,
      role_codes: form.value.role_codes,
      require_approval: form.value.require_approval,
      tenant_id: props.tenantId
    })
    invitationCode.value = res.data.code
    generatedLink.value = `${window.location.origin}/join?code=${res.data.code}`
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

const copyLink = async () => {
  try {
    await toClipboard(displayLink.value)
    ElMessage.success("链接已复制到剪贴板")
  } catch (e) {
    ElMessage.error("复制失败")
  }
}

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

// 监听打开时加载角色 (仅在创建模式且列表为空时)
watch(visible, (val) => {
  if (val && !isDetailMode.value && roles.value.length === 0) {
    fetchRoles()
  }
})
</script>

<template>
  <FormDialog
    v-model="visible"
    :title="isDetailMode ? '邀请凭证详情' : '邀请成员入驻'"
    :subtitle="isDetailMode ? '查看并分享现有的租户邀请凭证' : '生成邀请链接或二维码，邀请新成员加入租户空间'"
    width="560px"
    :header-icon="isDetailMode ? Link : Message"
    :show-footer="!isDetailMode && step === 1"
    confirm-text="生成邀请链接"
    :confirm-loading="submitting"
    @confirm="handleGenerate"
    @closed="reset"
  >
    <div class="inv-wrap">
      <!-- ① 配置阶段 -->
      <div v-if="!isDetailMode && step === 1" class="config-stage">
        <!-- 审批模式选择器 (卡片式) -->
        <div class="form-section">
          <div class="field-label">
            <el-icon><Lock /></el-icon>
            <span>准入审批模式</span>
          </div>
          <div class="approval-selector">
            <!-- 自动通过 -->
            <div
              class="approval-option auto"
              :class="{ active: !form.require_approval }"
              @click="form.require_approval = false"
            >
              <div class="option-icon">
                <el-icon><Promotion /></el-icon>
              </div>
              <div class="option-main">
                <div class="option-title">自动通过</div>
                <div class="option-desc">无需干预，即刻入驻</div>
              </div>
              <div class="option-check">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
            </div>

            <!-- 人工审核 -->
            <div
              class="approval-option manual"
              :class="{ active: form.require_approval }"
              @click="form.require_approval = true"
            >
              <div class="option-icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="option-main">
                <div class="option-title">人工审核</div>
                <div class="option-desc">管理员审批后入驻</div>
              </div>
              <div class="option-check">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </div>
        <div class="form-section">
          <div class="field-label">
            <el-icon><ScaleToOriginal /></el-icon>
            <span>单次最大入驻人数</span>
          </div>
          <div class="seg-group">
            <div
              v-for="opt in [
                { label: '1 人', value: 1 },
                { label: '5 人', value: 5 },
                { label: '10 人', value: 10 },
                { label: '不限', value: 0 }
              ]"
              :key="opt.value"
              class="seg-item"
              :class="{ active: form.max_uses === opt.value }"
              @click="form.max_uses = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="field-label">
            <el-icon><Timer /></el-icon>
            <span>凭证有效期限</span>
          </div>
          <div class="seg-group">
            <div
              v-for="opt in [
                { label: '1 天', value: 1 },
                { label: '7 天', value: 7 },
                { label: '30 天', value: 30 },
                { label: '永久', value: 0 }
              ]"
              :key="opt.value"
              class="seg-item"
              :class="{ active: form.expiry_days === opt.value }"
              @click="form.expiry_days = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
        </div>

        <div class="form-section no-margin">
          <div class="field-label">
            <el-icon><UserFilled /></el-icon>
            <span>预设角色权限</span>
          </div>
          <el-select
            v-model="form.role_codes"
            multiple
            collapse-tags
            placeholder="选择成员入驻后绑定的角色"
            style="width: 100%"
          >
            <el-option v-for="role in roles" :key="role.code" :label="role.name" :value="role.code" />
          </el-select>
        </div>
      </div>

      <!-- ② 结果阶段：单栏、流式、绝对稳健 -->
      <div v-else class="result-stage">
        <!-- 成功提示条 -->
        <div class="success-banner">
          <div class="success-icon-wrap">
            <el-icon><Check /></el-icon>
          </div>
          <div class="success-text">
            <strong>{{ isDetailMode ? "邀请凭证详情" : "邀请链接已就绪" }}</strong>
            <span>{{ isDetailMode ? "该凭证的治理配置摘要" : "链接已生成，可立即分发给新成员" }}</span>
          </div>
        </div>

        <!-- QR + 链接：水平排列 -->
        <div class="share-row">
          <!-- 二维码 -->
          <div class="qr-wrap">
            <qrcode-vue :value="displayLink" :size="120" level="H" render-as="svg" foreground="#0f172a" />
            <span class="qr-label">扫码申请加入</span>
          </div>

          <!-- 链接复制 -->
          <div class="link-wrap">
            <div class="link-label">
              <el-icon><Link /></el-icon>
              <span>专属邀请链接</span>
            </div>
            <div class="link-copy-row">
              <div class="link-url-box">{{ displayLink }}</div>
              <el-button type="primary" class="copy-btn" @click="copyLink">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 参数摘要：横向一行 4 格 -->
        <div class="meta-strip">
          <div class="meta-item">
            <div class="meta-icon users">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="meta-info">
              <span class="meta-label">可邀请</span>
              <span class="meta-value">{{
                displaySummary.max_uses === 0 ? "不限" : displaySummary.max_uses + " 人"
              }}</span>
            </div>
          </div>
          <div class="meta-divider" />
          <div class="meta-item">
            <div class="meta-icon timer">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="meta-info">
              <span class="meta-label">有效期</span>
              <span class="meta-value">{{ displayExpiry }}</span>
            </div>
          </div>
          <div class="meta-divider" />
          <div class="meta-item">
            <div class="meta-icon roles">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="meta-info">
              <span class="meta-label">绑定角色</span>
              <span class="meta-value">{{
                displaySummary.role_codes.length ? displaySummary.role_codes.length + " 个" : "默认"
              }}</span>
            </div>
          </div>
          <div class="meta-divider" />
          <div class="meta-item">
            <div class="meta-icon shield">
              <el-icon><QuestionFilled /></el-icon>
            </div>
            <div class="meta-info">
              <span class="meta-label">审批</span>
              <span class="meta-value">{{ displaySummary.require_approval ? "人工审核" : "自动准入" }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
/* ==============================
   共用包裹
============================== */
.inv-wrap {
  padding: 4px 0 8px;
}

/* ==============================
   配置阶段
============================== */
.config-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  .el-icon {
    color: #3b82f6;
    font-size: 15px;
  }
}

.seg-group {
  display: flex;
  gap: 8px;
}

.seg-item {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;
  background: #fff;
  user-select: none;
  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #2563eb;
    font-weight: 700;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
  }
}

.approval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.approval-help {
  color: #94a3b8;
  cursor: help;
  margin-left: 4px;
}

/* --- 审批选择器 --- */
.approval-selector {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.approval-option {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    transform: translateY(-1px);
  }

  .option-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 18px;
    background: #f1f5f9;
    color: #64748b;
    transition: all 0.3s ease;
  }

  .option-main {
    flex: 1;
    min-width: 0;
    .option-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 2px;
    }
    .option-desc {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .option-check {
    opacity: 0;
    transform: scale(0.5);
    font-size: 18px;
    transition: all 0.2s ease;
  }

  /* 选中态：自动 */
  &.auto.active {
    border-color: #10b981;
    background: #f0fdf4;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    .option-icon {
      background: #10b981;
      color: #ffffff;
    }
    .option-title {
      color: #065f46;
    }
    .option-desc {
      color: #16a34a;
    }
    .option-check {
      opacity: 1;
      transform: scale(1);
      color: #10b981;
    }
  }

  /* 选中态：人工 */
  &.manual.active {
    border-color: #f59e0b;
    background: #fffbeb;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
    .option-icon {
      background: #f59e0b;
      color: #ffffff;
    }
    .option-title {
      color: #92400e;
    }
    .option-desc {
      color: #d97706;
    }
    .option-check {
      opacity: 1;
      transform: scale(1);
      color: #f59e0b;
    }
  }
}

/* ==============================
   结果阶段
============================== */
.result-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* --- 成功提示条 --- */
.success-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 14px;

  .success-icon-wrap {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
  }

  .success-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    strong {
      font-size: 15px;
      font-weight: 800;
      color: #065f46;
    }
    span {
      font-size: 12px;
      color: #047857;
    }
  }
}

/* --- QR + 链接水平行 --- */
.share-row {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

/* 二维码区 */
.qr-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease;
  cursor: default;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  }
  .qr-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
    white-space: nowrap;
  }
}

/* 链接区 */
.link-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;

  .link-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    .el-icon {
      font-size: 13px;
    }
  }

  .link-copy-row {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;

    .link-url-box {
      flex: 1;
      min-width: 0;
      height: 38px;
      line-height: 38px;
      padding: 0 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 12px;
      font-family: ui-monospace, "Roboto Mono", monospace;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-btn {
      flex-shrink: 0;
      height: 38px;
      padding: 0 16px;
      font-weight: 700;
      border-radius: 10px;
      transition: all 0.2s ease;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
      }
    }
  }
}

/* --- 参数摘要横条 --- */
.meta-strip {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.meta-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
  flex-shrink: 0;
  margin: 0 16px;
}

.meta-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .meta-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    &.users {
      background: #eff6ff;
      color: #3b82f6;
    }
    &.timer {
      background: #fef3c7;
      color: #d97706;
    }
    &.roles {
      background: #f5f3ff;
      color: #8b5cf6;
    }
    &.shield {
      background: #ecfdf5;
      color: #10b981;
    }
  }

  .meta-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
