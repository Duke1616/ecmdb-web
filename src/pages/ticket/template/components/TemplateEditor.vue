<template>
  <div v-if="modelValue" class="template-editor">
    <div class="editor-header">
      <div class="step-indicator">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item"
          :class="{ 'is-active': currentStep === index, 'is-completed': currentStep > index }"
        >
          <div class="step-circle">
            <el-icon v-if="currentStep > index"><Check /></el-icon>
            <el-icon v-else><component :is="step.icon" /></el-icon>
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description">{{ step.description }}</div>
          </div>
          <div v-if="index < steps.length - 1" class="step-connector" />
        </div>
      </div>
    </div>

    <div class="editor-body">
      <TemplateInfoForm
        v-if="currentStep === TemplateEditorStep.Info"
        :form-data="formData"
        @update:form-data="emit('update:formData', $event)"
        @next="goNext"
        @close="confirmClose"
      />
      <TemplateDesigner
        v-else
        :form-data="formData"
        @update:form-data="emit('update:formData', $event)"
        @previous="goPrevious"
        @save="emit('save')"
        @close="confirmClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue"
import { Check, Document, EditPen } from "@element-plus/icons-vue"
import { ElMessageBox } from "element-plus"
import TemplateDesigner from "./TemplateDesigner.vue"
import TemplateInfoForm from "./TemplateInfoForm.vue"
import { TemplateEditorStep } from "../types"
import type { createOrUpdateTemplateReq } from "@/api/ticket/template/types/template"

const props = defineProps<{
  modelValue: boolean
  formData: createOrUpdateTemplateReq
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "update:formData", value: createOrUpdateTemplateReq): void
  (event: "close"): void
  (event: "save"): void
}>()

const currentStep = defineModel<TemplateEditorStep>("step", {
  default: TemplateEditorStep.Info
})

const steps = computed(() => [
  {
    key: TemplateEditorStep.Info,
    title: "填写模板信息",
    description: "名称、分组、流程和图标",
    icon: Document
  },
  {
    key: TemplateEditorStep.Designer,
    title: "设计表单结构",
    description: "可视化配置表单字段",
    icon: EditPen
  }
])

const goNext = () => {
  currentStep.value = TemplateEditorStep.Designer
}

const goPrevious = () => {
  currentStep.value = TemplateEditorStep.Info
}

const emitClose = () => {
  emit("close")
  emit("update:modelValue", false)
}

const confirmClose = async () => {
  try {
    const isDesignStep = currentStep.value === TemplateEditorStep.Designer
    const content = isDesignStep
      ? "确定要取消当前操作吗？已设计的表单将不会保存。"
      : "确定要取消当前操作吗？已填写的基本信息将不会保存。"

    await ElMessageBox.confirm(content, "确认取消", {
      confirmButtonText: "确定取消",
      cancelButtonText: isDesignStep ? "继续设计" : "继续填写",
      type: "warning",
      confirmButtonClass: "el-button--danger",
      cancelButtonClass: "el-button--default",
      customClass: "custom-confirm-dialog",
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      center: true,
      roundButton: true,
      dangerouslyUseHTMLString: true,
      message: `
        <div class="custom-confirm-content">
          <div class="confirm-icon">${isDesignStep ? "🎨" : "📝"}</div>
          <div class="confirm-text">${content}</div>
        </div>
      `,
      beforeClose: (_action, _instance, done) => {
        setTimeout(() => {
          const messageBox = document.querySelector(".custom-confirm-dialog")
          messageBox?.classList.add("custom-confirm-dialog")
        }, 0)
        done()
      }
    })
    emitClose()
  } catch {
    // 用户选择继续填写/设计
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) currentStep.value = TemplateEditorStep.Info
  }
)
</script>

<style scoped lang="scss">
.template-editor {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.editor-header {
  flex-shrink: 0;
  padding: 18px 0;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 760px;
  margin: 0 auto;
}

.step-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  max-width: 260px;
}

.step-circle {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-bottom: 8px;
  color: #64748b;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.step-item.is-active .step-circle,
.step-item.is-completed .step-circle {
  color: #fff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.step-content {
  text-align: center;
}

.step-title {
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.step-description {
  font-size: 12px;
  color: #64748b;
}

.step-item.is-active .step-title {
  color: #2563eb;
}

.step-connector {
  position: absolute;
  top: 16px;
  right: -40%;
  left: 60%;
  height: 2px;
  background: #e2e8f0;
}

.step-item.is-completed .step-connector {
  background: #3b82f6;
}

.editor-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
