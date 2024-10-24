<template>
  <div class="app-container">
    <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
  </div>
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate from "@form-create/element-ui"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage } from "element-plus"
import { createOrderApi } from "@/api/order"
import { createOrderReq } from "@/api/order/types/order"
import { template } from "@/api/template/types/template"

const emits = defineEmits(["closed"])
const onClosed = () => {
  emits("closed")
}

const FormCreate = formCreate.$form()
const fApi = ref({})

const DEFAULT_FORM_DATA: createOrderReq = {
  workflow_id: 0,
  template_id: 0,
  template_name: "",
  data: {}
}

const formData = ref<createOrderReq>(cloneDeep(DEFAULT_FORM_DATA))

const data = ref()
const rule = ref()
const options = ref({
  //表单提交事件
  onSubmit: function () {}
})

const handleDetail = (id: number) => {
  detailTemplateApi(id)
    .then((res) => {
      const resData = res.data
      // 使用解构赋值
      options.value = { ...resData.options }
      rule.value = resData.rules

      // 将 onSubmit 函数绑定到闭包函数
      options.value.onSubmit = handleSubmit(resData)
    })
    .catch((error) => {
      console.log("catch", error)
    })
}

const handleSubmit = (resData: template) => {
  return () => {
    // 封装提交数据的逻辑
    formData.value = {
      data: data.value,
      template_name: resData.name,
      template_id: resData.id,
      workflow_id: resData.workflow_id
    }

    createOrderApi(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
      })
      .catch((error) => {
        console.log("catch", error)
      })
  }
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  handleDetail,
  resetForm
})
</script>
