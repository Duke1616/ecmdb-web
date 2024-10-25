<template>
  <div class="app-container">
    <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
  </div>
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate, { Rule } from "@form-create/element-ui"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage } from "element-plus"
import { createOrderApi } from "@/api/order"
import { createOrderReq } from "@/api/order/types/order"
import { template } from "@/api/template/types/template"
import { useUserStore } from "@/store/modules/user"

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
const rule = ref<Rule[]>()
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

      if (rule.value !== undefined) {
        processRules(rule.value)
      }
      // API 请求插入调用参数

      console.log(options.value)
      console.log(rule.value)

      // 将 onSubmit 函数绑定到闭包函数
      options.value.onSubmit = handleSubmit(resData)
    })
    .catch((error) => {
      console.log("catch", error)
    })
}
function processRules(rules: Rule[]) {
  rules.forEach(async (rule: Rule) => {
    if (typeof rule.effect?.fetch === "object" && "data" in rule.effect.fetch) {
      let fetchData: { [key: string]: any } = {}

      if (typeof rule.effect.fetch.data === "string") {
        try {
          fetchData = JSON.parse(rule.effect.fetch.data)
        } catch (e) {
          console.error("Failed to parse fetch.data as JSON:", e)
          fetchData = {}
        }
      } else if (typeof rule.effect.fetch.data === "object" && rule.effect.fetch.data !== null) {
        fetchData = rule.effect.fetch.data
      }
      await useUserStore().getInfo()
      fetchData.username = useUserStore().username

      // 重新赋值给 fetch.data
      rule.effect.fetch.data = fetchData
    }

    // 递归处理 control 字段
    if (rule.control) {
      processRules(rule.control)
    }

    // 递归处理 rule 字段
    if (rule.rule) {
      processRules(rule.rule)
    }
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
