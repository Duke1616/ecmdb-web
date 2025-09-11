<template>
  <div class="thirdparty-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
      <el-form-item prop="name" label="模版名称">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="group_id" label="所属分组">
        <el-select v-model="formData.group_id" placeholder="请选择分组" class="full-width">
          <el-option v-for="item in templateGroupsData" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item prop="workflow_id" label="绑定流程">
        <el-select v-model="formData.workflow_id" placeholder="请选择流程" class="full-width">
          <el-option v-for="item in workFlowsData" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item prop="icon" label="应用图标">
        <e-icon-picker v-model="formData.icon" placeholder="请选择图标" class="icon-picker full-width" />
      </el-form-item>
      <el-form-item prop="desc" label="模版描述">
        <el-input v-model="formData.desc" type="textarea" :rows="3" placeholder="请输入模版描述" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { createTemplateApi, listTemplateGroupApi, updateTemplateApi } from "@/api/template"
import { template, templateGroup, type createOrUpdateTemplateReq } from "@/api/template/types/template"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, onMounted } from "vue"
import { cloneDeep } from "lodash-es"
import "vue3-icon-picker/dist/style.css"
import { workflow } from "@/api/workflow/types/workflow"
import { listWorkflowApi } from "@/api/workflow/workflow"

const emits = defineEmits(["closed", "list-templates", "success"])
const onClosed = () => {
  emits("closed")
}

const DEFAULT_FORM_DATA: createOrUpdateTemplateReq = {
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined,
  icon: "",
  group_id: undefined,
  workflow_id: undefined
}

const formData = ref<createOrUpdateTemplateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须输入图标", trigger: "blur" }],
  group_id: [{ required: true, message: "", trigger: "blur" }],
  workflow_id: [{ required: true, message: "", trigger: "blur" }]
}

const handleCreate = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    formData.value.rules = ""
    formData.value.options = ""
    const api = formData.value.id === undefined ? createTemplateApi : updateTemplateApi
    api(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        emits("success")
        emits("list-templates")
        onClosed()
      })
      .catch((error) => {
        console.log("catch", error)
        ElMessage.error("保存失败")
      })
      .finally(() => {})
  })
}

/** 查询模版列表 */
const templateGroupsData = ref<templateGroup[]>([])
const listTemplateGroups = () => {
  listTemplateGroupApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      templateGroupsData.value = data.template_groups
    })
    .catch(() => {
      templateGroupsData.value = []
    })
    .finally(() => {})
}

/** 查询流程列表 */
const workFlowsData = ref<workflow[]>([])
const listWorkFlowsData = () => {
  listWorkflowApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      workFlowsData.value = data.workflows
    })
    .catch(() => {
      workFlowsData.value = []
    })
    .finally(() => {})
}

const setForm = (row: template) => {
  formData.value = cloneDeep(row)

  // 空值清空，不展示
  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  handleCreate,
  setForm,
  resetForm
})

onMounted(() => {
  listTemplateGroups()
  listWorkFlowsData()
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
