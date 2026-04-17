<template>
  <div class="eiam-governance-sheet">
    <!-- 1. 治理丝带 (Governance Ribbon)：极简水平整合 -->
    <div class="governance-ribbon">
      <div class="ribbon-identity">
        <el-upload
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleAvatarChange"
          accept="image/*"
        >
          <div class="avatar-hotspot">
            <el-avatar :size="32" :src="formData.avatar" class="ribbon-avatar">
              {{ formData.nickname?.charAt(0) || formData.username?.charAt(0) || "U" }}
            </el-avatar>
          </div>
        </el-upload>
        <div class="name-id-stack">
          <span class="name">{{ formData.nickname || "新主体" }}</span>
          <code class="id">{{ isEdit ? `@${formData.username}` : "INIT" }}</code>
        </div>

        <div class="status-pill" :class="formData.status">
          {{ formData.status === "active" ? "正常" : "锁定" }}
        </div>
      </div>

      <div class="ribbon-actions">
        <el-radio-group v-model="activeTab" size="small" class="ribbon-pills">
          <el-radio-button label="base">基础治理</el-radio-button>
          <el-radio-button v-if="isEdit" label="tenants">
            所属空间 <span v-if="tenants.length" class="count">({{ tenants.length }})</span>
          </el-radio-button>
          <el-radio-button v-if="isEdit" label="identities">
            身份链路 <span v-if="identities.length" class="count">({{ identities.length }})</span>
          </el-radio-button>
        </el-radio-group>

        <div v-if="isEdit" class="ribbon-divider" />

        <div v-if="isEdit" class="compact-status">
          <el-switch v-model="formData.status" active-value="active" inactive-value="disabled" size="small" />
        </div>
      </div>
    </div>

    <!-- 2. 二级属性快览栏 -->
    <div v-if="isEdit" class="meta-snapshot-bar">
      <div class="snap-item">
        <span class="label">绑定邮箱</span>
        <span class="value">{{ formData.email || "-" }}</span>
      </div>
      <div class="snap-item">
        <span class="label">所属岗位</span>
        <span class="value">{{ formData.job_title || "未配置" }}</span>
      </div>
      <div class="snap-item">
        <span class="label">安全评分</span>
        <span class="value secure">A+ High</span>
      </div>
      <div class="snap-item">
        <span class="label">账户类型</span>
        <span class="value">Core Principal</span>
      </div>
    </div>

    <!-- 3. 主体录入区：定高滚动，确保标题与快览区固定 -->
    <el-scrollbar class="governance-body-scrollbar">
      <div class="governance-body-content">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="governance-form">
          <!-- 基础配置流 -->
          <div v-show="activeTab === 'base'" class="sector-animation">
            <!-- 基础信息篇章 -->
            <div class="governance-section is-first-section">
              <div class="section-header">
                <div class="header-title">
                  <el-icon><User /></el-icon>
                  <span>基础配置设定</span>
                </div>
                <div class="header-tag" style="color: #64748b">主要身份标识</div>
              </div>

              <div class="field-panel">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="凭证标识" prop="username">
                      <el-input
                        v-model="formData.username"
                        :disabled="isEdit"
                        class="gov-input mono"
                        placeholder="请输入唯一用户名"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="显示名称" prop="nickname">
                      <el-input v-model="formData.nickname" class="gov-input" placeholder="请输入全名或昵称" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="联系邮件" prop="email">
                      <el-input v-model="formData.email" class="gov-input" placeholder="example@domain.com" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="岗位职称" prop="job_title">
                      <el-input v-model="formData.job_title" class="gov-input" placeholder="系统架构师 / 安全审计员" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 访问控制初始化：统一的平铺式章节 -->
            <div v-if="!isEdit" class="governance-section">
              <div class="section-header">
                <div class="header-title">
                  <el-icon><Lock /></el-icon>
                  <span>访问口令初始化</span>
                </div>
                <div class="header-tag" :style="{ color: strengthColor }">
                  风险等级：{{ passwordStrength < 50 ? "高" : "低" }}
                </div>
              </div>

              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="初始密码" prop="password">
                    <el-input
                      v-model="formData.password"
                      type="password"
                      show-password
                      class="gov-input"
                      placeholder="设置登录口令"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="再次确认" prop="confirm_password">
                    <el-input
                      v-model="formData.confirm_password"
                      type="password"
                      show-password
                      class="gov-input"
                      placeholder="重复输入以确认"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="password-audit-bar">
                <div class="audit-rail">
                  <div class="fill" :style="{ width: passwordStrength + '%', background: strengthColor }" />
                </div>
                <div class="step-audit-group">
                  <div class="audit-step" :class="{ 'is-active': formData.password?.length >= 8 }">
                    <el-icon v-if="formData.password?.length >= 8"><SuccessFilled /></el-icon>
                    <span v-else class="step-dot" />
                    <span>长度 ≥ 8</span>
                  </div>
                  <div class="step-connector" />
                  <div class="audit-step" :class="{ 'is-active': /[A-Z]/.test(formData.password || '') }">
                    <el-icon v-if="/[A-Z]/.test(formData.password || '')"><SuccessFilled /></el-icon>
                    <span v-else class="step-dot" />
                    <span>含大写字母</span>
                  </div>
                  <div class="step-connector" />
                  <div class="audit-step" :class="{ 'is-active': /[^a-zA-Z0-9]/.test(formData.password || '') }">
                    <el-icon v-if="/[^a-zA-Z0-9]/.test(formData.password || '')"><SuccessFilled /></el-icon>
                    <span v-else class="step-dot" />
                    <span>含特殊符号</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空间资产流 -->
          <div v-show="activeTab === 'tenants'" class="sector-animation">
            <div class="asset-data-grid">
              <div v-for="t in tenants" :key="t.id" class="asset-tile cursor-pointer">
                <div class="tile-logo">{{ t.name.charAt(0) }}</div>
                <div class="tile-body">
                  <span class="tile-name">{{ t.name }}</span>
                  <span class="tile-code">{{ t.code }}</span>
                </div>
              </div>
              <el-empty v-if="!tenants.length" description="该用户处于孤立状态，未加入任何业务空间" />
            </div>
          </div>

          <!-- 身份溯源流 -->
          <div v-show="activeTab === 'identities'" class="sector-animation">
            <div class="identity-timeline">
              <div v-for="id in identities" :key="id.provider" class="timeline-row">
                <div class="source-icon" :class="id.provider.toLowerCase()">{{ id.provider.charAt(0) }}</div>
                <div class="source-detail">
                  <label>{{ id.provider }} Identity Source</label>
                  <code class="mono-text">{{ getIdentityValue(id) }}</code>
                </div>
              </div>
              <el-empty v-if="!identities.length" description="未检测到第三方身份关联链路" />
            </div>
          </div>
        </el-form>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { Lock, SuccessFilled, User } from "@element-plus/icons-vue"
import { signupApi, updateUserApi, userDetailApi } from "@/api/iam/user"
import type { Identity, Tenant } from "@/api/iam/user/type"

const props = defineProps<{
  isEdit: boolean
  id?: number
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const activeTab = ref("base")
const formRef = ref<FormInstance>()

const formData = reactive({
  username: "",
  nickname: "",
  email: "",
  job_title: "",
  avatar: "",
  password: "",
  confirm_password: "",
  status: "active"
})

const tenants = ref<Tenant[]>([])
const identities = ref<Identity[]>([])

const passwordStrength = computed(() => {
  const p = formData.password || ""
  if (!p) return 0
  let s = 10
  if (p.length >= 8) s += 30
  if (/[A-Z]/.test(p)) s += 30
  if (/[^a-zA-Z0-9]/.test(p)) s += 30
  return s
})

const strengthColor = computed(() => {
  if (passwordStrength.value < 40) return "#f43f5e"
  if (passwordStrength.value < 70) return "#f59e0b"
  return "#10b981"
})

const handleAvatarChange = (file: any) => {
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    formData.avatar = reader.result as string
  }
}

const getIdentityValue = (id: Identity) => {
  if (id.ldap_info) return id.ldap_info.dn
  if (id.wechat_info) return id.wechat_info.user_id
  if (id.feishu_info) return id.feishu_info.user_id
  return "N/A"
}

const loadUserDetail = async () => {
  if (!props.id) return
  const { data } = await userDetailApi(props.id)
  Object.assign(formData, data.user)
  tenants.value = data.tenants || []
  identities.value = data.user.identities || []
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (props.isEdit) {
    await updateUserApi({ id: Number(props.id), ...formData })
  } else {
    await signupApi({ ...formData })
  }
  emit("success")
}

onMounted(() => {
  if (props.isEdit) loadUserDetail()
})

const formRules = reactive<FormRules>({
  username: [{ required: true, message: "必须要填写主体标识", trigger: "blur" }],
  confirm_password: [
    {
      validator: (rule, value, callback) => {
        if (!props.isEdit && value !== formData.password) {
          callback(new Error("两次输入的口令不一致"))
        } else callback()
      },
      trigger: "blur"
    }
  ]
})

defineExpose({ submit })
</script>

<style lang="scss" scoped>
.eiam-governance-sheet {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 75vh; /* 魔法限高：内容少时自动收缩，内容多时长到这里停止并滚动 */
  min-width: 0;
  background: white;
  overflow: hidden;
}

/* 1. 治理丝带 (Ribbon) */
.governance-ribbon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  .ribbon-identity {
    display: flex;
    align-items: center;
    gap: 10px;

    .ribbon-avatar {
      background: #4f46e5;
      font-weight: 800;
      color: white;
      cursor: pointer;
    }

    .name-id-stack {
      display: flex;
      align-items: baseline;
      gap: 6px;
      .name {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
      }
      .id {
        font-family: "Fira Code", monospace;
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
      }
    }

    .status-pill {
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #10b981;
      &.disabled {
        background: #fef2f2;
        color: #ef4444;
      }
    }
  }

  .ribbon-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .ribbon-pills {
      :deep(.el-radio-button__inner) {
        border: none !important;
        background: transparent;
        color: #64748b;
        border-radius: 6px !important;
        padding: 4px 10px;
        font-weight: 700;
        font-size: 12px;
        transition: 0.2s;
      }
      :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
        background: #ffffff;
        color: #4f46e5;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
      }
    }

    .ribbon-divider {
      width: 1px;
      height: 14px;
      background: #cbd5e1;
    }
  }
}

.meta-snapshot-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  .snap-item {
    display: flex;
    flex-direction: column;
    .label {
      font-size: 9px;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
    }
    .value {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      &.secure {
        color: #10b981;
      }
    }
  }
}

.governance-body-scrollbar {
  flex: 1;
  min-height: 0;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.governance-body-content {
  padding: 16px 24px 24px; /* 底部留足空间给保存按钮上方 */
}

.governance-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.sector-animation {
  animation: slideUp 0.3s ease-out;
}

.gov-input {
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    height: 36px;
    border-radius: 8px;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus {
      background: #ffffff;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
    }
  }
  &.mono :deep(.el-input__inner) {
    font-family: "Fira Code", monospace;
    font-size: 12px;
  }
}

/* 统一的章节样式库 */
.governance-section {
  margin-top: 16px;
  padding-top: 20px;
  position: relative;

  &.is-first-section {
    margin-top: 4px;
    padding-top: 0;
    &::before {
      display: none;
    }
  }

  /* 分割线横贯全屏，增加秩序感 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -24px;
    right: -24px;
    height: 1px;
    background: #f1f5f9;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
      .el-icon {
        color: #6366f1;
        font-size: 16px;
      }
    }
    .header-tag {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.password-audit-bar {
  margin-top: 10px;
  .audit-rail {
    height: 3px;
    background: #f1f5f9;
    border-radius: 1.5px;
    overflow: hidden;
    margin-bottom: 12px;
    .fill {
      height: 100%;
      transition: width 0.4s ease;
    }
  }
  .step-audit-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 2px 0; /* 再次收紧垂直高度 */

    .step-connector {
      flex: 1;
      height: 1px;
      margin: 0 16px;
      /* 使用更淡的虚线，防止干扰视线 */
      background: repeating-linear-gradient(90deg, #f1f5f9, #f1f5f9 3px, transparent 3px, transparent 6px);
    }

    .audit-step {
      display: flex;
      align-items: center;
      gap: 8px; /* 稍微拉开一点图标和文字的感官距离 */
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .step-dot {
        width: 10px;
        height: 10px;
        border: 2px solid #e2e8f0;
        border-radius: 50%;
        background: white;
        flex-shrink: 0;
      }
      .el-icon {
        font-size: 14px;
        color: #10b981;
        flex-shrink: 0;
        /* 关键：图标相对于文字基线微调，防止“视觉下沉” */
        transform: translateY(-0.5px);
      }

      &.is-active {
        color: #1e293b;
      }
    }
  }
}

.asset-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.asset-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  transition: 0.2s;
  &:hover {
    transform: translateY(-2px);
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .tile-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #e0e7ff;
    color: #6366f1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }
  .tile-body {
    display: flex;
    flex-direction: column;
    .tile-name {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
    }
    .tile-code {
      font-size: 11px;
      color: #94a3b8;
      font-family: "Fira Code", monospace;
    }
  }
}

.identity-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.timeline-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  .source-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #64748b;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    &.ldap {
      background: #3b82f6;
    }
    &.wechat {
      background: #10b981;
    }
  }
  .source-detail {
    display: flex;
    flex-direction: column;
    label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .mono-text {
      font-family: "Fira Code", monospace;
      font-size: 11px;
      color: #1e293b;
      font-weight: 600;
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.cursor-pointer {
  cursor: pointer;
}
</style>
