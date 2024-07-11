<template>
  <el-dialog v-model="dialogVisible" :title="'新增模版分组'" @closed="resetForm" width="30%">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
      <el-form-item prop="name" label="名称">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="icon" label="图标">
        <Vue3IconPicker v-model="formData.icon" valueType="name" placeholder="请选择图标" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handlerCreate">确认</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { createTemplateGroupApi } from "@/api/template"
import { createTemplateGroupReq } from "@/api/template/types/template"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { Vue3IconPicker } from "vue3-icon-picker"

interface Props {
  createDialogVisible: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "list-templates"])
const dialogVisible = ref<boolean>(false)
const DEFAULT_FORM_DATA: createTemplateGroupReq = {
  name: "",
  icon: ""
}

const formData = ref<createTemplateGroupReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "图标", trigger: "blur" }]
}

const handlerCreate = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createTemplateGroupApi(formData.value)
      .then(() => {
        resetForm()

        ElMessage.success("保存成功")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const resetForm = () => {
  dialogVisible.value = false
  emits("close")
}

watch(
  () => props.createDialogVisible,
  (val) => {
    if (val) {
      dialogVisible.value = true
      formData.value = cloneDeep(DEFAULT_FORM_DATA)
    }
  },
  { immediate: true }
)
</script>
