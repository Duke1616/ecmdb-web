<template>
  <Drawer
    v-model="visible"
    :title="isEdit ? '编辑聚合规则' : '添加聚合规则'"
    :subtitle="isEdit ? '修改聚合规则配置' : '为工作空间配置告警聚合规则'"
    :header-icon="Setting"
    size="600px"
    :confirm-loading="submitting"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <AggregateForm v-if="formData" ref="aggregateFormRef" v-model:form-data="formData" :form-rules="formRules" />
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Setting } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import AggregateForm from "./components/AggregateForm.vue"
import { useAggregateForm } from "./composables/useAggregateForm"
import type { CreateAggregateGroupRuleReq } from "@/api/aggregate/types"

const emit = defineEmits<{
  (e: "confirm"): void
  (e: "cancel"): void
}>()

// 使用 defineModel 简化双向绑定
const visible = defineModel<boolean>("visible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<CreateAggregateGroupRuleReq>("formData")

// 表单组件引用
const aggregateFormRef = ref<InstanceType<typeof AggregateForm>>()

// 使用共享的表单逻辑
const { formRules, validateForm } = useAggregateForm(formData.value?.workspace_id || 0)

// 确认按钮点击
const handleConfirm = async () => {
  const formRef = aggregateFormRef.value?.formRef
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
