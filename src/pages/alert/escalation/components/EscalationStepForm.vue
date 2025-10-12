<template>
  <div class="step-form-container">
    <el-form
      ref="formRef"
      label-position="top"
      :model="modelValue"
      :rules="formRules"
      label-width="auto"
      class="step-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="template_set_id" label="模板集" class="form-item">
            <el-select v-model="modelValue.template_set_id" placeholder="请选择模板集" size="large" clearable>
              <el-option
                v-for="templateSet in templateSets"
                :key="templateSet.id"
                :label="templateSet.name"
                :value="templateSet.id"
              >
                <span>{{ templateSet.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ templateSet.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="step_template_id" label="步骤模板" class="form-item">
            <el-select v-model="modelValue.step_template_id" placeholder="请选择步骤模板" size="large" clearable>
              <el-option
                v-for="template in stepTemplates"
                :key="template.id"
                :label="template.name"
                :value="template.id"
              >
                <span>{{ template.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ template.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 时间配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>时间配置</span>
        </div>

        <div class="form-row">
          <el-col :span="8">
            <el-form-item prop="delay" label="延迟时间（毫秒）" class="form-item">
              <el-input-number v-model="modelValue.delay" :min="0" size="large" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="max_retries" label="最大重试次数" class="form-item">
              <el-input-number v-model="modelValue.max_retries" :min="0" :max="10" size="large" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="retry_interval" label="重试间隔（毫秒）" class="form-item">
              <el-input-number v-model="modelValue.retry_interval" :min="1000" size="large" style="width: 100%" />
            </el-form-item>
          </el-col>
        </div>
      </div>

      <!-- 行为配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Operation /></el-icon>
          <span>行为配置</span>
        </div>

        <div class="form-row">
          <el-col :span="8">
            <el-form-item prop="urgency_level" label="紧急程度" class="form-item">
              <el-input-number v-model="modelValue.urgency_level" :min="1" :max="5" size="large" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="skip_if_handled" label="跳过已处理" class="form-item">
              <el-switch v-model="modelValue.skip_if_handled" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="continue_on_fail" label="失败继续" class="form-item">
              <el-switch v-model="modelValue.continue_on_fail" size="large" />
            </el-form-item>
          </el-col>
        </div>
      </div>

      <!-- 条件配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>条件配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="condition_expr" label="条件表达式" class="form-item">
            <el-input
              v-model="modelValue.condition_expr"
              type="textarea"
              :rows="3"
              placeholder="如: alert.severity >= 3"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Setting, Clock, Operation, Filter } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { CreateStepReq } from "@/api/alert/escalation/types"
import { listTemplateSetsApi } from "@/api/alert/template_set"
import { listStepTemplatesApi, listStepTemplatesByIDsApi } from "@/api/alert/escalation"
import type { TemplateSet } from "@/api/alert/template_set/types"
import type { StepTemplateVO } from "@/api/alert/escalation/types"
import { escalationStepFormRules } from "../config/validation"

const modelValue = defineModel<CreateStepReq>({ required: true })

const formRef = ref<FormInstance>()

// 模板集和步骤模板数据
const templateSets = ref<TemplateSet[]>([])
const stepTemplates = ref<StepTemplateVO[]>([])

// 使用导入的验证规则
const formRules = escalationStepFormRules

// 加载模板集数据
const loadTemplateSets = async () => {
  try {
    const response = await listTemplateSetsApi({
      offset: 0,
      limit: 1000 // 获取所有模板集
    })
    templateSets.value = response.data.template_sets || []
  } catch (error) {
    console.error("加载模板集失败:", error)
  }
}

// 加载步骤模板数据
const loadStepTemplates = async () => {
  try {
    const response = await listStepTemplatesApi({
      offset: 0,
      limit: 1000 // 获取所有步骤模板
    })
    stepTemplates.value = response.data.templates || []
  } catch (error) {
    console.error("加载步骤模板失败:", error)
  }
}

// 根据ID列表加载特定的步骤模板
const loadStepTemplatesByIDs = async (ids: number[]) => {
  if (ids.length === 0) return

  try {
    const response = await listStepTemplatesByIDsApi({ ids })
    // 将新加载的模板合并到现有列表中，避免重复
    const newTemplates = response.data.templates || []
    const existingIds = stepTemplates.value.map((t) => t.id)
    const uniqueNewTemplates = newTemplates.filter((t) => !existingIds.includes(t.id))
    stepTemplates.value.push(...uniqueNewTemplates)
  } catch (error) {
    console.error("根据ID加载步骤模板失败:", error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTemplateSets()
  loadStepTemplates()
})

// 暴露表单验证方法和数据加载方法
defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  loadStepTemplatesByIDs
})
</script>

<style lang="scss" scoped>
.step-form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.step-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
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
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
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

    :deep(.el-textarea__inner) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &:focus {
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

    :deep(.el-input-number) {
      .el-input__wrapper {
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

    :deep(.el-switch) {
      .el-switch__core {
        border-radius: 20px;
        transition: all 0.2s ease;
      }
    }
  }
}

// 按钮样式优化
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.el-button--primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  &.el-button--large {
    padding: 12px 24px;
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .step-form-container {
    padding: 16px;
  }

  .step-form {
    .form-section {
      margin-bottom: 20px;
    }

    .section-title {
      padding: 8px 12px;
      margin-bottom: 12px;

      .section-icon {
        font-size: 14px;
      }

      span {
        font-size: 13px;
      }
    }

    .form-row {
      margin-bottom: 12px;
    }
  }
}
</style>
