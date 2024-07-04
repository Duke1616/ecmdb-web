<template>
  <el-drawer
    class="update-drawer"
    v-model="dialogDrawer"
    title="修改模版"
    direction="ttb"
    size="100%"
    @closed="onClosed"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" class="update-form">
      <el-form-item prop="name" label="名称">
        <el-input v-model="formData.name" placeholder="请输入名称" /> </el-form-item
      ><el-form-item prop="desc" label="描述">
        <el-input v-model="formData.desc" placeholder="请输入描述" />
      </el-form-item>
      <fc-designer ref="designerRef" :config="config" style="height: calc(100% - 25px)" />
    </el-form>
  </el-drawer>
</template>
<script setup lang="ts">
import { type template, type createTemplateReq } from "@/api/template/types/template"
import FcDesigner from "@form-create/designer"
import { FormInstance, FormRules } from "element-plus"
import { nextTick, ref, watch } from "vue"
import { cloneDeep } from "lodash-es"

// 接收父组建传递
interface Props {
  dialogVisible: boolean
  templateData: template | undefined
}

const dialogDrawer = ref(false)
const props = defineProps<Props>()
const emits = defineEmits(["close"])
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

const config: any = {
  showSaveBtn: true,
  fieldReadonly: false
}

watch(
  () => props.dialogVisible,
  async (val: boolean) => {
    dialogDrawer.value = val
    await nextTick()
  },
  { immediate: true }
)

const designerRef = ref<InstanceType<typeof FcDesigner>>()
watch(
  () => props.templateData,
  async (val: template | undefined) => {
    if (val !== undefined) {
      await nextTick()

      designerRef.value?.setOptions(val.options)
      designerRef.value?.setRule(JSON.stringify(val.rules))
      formData.value.name = val.name
      formData.value.desc = val.desc
    }
  },
  { immediate: true }
)
</script>

<style lang="scss">
.update-form {
  height: 90%;
}

.update-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>
