<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="template-group-form">
    <el-form-item prop="name" label="名称">
      <el-input v-model="formData.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item prop="icon" label="图标">
      <AppIconPicker v-model="formData.icon" class="icon-picker" @change="formRef?.validateField('icon')" />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { createTemplateGroupApi, updateTemplateGroupApi } from "@/api/ticket/template"
import AppIconPicker from "@/common/components/AppIconPicker/index.vue"
import type {
  createTemplateGroupReq,
  templateGroup,
  updateTemplateGroupReq
} from "@/api/ticket/template/types/template"
import { ElMessage } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"

const emits = defineEmits<{
  closed: []
  success: []
}>()
const createDefaultGroupFormData = (): createTemplateGroupReq => ({
  name: "",
  icon: ""
})

type TemplateGroupFormData = createTemplateGroupReq | updateTemplateGroupReq

const onClosed = () => {
  emits("closed")
}

const formData = ref<TemplateGroupFormData>(createDefaultGroupFormData())
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须选择图标", trigger: "change" }]
}

const isUpdatePayload = (data: TemplateGroupFormData): data is updateTemplateGroupReq => {
  return "id" in data && typeof data.id === "number"
}

const handleCreate = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      if (isUpdatePayload(formData.value)) {
        await updateTemplateGroupApi(formData.value)
      } else {
        await createTemplateGroupApi(formData.value)
      }
      ElMessage.success("保存成功")
      emits("success")
      onClosed()
    } catch {
      ElMessage.error("保存失败")
    }
  })
}

const resetForm = () => {
  formData.value = createDefaultGroupFormData()
  formRef.value?.clearValidate()
}

const setForm = (data: templateGroup) => {
  formData.value = {
    id: data.id,
    name: data.name,
    icon: data.icon
  }
  formRef.value?.clearValidate()
}

defineExpose({
  handleCreate,
  resetForm,
  setForm
})
</script>

<style lang="scss" scoped>
.template-group-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.icon-picker {
  width: 100%;
}
</style>
