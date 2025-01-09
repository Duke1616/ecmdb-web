<template>
  <div>
    <el-form ref="formRef" :model="propertyForm" :inline-message="true" :rules="formRules" label-position="top">
      <el-form-item label="关系名称" prop="name">
        <el-input v-model="propertyForm.name" type="name" />
      </el-form-item>
      <el-form-item prop="expression">
        <template #label>
          <div style="display: flex; align-items: center; justify-content: space-between">
            <span>关系表达式</span>
            <el-button type="primary" size="small" @click="handleExpression">生成表达式</el-button>
          </div>
        </template>
        <el-input v-model="propertyForm.expression" type="expression" />
      </el-form-item>
    </el-form>
    <el-dialog
      v-model="dialogVisible"
      :fullscreen="true"
      :modal="true"
      :lock-scroll="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :before-close="handleExpressionClose"
    >
      <Expression :templates="templates" />
      <!-- <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false"> 确认 </el-button>
        </div>
      </template> -->
    </el-dialog>
    <div class="mt15">
      <el-button @click="cancelFunc"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc"> 确定 </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import Expression from "./expression.vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { getTemplateByWorkflowIdApi } from "@/api/template"
import { template } from "@/api/template/types/template"

const props = defineProps({
  nodeData: Object,
  lf: Object,
  id: Number
})

const emits = defineEmits(["closed"])
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  id: [{ required: true, message: "连线类型不能为空" }]
}

const dialogVisible = ref<boolean>(false)
const handleExpressionClose = () => {
  dialogVisible.value = false
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

const templates = ref<template[]>([])
const getTemplateByWorkflowId = async (workflow_id: number) => {
  try {
    const { data } = await getTemplateByWorkflowIdApi(workflow_id)
    templates.value = data.templates
    return data.templates.length > 0
  } catch {
    templates.value = []
    return false
  }
}

const handleExpression = async () => {
  if (props.id === undefined) {
    ElMessage.warning("创建流程无法使用此功能")
    return
  }

  const hasTemplates = await getTemplateByWorkflowId(props.id)

  if (hasTemplates) {
    dialogVisible.value = true
  } else {
    ElMessage.warning("没有可用数据，请先通过模版绑定流程")
  }
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
