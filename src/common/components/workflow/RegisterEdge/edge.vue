<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    class="property-form"
  >
    <!-- 基本信息 -->
    <FormSection title="基本信息" tooltip="设置连线在流程图中的显示名称" theme-color="slate">
      <template #icon>
        <el-icon><Link /></el-icon>
      </template>
      <el-form-item label="关系名称" prop="name" class="form-item">
        <el-input v-model="propertyForm.name" placeholder="请输入连线关系名称" class="modern-input" />
      </el-form-item>
    </FormSection>

    <!-- 条件配置 -->
    <FormSection title="条件配置" tooltip="定义流程流向该分支所需满足的逻辑表达式" theme-color="blue">
      <template #icon>
        <el-icon><MagicStick /></el-icon>
      </template>
      <el-form-item label="关系表达式" prop="expression" class="form-item">
        <div class="expression-input-wrapper">
          <el-input
            v-model="propertyForm.expression"
            placeholder="支持直接编辑/粘贴表达式，或点击右侧生成"
            class="modern-input with-action"
            clearable
          />
          <el-button @click="handleOpenExpression" class="action-btn" :icon="Operation"> 生成表达式 </el-button>
        </div>
      </el-form-item>
    </FormSection>

    <!-- 使用说明 -->
    <FormSection title="使用说明" theme-color="purple">
      <template #icon>
        <el-icon><InfoFilled /></el-icon>
      </template>
      <div class="edge-tips">
        <div class="tip-card">
          <div class="tip-dot cyan" />
          <div class="tip-text">
            <strong>连线关系</strong>
            <span>定义节点间的拓扑连接，支持条件分支执行</span>
          </div>
        </div>
        <div class="tip-card">
          <div class="tip-dot purple" />
          <div class="tip-text">
            <strong>条件判断</strong>
            <span>通过 SQL 式表达式实现动态流程的分离控制</span>
          </div>
        </div>
        <div v-if="isEasyFlow" class="tip-card">
          <div class="tip-dot amber" />
          <div class="tip-text">
            <strong>EasyFlow 表达式要求</strong>
            <span>底层依赖 SQL 评估，多选字段必须使用 <code>$field in ('值')</code>，不可写 <code>=</code></span>
          </div>
        </div>
        <div v-else class="tip-card">
          <div class="tip-dot indigo" />
          <div class="tip-text">
            <strong>FlowX 表达式特性</strong>
            <span>支持最直观的 <code>$field == '值'</code> 简单表达式，单选/多选自动适配集合匹配</span>
          </div>
        </div>
      </div>
    </FormSection>
  </el-form>

  <!-- 表达式编辑器弹窗 -->
  <FormDialog
    v-model="dialogVisible"
    title="配置连线执行条件"
    subtitle="通过表达式编辑器设置连线的执行条件，支持模板字段和自定义逻辑"
    width="960px"
    :header-icon="Connection"
    confirm-text="确认"
    :show-footer-info="false"
    :full-height="true"
    :before-close="handleExpressionClose"
    @confirm="saveExpression"
    @cancel="dialogVisible = false"
  >
    <div class="expression-dialog-container">
      <Expression ref="expressionRef" :templates="templates" v-model:expression="propertyForm.expression" />
    </div>
  </FormDialog>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import Expression from "./expression.vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { getTemplateByWorkflowIdApi } from "@/api/ticket/template/index.js"
import { template } from "@/api/ticket/template/types/template.js"
import { FormSection } from "../PropertySetting"
import { FormDialog } from "@/common/components/Dialogs"
import { MagicStick, Link, InfoFilled, Operation, Connection } from "@element-plus/icons-vue"

const props = defineProps({
  nodeData: Object,
  lf: Object,
  id: Number,
  flowDetail: { type: Object, default: () => ({}) },
  engineType: { type: String, default: "flowx" }
})

const isEasyFlow = computed(
  () => props.engineType === "easyflow" || props.flowDetail?.engine_type === "easyflow"
)

const emits = defineEmits(["closed"])

const expressionRef = ref<InstanceType<typeof Expression>>()
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  id: [{ required: true, message: "连线类型不能为空" }]
}

const dialogVisible = ref<boolean>(false)
const handleExpressionClose = (done?: () => void) => {
  dialogVisible.value = false
  if (typeof done === "function") {
    done()
  }
}

const propertyForm = ref({
  expression: "",
  is_pass: false,
  name: ""
})

//更新节点属性
const setProperties = () => {
  let cleanExpression = (propertyForm.value.expression || "").trim()

  // 仅在 EasyFlow 引擎下清洗 "==" 为 "="，避免 MySQL 语法报错；FlowX 纯内存引擎原生支持 "=="
  if (isEasyFlow.value && cleanExpression.includes("==")) {
    cleanExpression = cleanExpression.replace(/==/g, "=")
    propertyForm.value.expression = cleanExpression
  }

  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.value.name,
    expression: cleanExpression,
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
  dialogVisible.value = false
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

onMounted(() => {
  propertyForm.value.name = props.nodeData?.properties.name ? props.nodeData?.properties.name : ""
  propertyForm.value.is_pass = props.nodeData?.properties.is_pass ? props.nodeData.properties.is_pass : false
  propertyForm.value.expression = props.nodeData?.properties.expression ? props.nodeData.properties.expression : ""
})

defineExpose({
  confirmFunc
})
</script>
<style scoped lang="scss">
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

// ── 通用控件 ────────────────────────────────────────────────────────────
.modern-input {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #ffffff !important;
    border-radius: 8px;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    padding: 2px 10px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #94a3b8 !important;
    }

    &.is-focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 1px #6366f1 !important;
    }
  }

  &.with-action {
    :deep(.el-input__wrapper) {
      border-right: none;
      border-radius: 6px 0 0 6px;
    }
  }
}

.form-item {
  margin-bottom: 0px;
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}

// ── 表达式输入增强 ──────────────────────────────────────────────────────
.expression-input-wrapper {
  display: flex;
  width: 100%;
  align-items: stretch;

  .modern-input {
    flex: 1;
    height: 40px; // 强制统一高度

    &.with-action {
      :deep(.el-input__wrapper) {
        border-right: none;
        border-radius: 8px 0 0 8px;
        height: 100%;
        box-sizing: border-box;
      }
    }
  }

  .action-btn {
    height: 40px; // 与输入框对齐
    border-radius: 0 8px 8px 0;
    border: 1px solid #cbd5e1;
    border-left: none;
    background: #f8fafc;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    padding: 0 16px;
    margin: 0;
    transition: all 0.2s;
    box-sizing: border-box;

    &:hover {
      background: #f1f5f9;
      color: #6366f1;
      border-color: #cbd5e1;
    }

    &:focus {
      border-color: #6366f1;
      background: #eff6ff;
    }

    :deep(.el-icon) {
      margin-right: 4px;
    }
  }
}

// ── 说明卡片 ────────────────────────────────────────────────────────────
.edge-tips {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #e2e8f0;
    transform: translateX(4px);
    background: #f8fafc;
  }

  .tip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;

    &.cyan {
      background: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }
    &.purple {
      background: #a855f7;
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
    &.amber {
      background: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }
    &.indigo {
      background: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }

  .tip-text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-size: 13px;
      color: #1e293b;
      font-weight: 700;
    }

    span {
      font-size: 11px;
      color: #94a3b8;
    }
  }
}

.expression-dialog-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 0 20px 4px;
  box-sizing: border-box;
}
</style>
