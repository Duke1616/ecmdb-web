<template>
  <WorkspaceSectionPage
    title="空间配置"
    subtitle="配置工作空间的基本信息、权限和状态"
    :primary-action="saveAction"
    :secondary-action="toggleAction"
    @primary-action="handleSaveSettings"
    @secondary-action="handleToggleStatus"
  >
    <!-- 设置表单 -->
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="settings-form"
    >
      <div class="form-section">
        <h4 class="section-title">基本信息</h4>
        <el-row :gutter="20">
          <!-- 工作空间名称 -->
          <el-col :span="12">
            <el-form-item label="工作空间名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入工作空间名称" size="large" class="settings-control" />
            </el-form-item>
          </el-col>

          <!-- 绑定团队 -->
          <el-col :span="12">
            <el-form-item label="绑定团队" prop="team_id">
              <TeamPicker
                v-model="formData.team_id"
                placeholder="请选择绑定团队"
                variant="element"
                class="settings-control"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 默认通知渠道 -->
          <el-col :span="12">
            <el-form-item label="默认通知渠道" prop="channel">
              <el-select
                v-model="formData.channel"
                placeholder="请选择默认通知渠道"
                size="large"
                clearable
                class="settings-control"
              >
                <el-option
                  v-for="option in channelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 默认通知模板集 -->
          <el-col :span="12">
            <el-form-item label="默认通知模板集" prop="template_set_id">
              <TemplateSetPicker
                v-model="formData.template_set_id"
                placeholder="请选择默认通知模板集"
                variant="element"
                class="settings-control"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <h4 class="section-title">权限设置</h4>
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
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from "vue"
import { ElMessage } from "element-plus"
import { Check, Monitor, SwitchButton, User } from "@element-plus/icons-vue"
import { getWorkspaceDetailApi, toggleWorkspaceStatusApi, updateWorkspaceApi } from "@/api/alert/workspace"
import { DEFAULT_CHANNEL_TYPE } from "@/api/alert/template/types"
import type { Workspace, SaveWorkspaceReq } from "@/api/alert/workspace/types"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { TeamPicker, TemplateSetPicker } from "@@/components/Pickers"
import { getChannelOptions } from "../../../template/config/channels"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"

const props = defineProps<{
  workspaceId: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

// 数据
const workspace = ref<Workspace | null>(null)
const loading = ref(false)
const saving = ref(false)
const toggling = ref(false)
const formRef = ref()
const saveAction = computed(() => ({
  label: saving.value ? "保存中..." : "保存配置",
  icon: saving.value ? undefined : Check,
  capability: ALERT_CAPABILITIES.Workspace.Edit,
  loading: saving.value
}))
const toggleAction = computed(() => ({
  label: formData.enabled ? "停用空间" : "启用空间",
  icon: SwitchButton,
  type: formData.enabled ? ("warning" as const) : ("success" as const),
  capability: ALERT_CAPABILITIES.Workspace.Toggle,
  loading: toggling.value,
  disabled: !formData.id
}))

// 表单数据
const formData = reactive<SaveWorkspaceReq>({
  id: 0,
  name: "",
  is_public: false,
  allow_invite: false,
  enabled: true,
  team_id: 0,
  channel: DEFAULT_CHANNEL_TYPE,
  template_set_id: 0
})

const channelOptions = getChannelOptions()

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: "请输入工作空间名称", trigger: "blur" },
    { min: 2, max: 50, message: "名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  team_id: [{ required: true, message: "请选择绑定团队", trigger: "change" }],
  channel: [{ required: true, message: "请选择默认通知渠道", trigger: "change" }],
  template_set_id: [{ required: true, message: "请选择默认通知模板集", trigger: "change" }],
  is_public: [{ required: true, message: "请选择公开设置", trigger: "change" }],
  allow_invite: [{ required: true, message: "请选择邀请设置", trigger: "change" }]
}

// 加载工作空间信息
const loadWorkspace = async () => {
  if (!props.workspaceId) return

  loading.value = true
  try {
    const response = await getWorkspaceDetailApi(props.workspaceId)
    workspace.value = response.data

    // 更新表单数据
    Object.assign(formData, {
      id: workspace.value.id,
      name: workspace.value.name,
      is_public: workspace.value.is_public,
      allow_invite: workspace.value.allow_invite,
      enabled: workspace.value.enabled,
      team_id: workspace.value.team_id,
      channel: workspace.value.channel || DEFAULT_CHANNEL_TYPE,
      template_set_id: workspace.value.template_set_id || 0
    })
  } catch (error) {
    console.error("加载工作空间信息失败:", error)
    ElMessage.error("加载工作空间信息失败")
  } finally {
    loading.value = false
  }
}

// 保存设置
const handleSaveSettings = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    saving.value = true
    await updateWorkspaceApi({
      id: formData.id,
      name: formData.name,
      team_id: formData.team_id,
      channel: formData.channel,
      template_set_id: formData.template_set_id,
      is_public: formData.is_public,
      allow_invite: formData.allow_invite
    })

    ElMessage.success("设置保存成功")

    // 重新加载数据
    await loadWorkspace()

    // 通知父组件刷新
    emit("refresh")
  } catch (error) {
    console.error("保存设置失败:", error)
  } finally {
    saving.value = false
  }
}

const handleToggleStatus = async () => {
  if (!formData.id) return
  try {
    toggling.value = true
    await toggleWorkspaceStatusApi(formData.id)
    ElMessage.success(formData.enabled ? "工作空间已停用" : "工作空间已启用")
    await loadWorkspace()

    emit("refresh")
  } catch (error) {
    console.error("切换工作空间状态失败:", error)
    ElMessage.error("切换工作空间状态失败")
  } finally {
    toggling.value = false
  }
}

// 监听工作空间ID变化
watch(
  () => props.workspaceId,
  () => {
    if (props.workspaceId) {
      loadWorkspace()
    }
  },
  { immediate: true }
)

defineExpose({
  loadData: loadWorkspace,
  loadWorkspace
})
</script>

<style lang="scss" scoped>
.settings-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
    margin: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    transition: background 0.2s ease;

    &:hover {
      background: #94a3b8;
    }
  }

  &::-webkit-scrollbar-thumb:active {
    background: #64748b;
  }

  .form-section {
    margin-bottom: 24px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 14px 0;
      padding: 8px 12px;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
    }

    .el-form-item {
      margin-bottom: 18px;
      padding-bottom: 0;
      background: #ffffff;
      border: none;
      box-sizing: border-box;

      &:last-child {
        margin-bottom: 0;
      }

      :deep(.el-form-item__label) {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
        margin-bottom: 8px;
        line-height: 1.4;
      }

      .el-input,
      .el-textarea,
      .el-radio-group,
      .el-switch {
        margin-top: 0;
      }

      .el-radio {
        margin-right: 24px;
        font-weight: 500;

        .el-radio__label {
          color: #4b5563;
        }

        &.is-checked .el-radio__label {
          color: #3b82f6;
          font-weight: 600;
        }
      }

      .el-switch {
        .el-switch__label {
          font-weight: 500;
          color: #4b5563;
        }
      }

    }

    .settings-control {
      width: 100%;

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper),
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

    .form-tip {
      font-size: 13px;
      color: #6b7280;
      margin-top: 8px;
      line-height: 1.5;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }

    // 配置卡片样式
    .config-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      .config-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;

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
            border-radius: 8px;
            font-size: 18px;
            color: #ffffff;

            &.public-icon {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            }

            &.invite-icon {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
              font-size: 13px;
              color: #6b7280;
              line-height: 1.4;
            }
          }
        }

        .config-options {
          .option-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }

            &.active {
              border-color: #3b82f6;
              background: #eff6ff;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);

              .option-badge {
                opacity: 1;
                transform: scale(1);
              }
            }

            .option-radio {
              flex-shrink: 0;
            }

            .option-content {
              flex: 1;

              .option-title {
                font-size: 14px;
                font-weight: 600;
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
              flex-shrink: 0;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              opacity: 0.7;
              transform: scale(0.95);
              transition: all 0.2s ease;

              &.public-badge {
                background: #dbeafe;
                color: #1d4ed8;
              }

              &.private-badge {
                background: #fef3c7;
                color: #d97706;
              }

              &.open-badge {
                background: #d1fae5;
                color: #059669;
              }

              &.restricted-badge {
                background: #fee2e2;
                color: #dc2626;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .settings-form {
    .form-section {
      .config-cards {
        grid-template-columns: 1fr;
        gap: 16px;

        .config-card {
          padding: 16px;
        }
      }

      // 工作空间信息在小屏幕上垂直排列
      .el-row {
        .el-col {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      // 团队与模版在小屏幕上垂直排列
      .el-row {
        .el-col {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}
</style>
