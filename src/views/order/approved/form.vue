<template>
  <div class="form-container">
    <div class="form-scroll-area">
      <!-- 表单信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>表单信息</span>
        </div>

        <!-- 如果是自己的工单，支持修改 -->
        <div v-if="props.action != 'my-Start'">
          <FormCreate
            :rule="rule"
            :option="options"
            v-model="data"
            :disabled="props.action != 'my'"
            v-model:api="fApi"
          />
        </div>

        <!-- 不是我的工单，禁止修改数据 -->
        <div v-if="props.action == 'my-Start'">
          <FormCreate :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
          <div class="form-actions">
            <el-button type="primary" :icon="EditPen" @click="handlePass">修改</el-button>
            <el-button type="danger" :icon="RefreshLeft" @click="handleRevoke">撤回</el-button>
          </div>
        </div>
      </div>

      <!-- 操作信息 -->
      <div v-if="!/^my-/.test(props.action) && props.action !== 'history'" class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>操作信息</span>
        </div>

        <el-form ref="formRef" :model="formData" label-position="top" class="operation-form">
          <div v-if="taskFormSchema && taskFormSchema.length > 0" class="dynamic-form-section">
            <DynamicForm ref="dynamicFormRef" :schema="taskFormSchema" v-model="taskFormData" />
          </div>

          <el-form-item prop="comment" label="评论" class="form-item required">
            <el-input
              v-model="formData.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入评论内容"
              maxlength="200"
              show-word-limit
              class="form-textarea"
            />
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button type="primary" :icon="Check" @click="handlePassConfirm">同意</el-button>
          <el-button type="danger" :icon="Close" @click="handleRejectConfirm">驳回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate, { FormRule, Api } from "@form-create/element-ui"
import { ref, watch } from "vue"
import { getOrderByProcessInstIdApi, passOrderApi, rejectOrderApi, revokeOrderApi } from "@/api/order"
import { passOrder } from "@/api/order/types/order"
import { cloneDeep } from "lodash-es"
import { FormInstance, Options, ElMessageBox, ElMessage } from "element-plus"
import { Document, Setting, EditPen, RefreshLeft, Check, Close } from "@element-plus/icons-vue"
import DynamicForm from "./components/DynamicForm.vue"
import { getTaskFormConfigApi } from "@/api/order/index"
import { removeFetchFromRules } from "@/common/utils/form-create"

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
const fApi = ref<Api>()
const data = ref()
const rule = ref<FormRule[]>()
const options = ref<FormRule>()

const DEFAULT_FORM_DATA: passOrder = {
  task_id: 0,
  comment: ""
}
const formData = ref<passOrder>(cloneDeep(DEFAULT_FORM_DATA))
const taskFormSchema = ref<any[]>([])
const taskFormData = ref<any>({})
const formRef = ref<FormInstance | null>(null)
const dynamicFormRef = ref<any>(null)

const handleDetail = (id: number) => {
  detailTemplateApi(id)
    .then((res) => {
      // 工单模版
      // 工单模版
      const parsedOptions = formCreate.parseJson(res.data.options) as unknown as Options
      ;(parsedOptions as any).submitBtn = false

      const parsedRules = formCreate.parseJson(res.data.rules)

      // 如果不是 "my" 或 "my-Start"，说明是查看模式，移除 fetch 配置，防止触发动态请求
      console.log("handleDetail form action:", props.action)
      if (props.action !== "my" && props.action !== "my-Start") {
        console.log("Removing fetch configuration from rules for read-only mode")
        removeFetchFromRules(parsedRules)
        removeFetchFromRules(parsedOptions)
      }

      options.value = parsedOptions
      rule.value = parsedRules
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

const handleGetOrderData = (processInstId: number) => {
  getOrderByProcessInstIdApi(processInstId)
    .then((res) => {
      const orderInfo = res.data
      console.log("handleGetOrderData res.data:", orderInfo)
      data.value = orderInfo.data

      // 获取当前节点的表单配置
      // 如果 props.taskId 存在，则使用它；否则尝试从 orderInfo 获取 (orderInfo.task_id)
      const taskId = props.taskId || orderInfo.task_id
      if (taskId && orderInfo.workflow_id) {
        handleGetTaskFormConfig(taskId, orderInfo.workflow_id)
      } else {
        console.warn("Skipping form config fetch: Missing taskId or workflow_id", {
          taskId,
          workflow_id: orderInfo.workflow_id
        })
      }

      // 如果 props 没有传入 templateId，则使用 orderInfo 中的 template_id 加载模版
      if (!props.templateId && orderInfo.template_id) {
        handleDetail(orderInfo.template_id)
      }
    })
    .catch((error) => {
      console.log("catch", error)
    })
    .finally(() => {})
}

// 获取任务表单配置
const handleGetTaskFormConfig = (taskId: number, workflowId: number) => {
  getTaskFormConfigApi({
    task_id: taskId,
    workflow_id: workflowId
  })
    .then((res) => {
      console.log("getTaskFormConfigApi res:", res)
      if (res.data && Array.isArray(res.data)) {
        taskFormSchema.value = res.data
      } else {
        taskFormSchema.value = []
      }
    })
    .catch((err) => {
      console.error("fetch task form config error", err)
    })
}

// 同意确认弹窗
const handlePassConfirm = async () => {
  if (!formRef.value) return

  try {
    // 1. 验证基本表单 (评论)
    await formRef.value.validate()

    // 2. 验证动态表单 (如果存在)
    if (dynamicFormRef.value) {
      await dynamicFormRef.value.validate()
    }

    ElMessageBox.confirm("是否确认同意该工单？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        handlePassOrder()
      })
      .catch(() => {})
  } catch (error) {
    // 验证失败
    console.warn("Validation failed", error)
  }
}

const handlePass = () => {
  fApi.value?.validate((valid: boolean) => {
    if (!valid) return

    ElMessageBox.confirm("确认修改并提交工单？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        const submitData = {
          task_id: props.taskId || formData.value.task_id,
          comment: "修改并提交",
          ...data.value
        }

        passOrderApi(submitData)
          .then(() => {
            ElMessage.success("工单已提交")
            resetForm()
          })
          .catch((error) => {
            ElMessage.error("操作失败")
            console.error(error)
          })
      })
      .catch(() => {})
  })
}

const handlePassOrder = () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  const submitData = {
    ...formData.value,
    extra_data: taskFormData.value
  }
  passOrderApi(submitData)
    .then(() => {
      ElMessage.success("工单已同意")
      // 重置表单，关闭弹窗
      resetForm()
    })
    .catch((error) => {
      ElMessage.error("操作失败，请重试")
      console.log("catch", error)
    })
}

// 驳回确认弹窗
const handleRejectConfirm = async () => {
  try {
    await ElMessageBox.confirm("确定要驳回此工单吗？此操作不可撤销。", "确认驳回", {
      confirmButtonText: "确定驳回",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
      cancelButtonClass: "el-button--default"
    })
    handleReject()
  } catch (error) {
    // 用户取消操作
  }
}

const handleReject = () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 驳回审批
  const submitData = { ...formData.value, ...taskFormData.value }
  rejectOrderApi(submitData)
    .then(() => {
      ElMessage.success("工单已驳回")
      // 重置表单，关闭弹窗
      resetForm()
    })
    .catch((error) => {
      ElMessage.error("操作失败，请重试")
      console.log("catch", error)
    })
}

const handleRevoke = () => {
  if (!props.processInstId) {
    return
  }

  revokeOrderApi({
    instance_id: props.processInstId,
    force: true
  }).then(() => {
    // 重置表单，关闭弹窗
    resetForm()
  })
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  taskFormData.value = {}

  emits("close")
  emits("refresh-data")
}

watch(
  () => [props.templateId, props.processInstId],
  () => {
    if (props.templateId && props.processInstId) {
      handleDetail(props.templateId)
    }

    // 独立触发工单数据获取，不依赖 templateId
    if (props.processInstId) {
      handleGetOrderData(props.processInstId)
    }
  },
  { immediate: true }
)

defineExpose({})
</script>

<style lang="scss" scoped>
.form-container {
  background: transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.form-scroll-area {
  height: 100%;
  overflow-y: auto;
  padding: 0 20px 20px 20px; /* Aligned padding */
  padding-bottom: 80px;
}

.form-section {
  padding: 0 0 10px 0;
  margin-bottom: 0px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #409eff; /* Accent border */
  height: 20px;
  line-height: 20px;

  .el-icon {
    display: none; /* Hide icon for cleaner look, or enable if preferred */
  }

  span {
    font-size: 16px;
  }
}
.form-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;

  .el-button {
    padding: 10px 20px;
    font-size: 15px;
    font-weight: 600;
    height: 40px;
    border-radius: 6px;

    .el-icon {
      font-size: 16px;
      margin-right: 6px;
    }
  }
}
</style>
