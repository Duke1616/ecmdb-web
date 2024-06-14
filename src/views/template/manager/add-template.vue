<template>
  <el-drawer class="add-drawer" v-model="dialogDrawer" title="添加模版" direction="ttb" size="100%" @closed="onClosed">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" class="add-form">
      <el-form-item prop="name" label="名称">
        <el-input v-model="formData.name" placeholder="请输入名称" /> </el-form-item
      ><el-form-item prop="desc" label="描述">
        <el-input v-model="formData.desc" placeholder="请输入描述" />
      </el-form-item>
      <fc-designer ref="designerRef" :config="config" @save="handleSave" style="height: calc(100% - 40px)" />
    </el-form>
  </el-drawer>
</template>
<script setup lang="ts">
import { createTemplateApi } from "@/api/template"
import { type createTemplateReq } from "@/api/template/types/template"
import FcDesigner from "@form-create/designer"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"

// 接收父组建传递
interface Props {
  dialogVisible: boolean
}

const dialogDrawer = ref(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "list-templates"])
const onClosed = () => {
  emits("close", false)
}

const DEFAULT_FORM_DATA: createTemplateReq = {
  name: "",
  desc: ""
}

const formData = ref<createTemplateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}

const designerRef = ref<InstanceType<typeof FcDesigner>>()

const config: any = {
  showSaveBtn: true
}

const handleSave = () => {
  // 获取表单的生成规则
  formData.value.rules = designerRef.value!.getJson()
  // 获取表单的配置
  formData.value.options = designerRef.value!.getOptionsJson()

  console.log(formData.value.rules, "form-rules")
  console.log(formData.value.options, "form-options")
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createTemplateApi(formData.value)
      .then(() => {
        dialogDrawer.value = false
        ElMessage.success("保存成功")
        emits("list-templates")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

watch(
  () => props.dialogVisible,
  (val: boolean) => {
    dialogDrawer.value = val
  },
  { immediate: true }
)
</script>

<style lang="scss">
.add-form {
  height: 90%;
}

.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>
