<template>
  <div class="form-container">
    <!-- 表单信息 -->
    <div class="form-section">
      <div class="section-title">
        <el-icon><Document /></el-icon>
        <span>表单信息</span>
      </div>

      <!-- 如果是自己的工单，支持修改 -->
      <div v-if="props.action != 'my-Start'">
        <FormCreate :rule="rule" :option="options" v-model="data" :disabled="props.action != 'my'" v-model:api="fApi" />
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
</template>

<script setup lang="ts">
import { detailTemplateApi } from "@/api/template"
import formCreate, { FormRule } from "@form-create/element-ui"
import { ref, watch } from "vue"
import { getOrderByProcessInstIdApi, passOrderApi, rejectOrderApi, revokeOrderApi } from "@/api/order"
import { passOrder } from "@/api/order/types/order"
import { cloneDeep } from "lodash-es"
import { FormInstance, Options, ElMessageBox, ElMessage } from "element-plus"
import { Document, Setting, EditPen, RefreshLeft, Check, Close } from "@element-plus/icons-vue"

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
const rule = ref<FormRule[]>()
const options = ref<FormRule>()

const DEFAULT_FORM_DATA: passOrder = {
  task_id: 0,
  comment: ""
}
const formData = ref<passOrder>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

const handleDetail = (id: number, processInstId: number) => {
  detailTemplateApi(id)
    .then((res) => {
      // 工单模版
      options.value = formCreate.parseJson(res.data.options) as unknown as Options
      options.value.submitBtn = false
      rule.value = formCreate.parseJson(res.data.rules)

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

// 同意确认弹窗
const handlePassConfirm = async () => {
  try {
    await ElMessageBox.confirm("确定要同意此工单吗？此操作不可撤销。", "确认同意", {
      confirmButtonText: "确定同意",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--primary",
      cancelButtonClass: "el-button--default"
    })
    handlePass()
  } catch (error) {
    // 用户取消操作
  }
}

const handlePass = () => {
  if (props.taskId) {
    formData.value.task_id = props.taskId
  }

  // 同意审批
  passOrderApi(formData.value)
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
  rejectOrderApi(formData.value)
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
.form-container {
  padding: 20px;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;

  .el-icon {
    font-size: 18px;
    color: #409eff;
  }
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;

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
