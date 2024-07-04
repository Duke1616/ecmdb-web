<template>
  <div>
    <el-form ref="formRef" :model="propertyForm" :inline-message="true" :rules="formRules" label-position="top">
      <el-form-item label="关系名称" prop="name">
        <el-input v-model="propertyForm.name" type="name" />
      </el-form-item>
      <el-form-item label="关系表达式" prop="condition">
        <el-input v-model="propertyForm.condition" type="condition" />
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
  condition: "",
  name: ""
})

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
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
  propertyForm.value.name = props.nodeData?.text.value
})
</script>
<style scoped></style>
