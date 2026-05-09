<template>
  <div class="eiam-simple-form">
    <el-scrollbar class="form-scrollbar">
      <div class="form-content">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="governance-form">
          <!-- 核心标识区 -->
          <div class="governance-section is-first-section">
            <div class="section-header">
              <div class="header-title">
                <el-icon><User /></el-icon>
                <span>主体身份标识</span>
              </div>
            </div>

            <div class="field-panel">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="凭证标识" prop="username">
                    <el-input
                      v-model="formData.username"
                      :disabled="isEdit"
                      class="gov-input mono"
                      placeholder="唯一登录名，创建后不可更改"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="显示名称" prop="nickname">
                    <el-input v-model="formData.nickname" class="gov-input" placeholder="用于展示的昵称或姓名" />
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
                    <el-input v-model="formData.job_title" class="gov-input" placeholder="例如：高级架构师" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 编辑模式下增加状态控制 -->
              <el-row v-if="isEdit" :gutter="24">
                <el-col :span="24">
                  <div class="status-panel-card">
                    <div class="panel-left">
                      <span class="panel-label">账号状态</span>
                      <el-tooltip
                        :content="formData.status === 'active' ? '用户可以正常登录系统' : '用户将被禁止登录'"
                        placement="top"
                      >
                        <el-icon class="panel-icon"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                    <div class="panel-right">
                      <el-switch
                        v-model="formData.status"
                        active-value="active"
                        inactive-value="disable"
                        inline-prompt
                        active-text="正常"
                        inactive-text="禁用"
                        class="gov-switch"
                      />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 访问口令初始化 (仅限新增) -->
          <div v-if="!isEdit" class="governance-section">
            <div class="section-header">
              <div class="header-title">
                <el-icon><Lock /></el-icon>
                <span>访问口令初始化</span>
              </div>
              <div class="header-tag" :style="{ color: strengthColor }">
                安全等级：{{ passwordStrength < 50 ? "弱" : "强" }}
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
                    placeholder="请设置 8 位以上复杂密码"
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
                    placeholder="重复输入确认密码"
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
                  <span>含符号</span>
                </div>
              </div>
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
import { Lock, SuccessFilled, User, QuestionFilled } from "@element-plus/icons-vue"
import { signupApi, updateUserApi, userDetailApi } from "@/api/iam/user"

const props = defineProps<{
  isEdit: boolean
  userId?: number
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

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

const loadUserDetail = async () => {
  if (!props.userId) return
  const { data } = await userDetailApi({ id: props.userId })
  const user = data.user ? data.user : data
  Object.assign(formData, user)
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (props.isEdit) {
    const { username, nickname, email, job_title, avatar, status } = formData
    await updateUserApi({ id: Number(props.userId), username, nickname, email, job_title, avatar, status })
  } else {
    await signupApi({ ...formData })
  }
  emit("success")
}

onMounted(() => {
  if (props.isEdit) loadUserDetail()
})

const formRules = reactive<FormRules>({
  username: [{ required: true, message: "请输入主体标识", trigger: "blur" }],
  email: [
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: "blur"
    }
  ],
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
.eiam-simple-form {
  background: white;
  overflow: hidden;
}

.form-scrollbar {
  max-height: 60vh;
  overflow-x: hidden;
}

.form-content {
  padding: 4px 12px 20px;
}

.governance-section {
  position: relative;
  margin-top: 24px;

  &.is-first-section {
    margin-top: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;

    .header-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
      .el-icon {
        color: #3b82f6;
      }
    }
    .header-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }
}

.gov-input {
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    height: 38px;
    border-radius: 8px;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
    }
  }
  &.mono :deep(.el-input__inner) {
    font-family: ui-monospace, monospace;
    font-size: 13px;
  }
}

.status-panel-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  .panel-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .panel-label {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .panel-icon {
      font-size: 14px;
      color: #94a3b8;
      cursor: help;
      &:hover {
        color: #64748b;
      }
    }
  }
}

.gov-switch {
  --el-switch-on-color: #10b981;
  --el-switch-off-color: #e2e8f0;
  height: 28px;

  :deep(.el-switch__core) {
    border-radius: 14px;
    border: none;
    .el-switch__inner {
      font-weight: 700;
      font-size: 11px;
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
    .step-connector {
      flex: 1;
      height: 1px;
      margin: 0 12px;
      background: repeating-linear-gradient(90deg, #e2e8f0, #e2e8f0 2px, transparent 2px, transparent 4px);
    }
    .audit-step {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      .step-dot {
        width: 8px;
        height: 8px;
        border: 2px solid #e2e8f0;
        border-radius: 50%;
      }
      .el-icon {
        font-size: 14px;
        color: #10b981;
      }
      &.is-active {
        color: #1e293b;
      }
    }
  }
}
</style>
