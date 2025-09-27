<template>
  <div class="rule-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="rule-form"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>聚合配置</span>
        </div>

        <div class="form-row">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item prop="type" label="聚合类型" class="form-item">
                <el-select v-model="formData.type" placeholder="请选择聚合类型" style="width: 100%">
                  <el-option label="按标签聚合" :value="0" />
                  <el-option label="按时间聚合" :value="1" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="is_diff_data_source" label="区分数据源" class="form-item">
                <div class="switch-container">
                  <el-switch v-model="formData.is_diff_data_source" size="large" />
                  <span class="form-tip">是否根据数据源进行分组</span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-row">
          <el-form-item prop="labels" label="聚合标签" class="form-item">
            <LabelSelector
              v-model="labels"
              placeholder="请输入标签名称，按回车添加"
              :multiple="true"
              :suggested-labels="suggestedLabels"
            />
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>时间配置</span>
        </div>

        <div class="timing-config-row">
          <div class="timing-config-item">
            <div class="timing-label">等待时间</div>
            <div class="timing-input-wrapper">
              <input v-model.number="formData.group_wait" type="number" min="0" class="timing-input" placeholder="秒" />
              <span class="timing-unit">秒</span>
            </div>
          </div>

          <div class="timing-config-item">
            <div class="timing-label">组间隔</div>
            <div class="timing-input-wrapper">
              <input
                v-model.number="formData.group_interval"
                type="number"
                min="0"
                class="timing-input"
                placeholder="秒"
              />
              <span class="timing-unit">秒</span>
            </div>
          </div>

          <div class="timing-config-item">
            <div class="timing-label">重复间隔</div>
            <div class="timing-input-wrapper">
              <input
                v-model.number="formData.repeat_interval"
                type="number"
                min="0"
                class="timing-input"
                placeholder="秒"
              />
              <span class="timing-unit">秒</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Bell /></el-icon>
          <span>通知配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="template_id" label="通知模板" class="form-item">
            <el-input-number
              v-model="formData.template_id"
              :min="1"
              placeholder="请输入通知模板ID"
              style="width: 200px"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Setting, Clock, Bell } from "@element-plus/icons-vue"
import LabelSelector from "@@/components/LabelSelector/index.vue"
import type { CreateAggregateGroupRuleReq } from "@/api/aggregate/types"
import type { FormInstance } from "element-plus"

interface Props {
  formRules: any
}
defineProps<Props>()

// 使用 defineModel 简化双向绑定
const formData = defineModel<CreateAggregateGroupRuleReq>("formData", { required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 推荐标签
const suggestedLabels = ref([
  "severity",
  "alertname",
  "instance",
  "job",
  "service",
  "environment",
  "cluster",
  "region",
  "team",
  "component"
])

// 确保 labels 数组的响应性
const labels = computed({
  get: () => formData.value.labels || [],
  set: (value: string[]) => {
    formData.value = { ...formData.value, labels: value }
  }
})

// 暴露 formRef 给父组件
defineExpose({
  formRef
})
</script>

<style lang="scss" scoped>
.rule-form-container {
  padding: 20px;
}

.rule-form {
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

  .timing-config-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 10px;

    .timing-config-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .timing-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .timing-input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .timing-input {
          width: 80px;
          height: 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          background: #ffffff;
          outline: none;
          -moz-appearance: textfield;
          appearance: textfield;
          &::-webkit-outer-spin-button,
          &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        }

        .timing-unit {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .rule-form-container {
    padding: 16px;
  }

  .rule-form {
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

    .timing-config-row {
      flex-direction: column;
      gap: 12px;

      .timing-config-item {
        min-width: auto;
      }
    }
  }
}
</style>
