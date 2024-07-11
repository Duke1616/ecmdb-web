<template>
  <el-card>
    <FormCreate :rule="rule" :option="options" v-model="formData" v-model:api="fApi" />
  </el-card>
</template>

<script setup lang="ts">
//导入 form-create
import { detailTemplateApi } from "@/api/template"
import formCreate from "@form-create/element-ui"
import { onMounted, ref } from "vue"

//获取 formCreate 组件
const FormCreate = formCreate.$form()
const fApi = ref({})
const formData = ref({})
const options = ref({
  //表单提交事件
  onSubmit: function () {}
})

const rule = ref()
const handleDetail = () => {
  detailTemplateApi(14)
    .then((res) => {
      options.value = res.data.options
      rule.value = res.data.rules
      options.value.onSubmit = function () {
        alert(JSON.stringify(formData.value))
      }
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

onMounted(() => {
  handleDetail()
})
</script>
