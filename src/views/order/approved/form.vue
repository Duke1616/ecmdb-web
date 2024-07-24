<template>
  <div>
    <div>
      <el-card title="审批">
        <template #header>
          <strong> 表单信息</strong>
        </template>
        <!-- 如果是自己的工单，支持修改 -->
        <div v-if="props.action != 'my'">
          <FormCreate
            :rule="rule"
            :option="options"
            v-model="data"
            :disabled="props.action != 'my'"
            v-model:api="fApi"
          />
        </div>

        <!-- 不是我的工单，禁止修改数据 -->
        <div v-if="props.action == 'my'">
          <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
          <div class="form-bottom" v-if="props.action == 'my'">
            <el-form-item>
              <el-button type="primary" size="large" @click="handlePass">修改</el-button>
              <el-button type="danger" size="large" @click="handleReject">撤回</el-button>
            </el-form-item>
          </div>
        </div>
      </el-card>
    </div>
    <div v-if="props.action != 'my'">
      <el-card>
        <template #header>
          <strong>操作信息</strong>
        </template>
        <el-form ref="formRef" :model="formData" label-width="auto">
          <el-form-item prop="comment" label="评论">
            <el-input v-model="formData.comment" type="textarea" />
          </el-form-item>
        </el-form>

        <div class="form-bottom">
          <el-form-item>
            <el-button type="primary" size="large" @click="handlePass">同意</el-button>
            <el-button type="danger" size="large" @click="handleReject">驳回</el-button>
          </el-form-item>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate from "@form-create/element-ui"
import { ref, watch } from "vue"
import { getOrderByProcessInstIdApi, passOrderApi, rejectOrderApi } from "@/api/order"
import { passOrder } from "@/api/order/types/order"
import { cloneDeep } from "lodash-es"
import { FormInstance } from "element-plus"

interface Props {
  templateId: number | undefined
  processInstId: number | undefined
  taskId: number | undefined
  action: string
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "refresh-data"])

//获取 formCreate 组件
const FormCreate = formCreate.$form()
const fApi = ref({})
const data = ref()
const options = ref({
  //表单提交事件
  submitBtn: false
})

const DEFAULT_FORM_DATA: passOrder = {
  task_id: 0,
  comment: ""
}
const formData = ref<passOrder>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

const rule = ref()
const handleDetail = (id: number, processInstId: number) => {
  detailTemplateApi(id)
    .then((res) => {
      // 工单模版
      options.value = res.data.options
      rule.value = res.data.rules
      options.value.submitBtn = false
      // 获取工单数据
      handleGetOrderData(processInstId)
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

const handleGetOrderData = (processInstId: number) => {
  getOrderByProcessInstIdApi(processInstId)
    .then((res) => {
      data.value = res.data.data
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

const handlePass = () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  passOrderApi(formData.value).then(() => {
    // 重置表单，关闭弹窗
    resetForm()
  })
}

const handleReject = () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  rejectOrderApi(formData.value).then(() => {
    // 重置表单，关闭弹窗
    resetForm()
  })
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  emits("close")
  emits("refresh-data")
}

watch(
  () => props.templateId,
  () => {
    if (props.templateId && props.processInstId) {
      handleDetail(props.templateId, props.processInstId)
    }
  },
  { immediate: true }
)

defineExpose({})
</script>

<style lang="scss" scoped>
.form-bottom {
  display: flex;
  justify-content: flex-end;
}
</style>
