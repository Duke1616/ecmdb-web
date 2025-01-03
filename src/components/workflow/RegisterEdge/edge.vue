<template>
  <div>
    <el-form ref="formRef" :model="propertyForm" :inline-message="true" :rules="formRules" label-position="top">
      <el-form-item label="关系名称" prop="name">
        <el-input v-model="propertyForm.name" type="name" />
      </el-form-item>
      <el-form-item label="关系表达式" prop="expression">
        <el-input v-model="propertyForm.expression" type="expression" />
      </el-form-item>
    </el-form>
    <div class="mt15">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import { FormInstance, FormRules } from "element-plus"
const props = defineProps({
  nodeData: Object,
  lf: Object
})

const emits = defineEmits(["closed"])
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  id: [{ required: true, message: "连线类型不能为空" }]
}

const propertyForm = ref({
  expression: "",
  is_pass: false,
  name: ""
})

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.value.name,
    expression: propertyForm.value.expression,
    frontend_status: "1" //0配置错误，1配置正常
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.value.name)
      emits("closed")
    }
  })
}

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(() => {
  propertyForm.value.name = props.nodeData?.properties.name ? props.nodeData?.properties.name : ""
  propertyForm.value.is_pass = props.nodeData?.properties.is_pass ? props.nodeData.properties.is_pass : false
  propertyForm.value.expression = props.nodeData?.properties.expression ? props.nodeData.properties.expression : ""
})
</script>
<style scoped></style>
