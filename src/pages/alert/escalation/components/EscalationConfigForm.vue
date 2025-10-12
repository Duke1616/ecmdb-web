<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="120px">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="modelValue.name" placeholder="请输入配置名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="配置标识" prop="key">
          <el-input v-model="modelValue.key" placeholder="请输入配置标识" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="配置描述" prop="description">
      <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="modelValue.enabled" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="超时时间(秒)" prop="timeout">
          <el-input-number v-model="modelValue.timeout" :min="1" :max="3600" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="创建人" prop="created_by">
          <el-input v-model="modelValue.created_by" placeholder="请输入创建人" />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 触发条件 -->
    <el-form-item label="触发条件" prop="triggers">
      <div class="triggers-section">
        <div v-for="(trigger, index) in modelValue.triggers" :key="index" class="trigger-item">
          <el-row :gutter="10">
            <el-col :span="6">
              <el-select v-model="trigger.type" placeholder="触发类型" style="width: 100%">
                <el-option label="告警级别" value="severity" />
                <el-option label="持续时间" value="duration" />
                <el-option label="标签匹配" value="label" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="trigger.condition" placeholder="条件" style="width: 100%">
                <el-option label="大于等于" value=">=" />
                <el-option label="大于" value=">" />
                <el-option label="等于" value="==" />
                <el-option label="包含" value="contains" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-input v-model="trigger.value" placeholder="值" />
            </el-col>
            <el-col :span="6">
              <el-button type="danger" :icon="Delete" circle @click="removeTrigger(index)" />
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" :icon="Plus" @click="addTrigger"> 添加触发条件 </el-button>
      </div>
    </el-form-item>

    <!-- 触发逻辑 -->
    <el-form-item label="触发逻辑" prop="trigger_logic">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="逻辑操作符" prop="trigger_logic.operator">
            <el-select v-model="modelValue.trigger_logic.operator" style="width: 100%">
              <el-option label="AND (且)" value="AND" />
              <el-option label="OR (或)" value="OR" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form-item>

    <!-- 升级步骤 -->
    <el-form-item label="升级步骤" prop="steps">
      <div class="steps-section">
        <div v-for="(step, index) in modelValue.steps" :key="index" class="step-item">
          <el-card>
            <template #header>
              <div class="step-header">
                <span>步骤 {{ step.level }}</span>
                <el-button type="danger" :icon="Delete" size="small" @click="removeStep(index)" />
              </div>
            </template>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="升级级别" :prop="`steps.${index}.level`">
                  <el-input-number v-model="step.level" :min="1" :max="10" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="模板集ID" :prop="`steps.${index}.template_set_id`">
                  <el-input-number v-model="step.template_set_id" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="延迟时间(秒)" :prop="`steps.${index}.delay`">
                  <el-input-number v-model="step.delay" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="最大重试次数" :prop="`steps.${index}.max_retries`">
                  <el-input-number v-model="step.max_retries" :min="0" :max="10" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="重试间隔(秒)" :prop="`steps.${index}.retry_interval`">
                  <el-input-number v-model="step.retry_interval" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="紧急程度" :prop="`steps.${index}.urgency_level`">
                  <el-input-number v-model="step.urgency_level" :min="1" :max="5" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="条件表达式" :prop="`steps.${index}.condition_expr`">
                  <el-input v-model="step.condition_expr" placeholder="如: alert.severity >= 3" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="跳过已处理">
                  <el-switch v-model="step.skip_if_handled" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="失败时继续">
                  <el-switch v-model="step.continue_on_fail" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </div>
        <el-button type="primary" :icon="Plus" @click="addStep"> 添加升级步骤 </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import type { CreateConfigReq } from "@/api/alert/escalation/types"

const modelValue = defineModel<CreateConfigReq>({ required: true })
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入配置名称", trigger: "blur" },
    { min: 1, max: 50, message: "配置名称长度在 1 到 50 个字符", trigger: "blur" }
  ],
  key: [
    { required: true, message: "请输入配置标识", trigger: "blur" },
    { min: 1, max: 30, message: "配置标识长度在 1 到 30 个字符", trigger: "blur" }
  ],
  created_by: [{ required: true, message: "请输入创建人", trigger: "blur" }]
}

// 添加触发条件
const addTrigger = () => {
  modelValue.value.triggers.push({
    type: "",
    condition: "",
    value: ""
  })
}

// 移除触发条件
const removeTrigger = (index: number) => {
  modelValue.value.triggers.splice(index, 1)
}

// 添加升级步骤
const addStep = () => {
  const newLevel = modelValue.value.steps.length + 1
  modelValue.value.steps.push({
    level: newLevel,
    template_set_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 60,
    skip_if_handled: false,
    continue_on_fail: true,
    condition_expr: "",
    urgency_level: 1
  })
}

// 移除升级步骤
const removeStep = (index: number) => {
  modelValue.value.steps.splice(index, 1)
  // 重新调整级别
  modelValue.value.steps.forEach((step, idx) => {
    step.level = idx + 1
  })
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields()
})
</script>

<style lang="scss" scoped>
.triggers-section {
  .trigger-item {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
}

.steps-section {
  .step-item {
    margin-bottom: 16px;

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }
}
</style>
