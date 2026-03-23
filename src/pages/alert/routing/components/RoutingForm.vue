<template>
  <div class="routing-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="routing-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="规则名称" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="description" label="规则描述" class="form-item">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述（可选）" />
          </el-form-item>
        </div>
      </div>

      <!-- 路由配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Share /></el-icon>
          <span>路由配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="scope" label="作用域" class="form-item">
            <div class="choice-cards">
              <div
                class="choice-card"
                :class="{ active: formData.scope === RoutingScope.Global, disabled: isEdit }"
                @click="!isEdit && (formData.scope = RoutingScope.Global)"
              >
                <div class="card-icon">🌐</div>
                <div class="card-content">
                  <div class="card-title">全局生效</div>
                  <div class="card-desc">对所有告警生效</div>
                </div>
                <div class="card-check">
                  <svg
                    v-if="formData.scope === RoutingScope.Global"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div
                class="choice-card"
                :class="{ active: formData.scope === RoutingScope.Rule, disabled: isEdit }"
                @click="!isEdit && (formData.scope = RoutingScope.Rule)"
              >
                <div class="card-icon">📋</div>
                <div class="card-content">
                  <div class="card-title">规则生效</div>
                  <div class="card-desc">仅对指定规则生效</div>
                </div>
                <div class="card-check">
                  <svg
                    v-if="formData.scope === RoutingScope.Rule"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>

        <div class="form-row" v-if="formData.scope === RoutingScope.Rule">
          <el-form-item prop="rule_id" label="关联告警规则" class="form-item">
            <RuleSelector v-model="formData.rule_id" placeholder="请选择告警规则" variant="simple" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="workspace_id" label="目标工作空间" class="form-item">
            <el-select v-model="formData.workspace_id" placeholder="请选择目标工作空间" style="width: 100%">
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 匹配条件 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>匹配条件</span>
        </div>

        <div class="form-row">
          <el-form-item prop="matchers" label="标签匹配器" class="form-item">
            <div class="matcher-config">
              <div v-for="(matcher, index) in formData.matchers" :key="index" class="matcher-item">
                <el-input v-model="matcher.name" placeholder="标签名" size="default" />
                <el-select v-model="matcher.type" placeholder="类型" size="default">
                  <el-option
                    v-for="option in matchTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-model="matcher.value"
                  placeholder="标签值"
                  size="default"
                  :disabled="!isValueRequired(matcher.type)"
                />
                <el-button type="text" @click="removeMatcher(index)" class="matcher-remove"> 删除 </el-button>
              </div>
              <el-button type="text" @click="addMatcher" class="add-matcher-btn">
                <el-icon><Plus /></el-icon>
                添加标签匹配器
              </el-button>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="levels" label="告警级别" class="form-item">
            <el-select v-model="formData.levels" multiple placeholder="请选择告警级别" style="width: 100%">
              <el-option label="P0-紧急" :value="1" />
              <el-option label="P1-严重" :value="2" />
              <el-option label="P2-错误" :value="3" />
              <el-option label="P3-警告" :value="4" />
              <el-option label="P4-提示" :value="5" />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { Setting, Share, Filter, Plus } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { SaveRoutingRuleReq } from "@/api/alert/routing/types"
import { RoutingScope } from "@/api/alert/routing/types"
import type { Workspace } from "@/api/alert/workspace/types"
import { listWorkspacesApi } from "@/api/alert/workspace"
import { useRoutingForm } from "../composables/useRoutingForm"
import { clearZeroValues } from "@@/utils"
import { RuleSelector } from "@@/components/SearchSelector"
import { useMatcher } from "@@/composables/useMatcher"

// Props
const props = withDefaults(
  defineProps<{
    formRules?: any
    isEdit?: boolean
  }>(),
  {
    isEdit: false
  }
)

// 使用 defineModel 简化双向绑定
const formData = defineModel<SaveRoutingRuleReq>("formData", { required: true })

// 使用 form composable 获取默认表单验证规则
const { formRules: defaultFormRules } = useRoutingForm()

// 使用传入的 formRules 或默认的
const formRules = props.formRules || defaultFormRules

const formRef = ref<FormInstance>()

// 工作空间列表
const workspaces = ref<Workspace[]>([])

// 加载工作空间列表
const loadWorkspaces = async () => {
  try {
    const response = await listWorkspacesApi({ offset: 0, limit: 0 })
    workspaces.value = response.data.workspaces
  } catch (error) {
    console.error("加载工作空间列表失败:", error)
  }
}

// 使用匹配器工具函数
const { getMatchTypeOptions, isValueRequired, createEmptyMatcher } = useMatcher()
const matchTypeOptions = computed(() => getMatchTypeOptions())

// 添加匹配器
const addMatcher = () => {
  formData.value.matchers.push(createEmptyMatcher())
}

// 删除匹配器
const removeMatcher = (index: number) => {
  formData.value.matchers.splice(index, 1)
}

// 组件挂载时的初始化
onMounted(async () => {
  await loadWorkspaces()
})

// 获取清理后的表单数据
const getCleanedFormData = () => {
  return clearZeroValues(formData.value)
}

// 暴露 formRef 和清理函数给父组件
defineExpose({
  formRef,
  getCleanedFormData
})
</script>

<style lang="scss" scoped>
.routing-form-container {
  padding: 20px;
}

.routing-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    &.form-row-inline {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    &.form-item-flex {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .switch-container {
    display: flex;
    align-items: center;
    gap: 8px;

    .form-tip {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #6b7280;
    margin-top: 6px;
  }

  // 选择卡片样式
  .choice-cards {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .choice-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.6;
      background: #f3f4f6;

      &:hover {
        border-color: #e2e8f0;
        background: #f3f4f6;
      }
    }

    &.active {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);

      .card-icon {
        transform: scale(1.05);
      }

      .card-title {
        color: #3b82f6;
        font-weight: 600;
      }
    }

    .card-icon {
      font-size: 18px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .card-content {
      flex: 1;
      min-width: 0;

      .card-title {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
        transition: color 0.2s ease;
      }

      .card-desc {
        font-size: 11px;
        color: #64748b;
        line-height: 1.3;
      }
    }

    .card-check {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
      transition: all 0.2s ease;
      flex-shrink: 0;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  .matcher-config {
    width: 100%;

    .matcher-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 6px;
      width: 100%;

      &:last-child {
        margin-bottom: 0;
      }

      .el-input {
        &:first-child {
          flex: 0 0 140px;
          min-width: 140px;
        }

        &:last-child {
          flex: 1;
          min-width: 150px;
        }
      }

      .el-select {
        flex: 0 0 100px;
        min-width: 100px;
      }

      .matcher-remove {
        flex: 0 0 auto;
        margin-left: auto;
        color: #ef4444;

        &:hover {
          color: #dc2626;
        }
      }
    }

    .add-matcher-btn {
      width: 100%;
      margin-top: 8px;
      color: #3b82f6;
      border: 1px dashed #3b82f6;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &:hover {
        color: #1d4ed8;
        background: #dbeafe;
      }
    }
  }
}
</style>
