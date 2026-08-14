<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="80px">
    <el-form-item label="集合名称" prop="name">
      <el-input v-model="modelValue.name" placeholder="请输入集合名称" />
    </el-form-item>
    <el-form-item label="所属业务" prop="biz_id">
      <el-select v-model="modelValue.biz_id" class="full-width" placeholder="请选择所属业务">
        <el-option v-for="option in businessOptions" :key="option.value" v-bind="option" />
      </el-select>
    </el-form-item>
    <el-form-item prop="key">
      <template #label> 模板集稳定标识<span v-if="modelValue.biz_id === 3" class="required-mark">*</span> </template>
      <el-input v-model="modelValue.key" placeholder="例如 etask.task.execution.completed" />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入集合描述" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import type { CreateTemplateSetReq } from "@/api/alert/template_set/types"
import { FORM_RULES } from "../config/constants"

// 使用 defineModel 简化双向绑定
const modelValue = defineModel<CreateTemplateSetReq>({ required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  ...FORM_RULES.templateSet,
  key: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (modelValue.value.biz_id !== 3 || value?.trim()) {
          callback()
          return
        }
        callback(new Error("任务执行模板必须填写稳定标识"))
      },
      trigger: "blur"
    }
  ]
}))

const businessOptions = [
  { label: "通用模板", value: 0 },
  { label: "任务执行", value: 3 }
]

// 暴露验证方法
const validate = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

// 重置表单
const resetFields = () => {
  formRef.value?.resetFields()
}

// 暴露方法给父组件
defineExpose({
  validate,
  resetFields
})
</script>

<style scoped>
.full-width {
  width: 100%;
}

.required-mark {
  margin-left: 4px;
  color: var(--el-color-danger);
}
</style>
