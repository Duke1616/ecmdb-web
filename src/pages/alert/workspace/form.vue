<template>
  <div class="workspace-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="workspace-form"
      label-position="top"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>
        </div>

        <div class="form-grid">
          <el-form-item prop="name" label="工作空间名称" class="form-item required">
            <el-input
              v-model="formData.name"
              placeholder="请输入工作空间名称"
              clearable
              class="premium-input"
              maxlength="50"
              show-word-limit
              size="large"
            />
          </el-form-item>

          <el-form-item prop="team_id" label="所属团队" class="form-item required">
            <TeamPicker v-model="formData.team_id" placeholder="请选择所属团队" variant="element" class="form-input" />
          </el-form-item>

          <el-form-item prop="channel" label="通知渠道" class="form-item required">
            <el-select
              v-model="formData.channel"
              placeholder="请选择通知渠道"
              class="premium-input"
              size="large"
              clearable
            >
              <el-option
                v-for="option in channelOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item prop="template_set_id" label="通知模板集" class="form-item required">
            <TemplateSetPicker
              v-model="formData.template_set_id"
              placeholder="请选择通知模板集"
              variant="element"
              class="form-input"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 空间配置 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Setting /></el-icon>
            <span>空间配置</span>
          </div>
        </div>

        <div class="config-cards">
          <!-- 公开设置卡片 -->
          <div class="config-card">
            <div class="config-header">
              <div class="config-icon public-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="config-title">
                <h4>公开设置</h4>
                <p>设置工作空间的可见性</p>
              </div>
            </div>
            <div class="config-options">
              <div class="option-item" :class="{ active: formData.is_public }" @click="formData.is_public = true">
                <div class="option-radio">
                  <el-radio :model-value="formData.is_public" :label="true">
                    <span style="display: none" />
                  </el-radio>
                </div>
                <div class="option-content">
                  <div class="option-title">公开工作空间</div>
                  <div class="option-desc">所有团队成员都可以查看和加入</div>
                </div>
                <div class="option-badge public-badge">公开</div>
              </div>
              <div class="option-item" :class="{ active: !formData.is_public }" @click="formData.is_public = false">
                <div class="option-radio">
                  <el-radio :model-value="formData.is_public" :label="false">
                    <span style="display: none" />
                  </el-radio>
                </div>
                <div class="option-content">
                  <div class="option-title">私有工作空间</div>
                  <div class="option-desc">仅邀请的成员可以访问</div>
                </div>
                <div class="option-badge private-badge">私有</div>
              </div>
            </div>
          </div>

          <!-- 邀请设置卡片 -->
          <div class="config-card">
            <div class="config-header">
              <div class="config-icon invite-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="config-title">
                <h4>邀请设置</h4>
                <p>控制谁可以邀请新成员</p>
              </div>
            </div>
            <div class="config-options">
              <div class="option-item" :class="{ active: formData.allow_invite }" @click="formData.allow_invite = true">
                <div class="option-radio">
                  <el-radio :model-value="formData.allow_invite" :label="true">
                    <span style="display: none" />
                  </el-radio>
                </div>
                <div class="option-content">
                  <div class="option-title">允许成员邀请</div>
                  <div class="option-desc">团队成员可以邀请其他人加入</div>
                </div>
                <div class="option-badge open-badge">开放</div>
              </div>
              <div
                class="option-item"
                :class="{ active: !formData.allow_invite }"
                @click="formData.allow_invite = false"
              >
                <div class="option-radio">
                  <el-radio :model-value="formData.allow_invite" :label="false">
                    <span style="display: none" />
                  </el-radio>
                </div>
                <div class="option-content">
                  <div class="option-title">仅管理员邀请</div>
                  <div class="option-desc">只有管理员可以邀请成员</div>
                </div>
                <div class="option-badge restricted-badge">受限</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { InfoFilled, Setting, Monitor, User } from "@element-plus/icons-vue"
import { createWorkspaceApi, updateWorkspaceApi } from "@/api/alert/workspace"
import { SaveWorkspaceReq } from "@/api/alert/workspace/types"
import { DEFAULT_CHANNEL_TYPE } from "@/api/alert/template/types"
import { getChannelOptions } from "../template/config/channels"
import { TeamPicker, TemplateSetPicker } from "@@/components/Pickers"

// 接收父组件传递
const emits = defineEmits(["closed", "callback"])

// 接收父组件传递的团队ID
const props = defineProps<{
  selectedTeamId?: number
}>()

const DEFAULT_FORM_DATA: SaveWorkspaceReq = {
  name: "",
  enabled: true,
  team_id: undefined as any,
  channel: DEFAULT_CHANNEL_TYPE,
  template_set_id: undefined as any,
  is_public: true,
  allow_invite: true
}

const formData = ref<SaveWorkspaceReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const channelOptions = getChannelOptions()

const formRules: FormRules = {
  team_id: [{ required: true, message: "请选择所属团队", trigger: "change" }],
  channel: [{ required: true, message: "请选择通知渠道", trigger: "change" }],
  template_set_id: [{ required: true, message: "请选择通知模板集", trigger: "change" }],
  name: [
    { required: true, message: "请输入工作空间名称", trigger: "blur" },
    { min: 2, max: 50, message: "工作空间名称长度为 2-50 个字符", trigger: "blur" }
  ]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    if (!formData.value.team_id || formData.value.team_id === 0) {
      ElMessage.error("请选择所属团队")
      return
    }
    if (!formData.value.channel) {
      ElMessage.error("请选择通知渠道")
      return
    }
    if (!formData.value.template_set_id || formData.value.template_set_id === 0) {
      ElMessage.error("请选择通知模板集")
      return
    }

    const apiCall = formData.value.id ? updateWorkspaceApi(formData.value) : createWorkspaceApi(formData.value)
    apiCall
      .then(() => {
        onClosed()
        ElMessage.success("工作空间保存成功")
        emits("callback")
      })
      .catch((error: any) => {
        console.log("catch", error)
      })
  })
}

const setForm = (row: any) => {
  formData.value = {
    ...cloneDeep(DEFAULT_FORM_DATA),
    ...row
  }
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  // 如果有传入的团队ID，设置为默认值
  if (props.selectedTeamId) {
    formData.value.team_id = props.selectedTeamId
  }
  // 清空表单验证状态
  formRef.value?.clearValidate()
}

const onClosed = () => {
  emits("closed")
}

// 组件挂载时加载数据
onMounted(() => {
  // 如果有传入的团队ID，设置为默认值
  if (props.selectedTeamId) {
    formData.value.team_id = props.selectedTeamId
  }
})

defineExpose({
  submitForm,
  setForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.workspace-form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
}

.workspace-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    border-radius: 6px;

    .title-left {
      display: flex;
      align-items: center;
    }

    .section-icon {
      margin-right: 6px;
      color: #3b82f6;
      font-size: 16px;
    }

    span {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 20px;
  }

  .form-item {
    margin-bottom: 0;

    &:last-child {
      margin-bottom: 0;
    }

    &.required {
      :deep(.el-form-item__label) {
        &::before {
          content: "*";
          color: #ef4444;
          margin-right: 4px;
        }
      }
    }
  }

  .form-input {
    width: 100%;

    :deep(.picker-input-box) {
      min-height: 40px;
      padding: 0 12px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
      }
    }
  }

  .premium-input {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      min-height: 40px;
      padding: 0 12px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
      }
    }
  }

  // 配置卡片样式
  .config-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    .config-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 20px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .config-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f3f4f6;

        .config-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          font-size: 18px;

          &.public-icon {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #ffffff;
          }

          &.invite-icon {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #ffffff;
          }
        }

        .config-title {
          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }

          p {
            margin: 0;
            font-size: 12px;
            color: #6b7280;
          }
        }
      }

      .config-options {
        display: flex;
        flex-direction: column;
        gap: 8px;

          .option-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;

          &:hover {
            border-color: #3b82f6;
            background: #f8fafc;
          }

          &.active {
            border-color: #3b82f6;
            background: #eff6ff;
            box-shadow: 0 0 0 1px #3b82f6;

            .option-badge {
              opacity: 1;
              transform: scale(1);
            }
          }

          .option-radio {
            flex-shrink: 0;

            :deep(.el-radio) {
              margin: 0;
            }
          }

          .option-content {
            flex: 1;

            .option-title {
              font-size: 14px;
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 2px;
            }

            .option-desc {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            }
          }

          .option-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.7;
            transform: scale(0.9);
            transition: all 0.2s ease;

            &.public-badge {
              background: #dbeafe;
              color: #1e40af;
            }

            &.private-badge {
              background: #fef3c7;
              color: #92400e;
            }

            &.open-badge {
              background: #d1fae5;
              color: #065f46;
            }

            &.restricted-badge {
              background: #fee2e2;
              color: #991b1b;
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .workspace-form-container {
    padding: 16px;
  }

  .workspace-form {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .section-title {
      font-size: 14px;
    }

    .config-cards {
      grid-template-columns: 1fr;
      gap: 16px;

      .config-card {
        padding: 16px;
      }
    }
  }
}
</style>
