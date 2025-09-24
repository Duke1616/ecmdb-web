<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="工作空间设置" subtitle="配置工作空间的基本信息、权限和状态" @refresh="loadWorkspace">
      <template #actions>
        <el-button type="primary" @click="handleSaveSettings" :loading="saving" size="large" class="save-button">
          <el-icon v-if="!saving"><Check /></el-icon>
          {{ saving ? "保存中..." : "保存设置" }}
        </el-button>
      </template>
    </ManagerHeader>

    <!-- 设置表单 -->
    <div class="content-card" v-loading="loading">
      <div class="card-body">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top" class="settings-form">
          <div class="form-section">
            <h4 class="section-title">基本信息</h4>
            <el-row :gutter="20">
              <!-- 工作空间名称 -->
              <el-col :span="12">
                <el-form-item label="工作空间名称" prop="name">
                  <el-input v-model="formData.name" placeholder="请输入工作空间名称" size="large" />
                </el-form-item>
              </el-col>

              <!-- 工作空间状态 -->
              <el-col :span="12">
                <el-form-item label="工作空间状态">
                  <el-switch
                    v-model="formData.enabled"
                    size="large"
                    active-text="启用"
                    inactive-text="禁用"
                    active-color="#10b981"
                    inactive-color="#ef4444"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <!-- 绑定团队 -->
              <el-col :span="12">
                <el-form-item label="绑定团队">
                  <div class="team-info clickable" @click="handleEditTeam">
                    <div class="team-avatar">
                      <el-icon><User /></el-icon>
                    </div>
                    <div class="team-details">
                      <div class="team-name">{{ teamName }}</div>
                      <div class="team-desc">当前工作空间所属团队</div>
                    </div>
                    <div class="team-status">
                      <el-tag type="success" effect="plain">已绑定</el-tag>
                    </div>
                    <div class="edit-icon">
                      <el-icon><Edit /></el-icon>
                    </div>
                  </div>
                </el-form-item>
              </el-col>

              <!-- 绑定消息通知模版 -->
              <el-col :span="12">
                <el-form-item label="消息通知模版">
                  <div class="template-info clickable" @click="handleEditTemplate">
                    <div class="template-avatar">
                      <el-icon><Message /></el-icon>
                    </div>
                    <div class="template-details">
                      <div class="template-name">{{ templateName }}</div>
                      <div class="template-desc">消息通知模版配置</div>
                    </div>
                    <div class="template-status">
                      <el-tag type="info" effect="plain">已配置</el-tag>
                    </div>
                    <div class="edit-icon">
                      <el-icon><Edit /></el-icon>
                    </div>
                  </div>
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
                  <div
                    class="option-item"
                    :class="{ active: formData.allow_invite }"
                    @click="formData.allow_invite = true"
                  >
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
    </div>

    <!-- 团队选择抽屉 -->
    <TeamSelector v-model="teamDialogVisible" :current-team-id="formData.team_id" @confirm="handleTeamConfirm" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from "vue"
import { ElMessage } from "element-plus"
import { Check, Monitor, User } from "@element-plus/icons-vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import TeamSelector from "./TeamSelector.vue"
import { getWorkspaceDetailApi, saveWorkspaceApi } from "@/api/alert/workspace"
import type { Workspace, SaveWorkspaceReq } from "@/api/alert/workspace/types"

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
const formRef = ref()

// 团队和模版信息
const teamName = ref<string>("")
const templateName = ref<string>("")

// 团队选择相关
const teamDialogVisible = ref(false)

// 表单数据
const formData = reactive<SaveWorkspaceReq>({
  id: 0,
  name: "",
  is_public: false,
  allow_invite: false,
  enabled: true,
  team_id: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: "请输入工作空间名称", trigger: "blur" },
    { min: 2, max: 50, message: "名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
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
      team_id: workspace.value.team.id
    })

    // 更新团队和模版信息
    teamName.value = workspace.value.team?.name || "未知团队"
    templateName.value = workspace.value.template?.name || "默认模版"
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
    await saveWorkspaceApi(formData)

    ElMessage.success("设置保存成功")

    // 重新加载数据
    await loadWorkspace()

    // 通知父组件刷新
    emit("refresh")
  } catch (error) {
    console.error("保存设置失败:", error)
    ElMessage.error("保存设置失败")
  } finally {
    saving.value = false
  }
}

// 编辑团队
const handleEditTeam = () => {
  teamDialogVisible.value = true
}

// 编辑模版
const handleEditTemplate = () => {
  ElMessage.info("编辑模版功能待实现")
  // TODO: 实现模版选择功能
}

// 处理团队选择确认
const handleTeamConfirm = async (teamId: number, selectedTeamName: string) => {
  try {
    // 更新表单数据
    formData.team_id = teamId
    teamName.value = selectedTeamName

    // 保存设置
    await saveWorkspaceApi(formData)

    ElMessage.success("团队修改成功")

    // 通知父组件刷新
    emit("refresh")
  } catch (error) {
    console.error("修改团队失败:", error)
    ElMessage.error("修改团队失败")
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
</script>

<style lang="scss" scoped>
// 覆盖 PageContainer 样式
.page-container {
  padding: 0px !important;
  background: transparent !important;
  width: 100%;
  height: 100%;
}

/* 内容卡片 - 参考 DataTable 设计 */
.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto; // 滚动条在边框内侧，贴边显示
  overflow-x: hidden;
  padding: 0; // 去掉内边距，滚动条贴边框
  box-sizing: border-box;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
    margin: 4px; // 滚动槽上下预留间距
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
}

.card-body {
  padding: 20px; // 将内容内边距下放到内部，保证滚动条贴边框
  box-sizing: border-box;
}

.settings-form {
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  min-height: 100%;

  .form-section {
    margin-bottom: 24px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;

    .section-title {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: "";
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 2px;
        flex-shrink: 0;
      }

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 16px;
        right: 16px;
        height: 1px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 1px;
        opacity: 0.3;
      }
    }

    .el-form-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      background: #ffffff;
      border: none;
      border-radius: 8px;
      box-sizing: border-box;

      &:last-child {
        margin-bottom: 0;
      }

      .el-form-item__label {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
        margin-bottom: 12px;
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

      // 团队信息样式
      .team-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        height: 100%;
        width: 100%;
        position: relative;
        box-sizing: border-box;

        &.clickable {
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            background: #f0f9ff;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          }
        }

        .team-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 10px;
          color: #ffffff;
          font-size: 20px;
          flex-shrink: 0;
        }

        .team-details {
          flex: 1;

          .team-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }

          .team-desc {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
          }
        }

        .team-status {
          flex-shrink: 0;
        }

        .edit-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          color: #6b7280;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        &.clickable:hover .edit-icon {
          opacity: 1;
        }
      }

      // 状态配置样式
      .status-config {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        height: 100%;

        .status-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;

          .status-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            font-size: 18px;
            flex-shrink: 0;

            .el-icon {
              color: #10b981;
            }
          }

          .status-details {
            flex: 1;

            .status-title {
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 2px;
            }

            .status-desc {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            }
          }
        }

        .el-switch {
          flex-shrink: 0;
        }
      }

      // 消息通知模版样式
      .template-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        height: 100%;
        width: 100%;
        position: relative;
        box-sizing: border-box;

        &.clickable {
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #8b5cf6;
            background: #faf5ff;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
          }
        }

        .template-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 10px;
          color: #ffffff;
          font-size: 20px;
          flex-shrink: 0;
        }

        .template-details {
          flex: 1;

          .template-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }

          .template-desc {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
          }
        }

        .template-status {
          flex-shrink: 0;
        }

        .edit-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          color: #6b7280;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        &.clickable:hover .edit-icon {
          opacity: 1;
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

// 保存按钮样式
.save-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  .el-icon {
    margin-right: 6px;
  }
}
</style>
