<template>
  <Drawer
    v-model="visible"
    :title="isEdit ? '编辑静默规则' : '添加静默规则'"
    :subtitle="isEdit ? '修改静默规则配置' : '配置静默规则，减少维护期告警通知'"
    :header-icon="MuteNotification"
    size="35%"
    :confirm-loading="submitting"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <SilenceForm v-if="formData" ref="silenceFormRef" v-model:form-data="formData" />
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { MuteNotification } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import type { SaveSilenceRuleReq } from "@/api/alert/silence/types"
import SilenceForm from "./components/SilenceForm.vue"

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = defineModel<boolean>("visible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<SaveSilenceRuleReq>("formData")

const silenceFormRef = ref<InstanceType<typeof SilenceForm>>()

const handleConfirm = async () => {
  const formRef = silenceFormRef.value?.formRef
  if (!formRef) return

  const isValid = await formRef.validate().catch(() => false)
  if (!isValid) return

  const cleanedData = silenceFormRef.value?.getCleanedFormData()
  if (cleanedData) {
    formData.value = cleanedData
  }

  emit("confirm")
}

const handleCancel = () => {
  emit("cancel")
}
</script>
