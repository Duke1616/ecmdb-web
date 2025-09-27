<template>
  <Drawer
    v-model="visible"
    :title="isEdit ? '编辑抑制规则' : '添加抑制规则'"
    :subtitle="isEdit ? '修改抑制规则配置' : '配置全局抑制规则，减少不必要的告警通知'"
    :header-icon="Filter"
    size="800px"
    :confirm-loading="submitting"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <InhibitForm v-if="formData" ref="inhibitFormRef" v-model:form-data="formData" :form-rules="formRules" />
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Filter } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import InhibitForm from "./components/InhibitForm.vue"
import { useInhibitForm } from "./composables/useInhibitForm"
import type { SaveInhibitRuleReq } from "@/api/alert/inhibit/types"

const emit = defineEmits<{
  (e: "confirm"): void
  (e: "cancel"): void
}>()

// 使用 defineModel 简化双向绑定
const visible = defineModel<boolean>("visible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<SaveInhibitRuleReq>("formData")

// 表单组件引用
const inhibitFormRef = ref<InstanceType<typeof InhibitForm>>()

// 使用共享的表单逻辑
const { formRules, validateForm } = useInhibitForm()

// 确认按钮点击
const handleConfirm = async () => {
  const formRef = inhibitFormRef.value?.formRef
  const isValid = await validateForm(formRef)
  if (isValid) {
    emit("confirm")
  }
}

// 取消按钮点击
const handleCancel = () => {
  emit("cancel")
}
</script>
