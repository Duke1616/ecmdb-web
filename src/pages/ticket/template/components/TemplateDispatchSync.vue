<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
    <el-form-item prop="sync_template_id" label="来源模板">
      <el-select
        v-model="formData.sync_template_id"
        placeholder="请选择同一工作流下的模板"
        filterable
        :loading="loading"
        no-data-text="当前工作流没有其他模板"
      >
        <el-option v-for="item in sourceTemplates" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { syncDispatchApi } from "@/api/ticket/dispatch"
import type { syncDispatchReq } from "@/api/ticket/dispatch/types/dispatch"
import { getTemplateByWorkflowIdApi } from "@/api/ticket/template"
import type { template } from "@/api/ticket/template/types/template"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import { computed, ref, watch } from "vue"

interface Props {
  templateId?: number
  workflowId?: number
}

const props = defineProps<Props>()
const emits = defineEmits(["closed", "callback"])

const formRef = ref<FormInstance>()
const formData = ref<syncDispatchReq>({})
const templates = ref<template[]>([])
const loading = ref(false)

const sourceTemplates = computed(() => templates.value.filter((item) => item.id !== props.templateId))
const formRules: FormRules = {
  sync_template_id: [{ required: true, message: "请选择来源模板", trigger: "change" }]
}

const loadTemplates = async () => {
  formData.value.sync_template_id = undefined
  templates.value = []
  if (!props.workflowId) return

  loading.value = true
  try {
    const { data } = await getTemplateByWorkflowIdApi(props.workflowId)
    templates.value = data.templates || []
  } finally {
    loading.value = false
  }
}

const syncSubmit = async () => {
  await formRef.value?.validate()
  if (!props.templateId || !formData.value.sync_template_id) return

  await ElMessageBox.confirm("目标模板现有的条件路由将被完整替换。", "复制路由规则", {
    type: "warning",
    confirmButtonText: "继续复制",
    cancelButtonText: "取消"
  })
  await syncDispatchApi({
    template_id: props.templateId,
    sync_template_id: formData.value.sync_template_id
  })
  ElMessage.success("复制成功")
  emits("callback")
  emits("closed")
}

const resetForm = () => {
  formData.value = {}
  formRef.value?.clearValidate()
}

watch(() => props.workflowId, loadTemplates, { immediate: true })

defineExpose({ syncSubmit, resetForm })
</script>

<style lang="scss" scoped>
:deep(.el-select) {
  width: 100%;
}
</style>
