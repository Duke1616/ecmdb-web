<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="120px">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="升级级别" prop="level">
          <el-input-number v-model="modelValue.level" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="模板集ID" prop="template_set_id">
          <el-input-number v-model="modelValue.template_set_id" :min="1" style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="延迟时间(秒)" prop="delay">
          <el-input-number v-model="modelValue.delay" :min="0" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="最大重试次数" prop="max_retries">
          <el-input-number v-model="modelValue.max_retries" :min="0" :max="10" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="重试间隔(秒)" prop="retry_interval">
          <el-input-number v-model="modelValue.retry_interval" :min="1" style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="紧急程度" prop="urgency_level">
          <el-select v-model="modelValue.urgency_level" style="width: 100%">
            <el-option label="低" :value="1" />
            <el-option label="较低" :value="2" />
            <el-option label="中等" :value="3" />
            <el-option label="高" :value="4" />
            <el-option label="紧急" :value="5" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="步骤模板ID" prop="step_template_id">
          <el-input-number v-model="modelValue.step_template_id" :min="0" style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="条件表达式" prop="condition_expr">
      <el-input v-model="modelValue.condition_expr" type="textarea" :rows="2" placeholder="如: alert.severity >= 3" />
      <div class="form-tip">
        支持的条件表达式示例：alert.severity >= 3, alert.duration > 300, alert.labels.env == 'prod'
      </div>
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="跳过已处理" prop="skip_if_handled">
          <el-switch v-model="modelValue.skip_if_handled" />
          <div class="form-tip">如果告警对象已被处理则跳过此步骤</div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="失败时继续" prop="continue_on_fail">
          <el-switch v-model="modelValue.continue_on_fail" />
          <div class="form-tip">前一步失败时是否继续执行此步骤</div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import type { CreateStepReq } from "@/api/alert/escalation/types"

const modelValue = defineModel<CreateStepReq>({ required: true })
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules: FormRules = {
  level: [
    { required: true, message: "请输入升级级别", trigger: "blur" },
    { type: "number", min: 1, max: 10, message: "升级级别必须在 1-10 之间", trigger: "blur" }
  ],
  template_set_id: [
    { required: true, message: "请输入模板集ID", trigger: "blur" },
    { type: "number", min: 1, message: "模板集ID必须大于0", trigger: "blur" }
  ],
  delay: [{ type: "number", min: 0, message: "延迟时间不能小于0", trigger: "blur" }],
  max_retries: [{ type: "number", min: 0, max: 10, message: "最大重试次数必须在 0-10 之间", trigger: "blur" }],
  retry_interval: [{ type: "number", min: 1, message: "重试间隔必须大于0", trigger: "blur" }],
  urgency_level: [{ type: "number", min: 1, max: 5, message: "紧急程度必须在 1-5 之间", trigger: "blur" }]
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields()
})
</script>

<style lang="scss" scoped>
.form-tip {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
