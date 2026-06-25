<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="80px">
    <el-form-item label="集合名称" prop="name">
      <el-input v-model="modelValue.name" placeholder="请输入集合名称" />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入集合描述" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import type { CreateTemplateSetReq } from "@/api/alert/template_set/types"
import { FORM_RULES } from "../config/constants"

// 使用 defineModel 简化双向绑定
const modelValue = defineModel<CreateTemplateSetReq>({ required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules: FormRules = FORM_RULES.templateSet

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
