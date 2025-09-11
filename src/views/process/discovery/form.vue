<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
    <el-form-item prop="field" label="请选择字段">
      <el-select v-model="formData.field" placeholder="请选择模版字段">
        <el-option v-for="[field, title] in Array.from(props.fieldsMap)" :key="field" :label="title" :value="field" />
      </el-select>
    </el-form-item>
    <el-form-item prop="value" label="输入匹配值">
      <el-input v-model="formData.value" placeholder="请输入匹配值" />
    </el-form-item>
    <el-form-item prop="runner_id" label="执行器名称">
      <el-select v-model="formData.runner_id" placeholder="请选择执行器">
        <el-option v-for="[id, name] in Array.from(runnerMap)" :key="id" :label="name" :value="id" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { createOrUpdateDiscoveryReq, discovery } from "@/api/discovery/types/discovery"
import { ref } from "vue"

import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { createDiscoveryApi, updateDiscoveryApi } from "@/api/discovery"

const emits = defineEmits(["closed", "callback"])

// 接收父组建传递
interface Props {
  fieldsMap: Map<string, string>
  runnerMap: Map<number, string>
  templateId: number | undefined
}

const props = defineProps<Props>()

const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()

  emits("closed")
}

const DEFAULT_FORM_DATA: createOrUpdateDiscoveryReq = {
  template_id: 0,
  runner_id: 0,
  field: "",
  value: ""
}

const formData = ref<createOrUpdateDiscoveryReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  runner_id: [{ required: true, message: "必须输入执行器", trigger: "blur" }],
  field: [{ required: true, message: "必须输入字段名称", trigger: "blur" }],
  value: [{ required: true, message: "必须输入匹配值", trigger: "blur" }]
}

const submitForm = async () => {
  try {
    await formRef.value?.validate()
    if (!props.templateId) return
    formData.value.template_id = props.templateId

    const api = formData.value.id === undefined ? createDiscoveryApi : updateDiscoveryApi
    await api(formData.value)

    ElMessage.success("保存成功")
    onClosed()
    emits("callback")
  } catch (error) {
    // 表单验证错误已由Element Plus处理
    if (!(error instanceof Error)) {
      ElMessage.error("操作失败")
    }
  }
}

const setForm = (row: discovery) => {
  formData.value = cloneDeep(row)
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()

  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

defineExpose({
  submitForm,
  setForm,
  resetForm
})
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
