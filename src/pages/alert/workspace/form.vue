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
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>

        <el-form-item prop="team_id" label="所属团队" class="form-item required">
          <el-select 
            v-model="formData.team_id" 
            placeholder="请选择所属团队" 
            class="form-input"
            filterable
            clearable
          >
            <el-option 
              v-for="team in teams" 
              :key="team.id" 
              :label="team.name" 
              :value="team.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item prop="name" label="工作空间名称" class="form-item required">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入工作空间名称" 
            clearable 
            class="form-input"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

      </div>

      <!-- 空间配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>空间配置</span>
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
              <div 
                class="option-item" 
                :class="{ active: formData.is_public }"
                @click="formData.is_public = true"
              >
                <div class="option-radio">
                  <el-radio :model-value="formData.is_public" :label="true">
                    <span style="display: none;"></span>
                  </el-radio>
                </div>
                <div class="option-content">
                  <div class="option-title">公开工作空间</div>
                  <div class="option-desc">所有团队成员都可以查看和加入</div>
                </div>
                <div class="option-badge public-badge">公开</div>
              </div>
              <div 
                class="option-item" 
                :class="{ active: !formData.is_public }"
                @click="formData.is_public = false"
              >
                <div class="option-radio">
                  <el-radio :model-value="formData.is_public" :label="false">
                    <span style="display: none;"></span>
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
                    <span style="display: none;"></span>
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
                    <span style="display: none;"></span>
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
import { 
  InfoFilled, 
  Setting,
  Monitor,
  User
} from "@element-plus/icons-vue"
import { saveWorkspaceApi } from "@/api/workspace"
import { SaveWorkspaceReq } from "@/api/workspace/types"
import { listTeamsApi } from "@/api/team"
import { Team as TeamType } from "@/api/team/types"

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
  is_public: true,
  allow_invite: true
}

const formData = ref<SaveWorkspaceReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const teams = ref<TeamType[]>([])

const formRules: FormRules = {
  team_id: [{ required: true, message: "请选择所属团队", trigger: "change" }],
  name: [
    { required: true, message: "请输入工作空间名称", trigger: "blur" },
    { min: 2, max: 50, message: "工作空间名称长度为 2-50 个字符", trigger: "blur" }
  ]
}

// 生成团队头像颜色
const generateTeamColor = (name: string) => {
  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe",
    "#43e97b", "#38f9d7", "#fa709a", "#fee140", "#a8edea", "#fed6e3"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 加载团队数据
const loadTeamsData = async () => {
  try {
    const { data } = await listTeamsApi({
      offset: 0,
      limit: 100
    })
    teams.value = data.teams || []
  } catch (error) {
    console.error("加载团队数据失败:", error)
    teams.value = []
  }
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    if (!formData.value.team_id || formData.value.team_id === 0) {
      ElMessage.error("请选择所属团队")
      return
    }

    saveWorkspaceApi(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("工作空间保存成功")
        emits("callback")
      })
      .catch((error: any) => {
        console.log("catch", error)
        ElMessage.error("工作空间保存失败")
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
  loadTeamsData()
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
  padding: 24px;
  background: #ffffff;
  border-radius: 8px;
}

.workspace-form {
  .form-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f2f5;
    color: #1f2937;
    font-size: 16px;
    font-weight: 600;

    .el-icon {
      color: #3b82f6;
      font-size: 18px;
    }
  }

  .form-item {
    margin-bottom: 20px;

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
