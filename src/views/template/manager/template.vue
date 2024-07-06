<template>
  <el-drawer class="add-drawer" v-model="dialogDrawer" title="添加模版" direction="ttb" size="100%" @closed="onClosed">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" class="add-form">
      <el-form-item prop="name" label="名称">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="desc" label="描述">
        <el-input v-model="formData.desc" placeholder="请输入描述" />
      </el-form-item>
      <fc-designer ref="designerRef" :config="config" @save="handleSave" style="height: calc(100% - 40px)" />
    </el-form>
  </el-drawer>
</template>
<script setup lang="ts">
import { createTemplateApi, updateTemplateApi } from "@/api/template"
import { template, type createOrUpdateTemplateReq } from "@/api/template/types/template"
import FcDesigner from "@form-create/designer"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, watch, nextTick } from "vue"
import { cloneDeep } from "lodash-es"

// 接收父组建传递
interface Props {
  createDialogVisible: boolean
  updateDialogVisible: boolean
  templateData: template | undefined
}

const dialogDrawer = ref(false)
const props = defineProps<Props>()

const emits = defineEmits(["close", "list-templates"])
const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  dialogDrawer.value = false
  emits("close")
}

const updateTemplateData = ref<createOrUpdateTemplateReq>()
const DEFAULT_FORM_DATA: createOrUpdateTemplateReq = {
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined
}

const formData = ref<createOrUpdateTemplateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}

const designerRef = ref<InstanceType<typeof FcDesigner>>()
const config: any = {
  showSaveBtn: true,
  fieldReadonly: false
}

const handleSave = () => {
  // 获取表单的生成规则
  formData.value.rules = designerRef.value!.getJson()
  // 获取表单的配置
  formData.value.options = designerRef.value!.getOptionsJson()

  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = props.createDialogVisible === true ? createTemplateApi : updateTemplateApi
    api(formData.value)
      .then(() => {
        onClosed()
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
  () => props.createDialogVisible,
  (val) => {
    if (val) {
      dialogDrawer.value = true
      formData.value = cloneDeep(DEFAULT_FORM_DATA)
      designerRef.value?.setRule(DEFAULT_FORM_DATA.rules)
      designerRef.value?.setOption(DEFAULT_FORM_DATA.options)
    }
  },
  { immediate: true }
)

watch(
  () => props.updateDialogVisible,
  (val) => {
    if (val) {
      dialogDrawer.value = true
      nextTick(() => {
        designerRef.value?.setOptions(updateTemplateData.value?.options)
        designerRef.value?.setRule(JSON.stringify(updateTemplateData.value?.rules))
        formData.value = { ...formData.value, ...updateTemplateData.value }
      })
    }
  },
  { immediate: true }
)

watch(
  () => props.templateData,
  (val) => {
    if (val !== undefined) {
      updateTemplateData.value = val
      nextTick(() => {
        formData.value = { ...formData.value, ...updateTemplateData.value }
      })
    }
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
