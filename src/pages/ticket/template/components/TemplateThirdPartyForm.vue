<template>
  <div class="thirdparty-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
      <el-form-item prop="name" label="模板名称">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="group_id" label="所属分组">
        <el-select v-model="formData.group_id" placeholder="请选择分组" class="full-width">
          <el-option v-for="item in templateGroupsData" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item prop="workflow_id" label="绑定流程">
        <WorkflowPicker v-model="formData.workflow_id" placeholder="请选择流程" variant="simple" />
      </el-form-item>
      <el-form-item prop="icon" label="应用图标">
        <e-icon-picker v-model="formData.icon" placeholder="请选择图标" class="icon-picker full-width" />
      </el-form-item>
      <el-form-item prop="desc" label="模板描述">
        <el-input v-model="formData.desc" type="textarea" :rows="3" placeholder="请输入模板描述" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { createTemplateApi, updateTemplateApi } from "@/api/ticket/template"
import type { template } from "@/api/ticket/template/types/template"
import { ElMessage } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import "vue3-icon-picker/dist/style.css"
import WorkflowPicker from "./WorkflowPicker.vue"
import { createDefaultTemplateFormData } from "../types"
import { useTemplateOptions } from "../composables/useTemplateOptions"
import type { TemplateFormData } from "../types"

const emits = defineEmits<{
  closed: []
  success: []
}>()
const onClosed = () => {
  emits("closed")
}

const formData = ref<TemplateFormData>(createDefaultTemplateFormData())
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须输入图标", trigger: "blur" }],
  group_id: [{ required: true, message: "请选择所属分组", trigger: "change" }],
  workflow_id: [{ required: true, message: "请选择绑定流程", trigger: "change" }]
}

const handleCreate = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    formData.value.rules = ""
    formData.value.options = ""
    const api = formData.value.id === undefined ? createTemplateApi : updateTemplateApi
    try {
      await api(formData.value)
      ElMessage.success("保存成功")
      emits("success")
      onClosed()
    } catch {
      ElMessage.error("保存失败")
    }
  })
}

const { templateGroupsData } = useTemplateOptions()

const setForm = (row: template) => {
  formData.value = {
    ...createDefaultTemplateFormData(),
    ...cloneDeep(row),
    group_id: row.group_id || undefined,
    workflow_id: row.workflow_id || undefined
  }
}

const resetForm = () => {
  formData.value = createDefaultTemplateFormData()
}

defineExpose({
  handleCreate,
  setForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}

.icon-picker {
  width: 100%;
}

/* 表单项样式优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 0 1px #3b82f6;
  }
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
}
</style>
