<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" style="width: 600px">
      <el-form-item prop="name" label="流程名称">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item prop="owner" label="负责人">
        <el-input v-model="formData.owner" />
      </el-form-item>
      <el-form-item prop="desc" label="流程说明">
        <el-input v-model="formData.desc" type="textarea" d />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleNext">下一步</el-button>
        <el-button @click="handleClose">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { createInfoReq, createOrUpdateWorkflowReq } from "@/api/workflow/types/workflow"
import { FormInstance, FormRules } from "element-plus"
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"

interface Props {
  data: createOrUpdateWorkflowReq
}
const props = defineProps<Props>()

const emits = defineEmits(["next", "close"])
const handleClose = () => {
  emits("close")
}

const DEFAULT_FORM_DATA: createInfoReq = {
  name: "",
  desc: "",
  icon: "",
  owner: ""
}

const formData = ref<createInfoReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}

const handleNext = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) {
      return console.error("表单校验不通过", fields)
    }
    emits("next", "info")
  })
}

// const setFormData = (data: createInfoReq) => {
//   formData.value = cloneDeep(data)
// }
// const setFormData = (data: createInfoReq) => {
//   formData.value = { ...data }
// }

const getFormData = () => {
  return formData.value
}

watch(
  () => props.data,
  (val: createInfoReq) => {
    console.log("hello， world")
    formData.value = cloneDeep(val)
  },
  { immediate: true }
)

defineExpose({
  getFormData
})
</script>

<style lang="scss" scoped>
.el-form {
  min-width: 100%; /* 确保表单至少和视窗一样宽 */
}
.flow-info {
  width: 1000px;
}
</style>
