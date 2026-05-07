<script setup lang="ts">
import { ref } from "vue"
import { Drawer } from "@@/components/Dialogs"
import { Connection } from "@element-plus/icons-vue"
import IdentitySourceForm from "./IdentitySourceForm.vue"
import type { IdentitySourceVO } from "@/api/iam/identity-source/type"

const visible = defineModel<boolean>({ default: false })

defineProps<{
  initialData?: IdentitySourceVO
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = ref<InstanceType<typeof IdentitySourceForm>>()
const submitting = ref(false)

const handleConfirm = async () => {
  if (!formRef.value) return
  submitting.value = true
  try {
    await formRef.value.submit()
    visible.value = false
    emit("success")
  } catch (error) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

const handleSuccess = () => {
  visible.value = false
  emit("success")
}
</script>

<template>
  <Drawer
    v-model="visible"
    :title="initialData ? '编辑身份源' : '集成新协议身份源'"
    subtitle="配置外部目录服务或 OAuth 身份提供商进行身份联合"
    size="640px"
    :header-icon="Connection"
    :confirm-loading="submitting"
    @confirm="handleConfirm"
  >
    <IdentitySourceForm ref="formRef" :initial-data="initialData" @success="handleSuccess" />
  </Drawer>
</template>
