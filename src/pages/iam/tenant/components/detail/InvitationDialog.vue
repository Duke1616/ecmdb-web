<script setup lang="ts">
import { ref, computed } from "vue"
import { Drawer } from "@@/components/Dialogs"
import {
  CopyDocument,
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
import type { InvitationVO } from "@/api/iam/invitation/type"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"
import dayjs from "dayjs"

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
const step = ref(1) // 仅在创建模式下有效
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

// --- 计算属性 (统一处理 创建模式 vs 详情模式) ---
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

// --- 逻辑处理 ---
const fetchRoles = async () => {
  try {
    const res = await listRolesApi({ offset: 0, limit: 100 })
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
  <Drawer
    v-model="visible"
    :title="isDetailMode ? '邀请凭证详情' : '邀请成员入驻'"
    :subtitle="isDetailMode ? '查看并分享现有的租户邀请凭证' : '生成邀请链接或二维码，邀请新成员加入租户空间'"
    size="520px"
    :header-icon="isDetailMode ? Link : Message"
    :show-footer="false"
    @closed="reset"
  >
    <div class="invitation-drawer">
      <!-- 配置阶段 (非详情模式 且 第一阶段) -->
      <div v-if="!isDetailMode && step === 1" class="stage config-stage">
        <div class="config-card">
          <!-- 可邀请人数 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><ScaleToOriginal /></el-icon>
              <span>可邀请人数</span>
            </div>
            <div class="segmented-control">
              <div
                v-for="opt in [
                  { label: '1 人', value: 1 },
                  { label: '5 人', value: 5 },
                  { label: '10 人', value: 10 },
                  { label: '不限', value: 0 }
                ]"
                :key="opt.value"
                class="segment-item"
                :class="{ active: form.max_uses === opt.value }"
                @click="form.max_uses = opt.value"
              >
                {{ opt.label }}
              </div>
            </div>
          </div>

          <!-- 有效期限 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><Timer /></el-icon>
              <span>有效期限</span>
            </div>
            <div class="segmented-control">
              <div
                v-for="opt in [
                  { label: '1 天', value: 1 },
                  { label: '7 天', value: 7 },
                  { label: '30 天', value: 30 },
                  { label: '永久', value: 0 }
                ]"
                :key="opt.value"
                class="segment-item"
                :class="{ active: form.expiry_days === opt.value }"
                @click="form.expiry_days = opt.value"
              >
                {{ opt.label }}
              </div>
            </div>
          </div>

          <!-- 预设角色权限 -->
          <div class="form-section">
            <div class="section-label">
              <el-icon><UserFilled /></el-icon>
              <span>预设角色权限</span>
            </div>
            <el-select v-model="form.role_codes" multiple collapse-tags placeholder="选择成员入驻后绑定的角色">
              <el-option v-for="role in roles" :key="role.code" :label="role.name" :value="role.code" />
            </el-select>
          </div>

          <!-- 审批开关 -->
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

      <!-- 结果展示 (详情模式 或 第二阶段) -->
      <div v-else class="stage result-stage">
        <div class="success-badge">
          <div class="success-icon">
            <el-icon><Check /></el-icon>
          </div>
          <h4>{{ isDetailMode ? "专属邀请凭证" : "邀请链接已生成" }}</h4>
          <p>分享以下内容给需要邀请的成员</p>
        </div>

        <div class="qr-card">
          <qrcode-vue :value="displayLink" :size="200" level="H" render-as="svg" foreground="#1e293b" />
          <span class="qr-hint">扫码即可加入租户</span>
        </div>

        <div class="link-card">
          <div class="link-header">
            <el-icon><Link /></el-icon>
            <span>专属邀请链接</span>
          </div>
          <div class="link-body">
            <div class="link-url">{{ displayLink }}</div>
            <el-button type="primary" class="copy-btn" @click="copyLink">
              <el-icon><CopyDocument /></el-icon>
              <span>复制</span>
            </el-button>
          </div>
        </div>

        <!-- 参数摘要 -->
        <div class="summary-card">
          <div class="sum-item">
            <span class="sum-label">可邀请</span>
            <span class="sum-value">{{
              displaySummary.max_uses === 0 ? "不限" : displaySummary.max_uses + " 人"
            }}</span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">有效期</span>
            <span class="sum-value">
              <template v-if="initialData">
                {{ initialData.expire_at === 0 ? "永久" : dayjs(initialData.expire_at).format("YYYY-MM-DD") }}
              </template>
              <template v-else>
                {{ form.expiry_days === 0 ? "永久" : form.expiry_days + " 天" }}
              </template>
            </span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">角色</span>
            <span class="sum-value">{{ displaySummary.role_codes.length || "默认" }}</span>
          </div>
          <div class="sum-divider" />
          <div class="sum-item">
            <span class="sum-label">审批</span>
            <span class="sum-value">{{ displaySummary.require_approval ? "审核" : "自动" }}</span>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
.invitation-drawer {
  padding: 8px 0 20px;
}
.stage {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
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
  & + .form-section {
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }
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
  }
}
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
    color: #64748b;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 700;
    }
  }
}
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
  .approval-title {
    font-size: 14px;
    font-weight: 600;
  }
  .approval-help {
    color: #94a3b8;
  }
}
.generate-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-weight: 600;
}
.result-stage {
  align-items: center;
  gap: 28px;
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
  }
  h4 {
    margin: 0 0 6px 0;
    font-size: 18px;
    color: #1e293b;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}
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
  .qr-hint {
    font-size: 12px;
    color: #64748b;
  }
}
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
    color: #475569;
  }
  .link-body {
    display: flex;
    gap: 10px;
    .link-url {
      flex: 1;
      font-size: 12px;
      color: #334155;
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
  }
}
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
</style>
