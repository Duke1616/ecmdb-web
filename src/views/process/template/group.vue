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
import { createTemplateGroupApi } from "@/api/template"
import { createTemplateGroupReq } from "@/api/template/types/template"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"

const emits = defineEmits(["closed", "list-templates"])
const DEFAULT_FORM_DATA: createTemplateGroupReq = {
  name: "",
  icon: ""
}

const onClosed = () => {
  emits("closed")
}

const formData = ref<createTemplateGroupReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须输入图标", trigger: "blur" }]
}

const handlerCreate = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createTemplateGroupApi(formData.value)
      .then(() => {
        onClosed()

        ElMessage.success("保存成功")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  handlerCreate,
  resetForm
})
</script>

<style lang="scss" scoped>
.icon-picker {
  width: 100%;
}
</style>
