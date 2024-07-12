<template>
  <div class="app-container">
    <el-dialog v-model="dialogVisible" :title="'新建工单'" @closed="resetForm" width="35%">
      <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate from "@form-create/element-ui"
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage } from "element-plus"
import { createOrderApi } from "@/api/order"
import { createOrderReq } from "@/api/order/types/order"

interface Props {
  templateId: number | undefined
  isVisible: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(["close"])
const dialogVisible = ref<boolean>(false)
const resetForm = () => {
  dialogVisible.value = false
  emits("close")
}
//获取 formCreate 组件
const FormCreate = formCreate.$form()
const fApi = ref({})

const DEFAULT_FORM_DATA: createOrderReq = {
  flow_id: 0,
  template_id: 0,
  data: {}
}

const formData = ref<createOrderReq>(cloneDeep(DEFAULT_FORM_DATA))

const data = ref()
const options = ref({
  //表单提交事件
  onSubmit: function () {}
})

const rule = ref()
const handleDetail = (id: number) => {
  detailTemplateApi(id)
    .then((res) => {
      options.value = res.data.options
      rule.value = res.data.rules
      options.value.onSubmit = function () {
        formData.value.data = data.value
        formData.value.template_id = res.data.id
        formData.value.flow_id = res.data.flow_id
        console.log(formData.value)
        createOrderApi(formData.value)
          .then(() => {
            resetForm()
            ElMessage.success("保存成功")
          })
          .catch((error) => {
            console.log("catch", error)
          })
          .finally(() => {})
      }
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

watch(
  () => props.isVisible,
  (val) => {
    dialogVisible.value = val
    if (props.templateId) {
      handleDetail(props.templateId)
    }
  },
  { immediate: true }
)
</script>
