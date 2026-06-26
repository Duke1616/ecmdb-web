<template>
  <PageContainer>
    <Drawer
      v-model="drawerVisible"
      title="创建升级配置"
      subtitle="配置升级规则和触发时机"
      size="42%"
      :header-icon="Setting"
      :confirm-loading="saving"
      confirm-button-text="创建配置"
      :close-on-click-modal="false"
      @confirm="handleSubmit"
      @cancel="handleCancel"
      @closed="handleCancel"
    >
      <EscalationConfigEditForm ref="formRef" v-model="formData" />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Setting } from "@element-plus/icons-vue"
import type { CreateConfigReq } from "@/api/alert/escalation/types"
import { ESCALATION_LOGIC_TYPES } from "@/api/alert/escalation/types"
import { createConfigApi } from "@/api/alert/escalation"
import PageContainer from "@@/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import EscalationConfigEditForm from "./components/EscalationConfigEditForm.vue"

const router = useRouter()
const drawerVisible = ref(true)
const saving = ref(false)
const formRef = ref<InstanceType<typeof EscalationConfigEditForm>>()

const formData = ref<CreateConfigReq>({
  name: "",
  description: "",
  enabled: true,
  timeout: 300,
  triggers: [],
  trigger_logic: {
    type: ESCALATION_LOGIC_TYPES.ALL,
    expression: "",
    description: ""
  },
  created_by: "admin"
})

const goBack = () => {
  router.go(-1)
}

const handleSubmit = async () => {
  const isValid = await formRef.value?.validateForm()
  if (!isValid) return

  saving.value = true
  try {
    await createConfigApi({ ...formData.value, steps: [] })
    ElMessage.success("创建成功")
    drawerVisible.value = false
    await nextTick()
    goBack()
  } catch (error) {
    console.error("创建配置失败:", error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  drawerVisible.value = false
  goBack()
}
</script>
