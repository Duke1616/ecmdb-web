<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
    <el-form-item prop="name" label="名称">
      <el-input v-model="formData.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item prop="icon" label="图标">
      <e-icon-picker v-model="formData.icon" placeholder="请选择图标" class="icon-picker" />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { createTemplateGroupApi } from "@/api/ticket/template"
import type { createTemplateGroupReq } from "@/api/ticket/template/types/template"
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

const onClosed = () => {
  emits("closed")
}

const formData = ref<createTemplateGroupReq>(createDefaultGroupFormData())
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须输入图标", trigger: "blur" }]
}

const handleCreate = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      await createTemplateGroupApi(formData.value)
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
}

defineExpose({
  handleCreate,
  resetForm
})
</script>

<style lang="scss" scoped>
.icon-picker {
  width: 100%;
}
</style>
