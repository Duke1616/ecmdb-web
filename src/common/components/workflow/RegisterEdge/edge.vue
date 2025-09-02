<template>
  <PropertyContainer
    title="连线配置"
    subtitle="配置工作流节点间的连接关系和条件"
    icon-name="edge"
    theme="cyan"
    @confirm="confirmFunc"
    @cancel="cancelFunc"
  >
    <el-form
      ref="formRef"
      :model="propertyForm"
      :inline-message="true"
      :rules="formRules"
      label-position="top"
      class="property-form"
    >
      <FormSection title="基本信息" icon="🔗">
        <el-form-item label="关系名称" prop="name" class="form-item">
          <el-input v-model="propertyForm.name" placeholder="请输入连线关系名称" class="modern-input" />
          <FormHelp text="连线名称用于标识节点间的关系，建议使用描述性名称" />
        </el-form-item>
      </FormSection>

      <FormSection title="条件配置" icon="⚙️">
        <el-form-item label="关系表达式" prop="expression" class="form-item">
          <el-input
            v-model="propertyForm.expression"
            placeholder="请点击右侧按钮生成表达式"
            class="modern-input"
            readonly
          >
            <template #append>
              <el-button @click="handleOpenExpression" class="expression-btn" :icon="Setting"> 生成表达式 </el-button>
            </template>
          </el-input>
          <FormHelp text="通过表达式编辑器配置连线的执行条件" />
        </el-form-item>
      </FormSection>

      <FormSection title="使用说明" icon="💡">
        <div class="edge-tips">
          <div class="tip-item">
            <div class="tip-icon">🔗</div>
            <div class="tip-content">
              <h4 class="tip-title">连线关系</h4>
              <p class="tip-desc">定义节点间的连接关系，支持条件分支和并行执行</p>
            </div>
          </div>

          <div class="tip-item">
            <div class="tip-icon">⚡</div>
            <div class="tip-content">
              <h4 class="tip-title">条件判断</h4>
              <p class="tip-desc">通过表达式设置连线的执行条件，实现动态流程控制</p>
            </div>
          </div>
        </div>
      </FormSection>
    </el-form>

    <!-- 表达式编辑器弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :fullscreen="false"
      :modal="true"
      :lock-scroll="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :show-close="false"
      :before-close="handleExpressionClose"
      :width="'70%'"
      align-center
      destroy-on-close
      class="expression-dialog"
    >
      <div class="expression-content">
        <div class="expression-header">
          <div class="header-info">
            <h3 class="content-title">配置连线执行条件</h3>
            <p class="content-subtitle">通过表达式编辑器设置连线的执行条件，支持模板字段和自定义逻辑</p>
          </div>
        </div>

        <div class="expression-body">
          <Expression ref="expressionRef" :templates="templates" :expression="propertyForm.expression" />
        </div>
      </div>

      <template #footer>
        <div class="expression-footer">
          <el-button @click="dialogVisible = false" class="footer-btn footer-btn-cancel">取消</el-button>
          <el-button type="primary" @click="saveExpression()" class="footer-btn footer-btn-confirm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </PropertyContainer>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import Expression from "./expression.vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { getTemplateByWorkflowIdApi } from "@/api/template"
import { template } from "@/api/template/types/template"
import { PropertyContainer, FormSection, FormHelp } from "../PropertySetting"
import { Setting } from "@element-plus/icons-vue"

const props = defineProps({
  nodeData: Object,
  lf: Object,
  id: Number
})

const emits = defineEmits(["closed"])

const expressionRef = ref<InstanceType<typeof Expression>>()
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

const handleOpenExpression = async () => {
  if (props.id === undefined) {
    ElMessage.warning("创建流程时无法使用此功能，请优先模版绑定流程")
    return
  }

  const hasTemplates = await getTemplateByWorkflowId(props.id)
  if (hasTemplates) {
    dialogVisible.value = true
  } else {
    ElMessage.warning("未被模版绑定的流程无法使用此功能")
  }
}

const saveExpression = () => {
  const expression = expressionRef.value?.getExpression()

  dialogVisible.value = false
  if (expression === undefined) {
    return
  }

  propertyForm.value.expression = expression.value
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
<style scoped lang="scss">
.form-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
}

.expression-btn {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
  border: none !important;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: white !important;
  transition: all 0.3s ease;
  height: 100%;
  border-radius: 0 8px 8px 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px;

  &:hover {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  }

  // 确保图标颜色也是白色
  :deep(.el-icon) {
    color: white !important;
  }
}

.modern-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #06b6d4;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }

  :deep(.el-input-group__append) {
    background: transparent;
    border: none;
    padding: 0;
  }
}

.form-help {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #06b6d4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.edge-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #ecfeff;
  border: 1px solid #22d3ee;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: #cffafe;
    border-color: #06b6d4;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
  }

  .tip-icon {
    font-size: 20px;
    color: #0891b2;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .tip-content {
    flex: 1;

    .tip-title {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 600;
      color: #0e7490;
    }

    .tip-desc {
      margin: 0;
      font-size: 12px;
      color: #0891b2;
      line-height: 1.4;
    }
  }
}

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border-color: #06b6d4;

  &:hover {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
    border-color: #0891b2;
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  }
}

:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: none;

  :deep(.el-dialog__header) {
    display: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    background: transparent;
    min-height: 400px;
    max-height: 85vh;
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    background: transparent;
  }
}

:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

// 表达式编辑器内容样式
.expression-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;

  .expression-header {
    padding: 1.5rem 1.5rem 1rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;

    .header-info {
      .content-title {
        margin: 0 0 6px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.5;
      }

      .content-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.4;
        font-weight: 500;
      }
    }
  }

  .expression-body {
    flex: 1;
    background: #ffffff;
    overflow: hidden;
    min-height: 0;
    padding: 0;
  }
}

.expression-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表达式弹窗专用样式 */
:deep(.expression-dialog) {
  .el-dialog {
    display: flex;
    flex-direction: column;
  }

  .el-dialog__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
