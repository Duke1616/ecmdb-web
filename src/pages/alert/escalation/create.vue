<template>
  <PageContainer>
    <Drawer
      v-model="drawerVisible"
      title="创建升级配置"
      subtitle="配置告警升级的触发时机与组合逻辑"
      size="35%"
      direction="rtl"
      :header-icon="Setting"
      :confirm-loading="saving"
      confirm-button-text="创建配置"
      :close-on-click-modal="false"
      @confirm="handleSubmit"
      @cancel="handleCancel"
      @closed="goBack"
    >
      <EscalationConfigEditForm ref="formRef" v-model="formData" />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Setting } from "@element-plus/icons-vue"
import type { CreateConfigReq } from "@/api/alert/escalation/types"
import { createConfigApi } from "@/api/alert/escalation"
import PageContainer from "@@/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import EscalationConfigEditForm from "./components/EscalationConfigEditForm.vue"
import { createDefaultEscalationConfigData } from "./utils"

const router = useRouter()
const drawerVisible = ref(true)
const saving = ref(false)
const hasNavigatedBack = ref(false)
const formRef = ref<InstanceType<typeof EscalationConfigEditForm>>()

const formData = ref<CreateConfigReq>(createDefaultEscalationConfigData())

const goBack = () => {
  if (hasNavigatedBack.value) return
  hasNavigatedBack.value = true
  router.go(-1)
}

const handleSubmit = async () => {
  const isValid = await formRef.value?.validateForm()
  if (!isValid) return

  saving.value = true
  try {
    await createConfigApi(formData.value)
    ElMessage.success("创建成功")
    drawerVisible.value = false
  } catch (error) {
    console.error("创建配置失败:", error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  drawerVisible.value = false
}
</script>
