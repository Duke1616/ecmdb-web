<template>
  <div class="ticket-config-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="ticket-config-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="配置名称" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入配置名称" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="description" label="配置描述" class="form-item">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入配置描述（可选）" />
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

      <!-- 触发条件 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>触发条件</span>
        </div>

        <div class="form-row form-row-inline">
          <el-form-item prop="duration" label="持续时间（秒）" class="form-item form-item-flex">
            <el-input-number v-model="formData.duration" placeholder="请输入持续时间" style="width: 100%" :min="0" />
          </el-form-item>
          <el-form-item prop="eval_count" label="触发次数" class="form-item form-item-flex">
            <el-input-number v-model="formData.eval_count" placeholder="请输入触发次数" style="width: 100%" :min="1" />
          </el-form-item>
        </div>
      </div>

      <!-- 工单配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Document /></el-icon>
          <span>工单配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="template_id" label="工单模板" class="form-item">
            <TemplateSelector v-model="formData.template_id" placeholder="请选择工单模板" variant="simple" />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, withDefaults, computed } from "vue"
import { Setting, Filter, Clock, Document, Plus } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { SaveTicketConfigReq } from "@/api/alert/ticket_config/types"
import { useTicketConfigForm } from "../composables/useTicketConfigForm"
import { clearZeroValues } from "@@/utils"
import { TemplateSelector } from "@@/components/SearchSelector"
import { useMatcher } from "@@/composables/useMatcher"

// Props
const props = withDefaults(
  defineProps<{
    formRules?: any
    isEdit?: boolean
    workspaceId: number
  }>(),
  {
    isEdit: false
  }
)

// 使用 defineModel 简化双向绑定
const formData = defineModel<SaveTicketConfigReq>("formData", { required: true })

// 使用 form composable 获取默认表单验证规则
const { formRules: defaultFormRules } = useTicketConfigForm()

// 使用传入的 formRules 或默认的
const formRules = props.formRules || defaultFormRules

const formRef = ref<FormInstance>()

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
.ticket-config-form-container {
  padding: 20px;
}

.ticket-config-form {
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
