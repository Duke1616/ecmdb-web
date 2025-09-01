<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <div class="step-indicator">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{
            'step-active': currentStep === index,
            'step-completed': currentStep > index
          }"
        >
          <div class="step-circle">
            <component v-if="currentStep > index" :is="CheckIcon" class="step-check-icon" />
            <component v-else :is="step.icon" class="step-icon" />
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description">{{ step.description }}</div>
          </div>
          <div v-if="index < steps.length - 1" class="step-connector" />
        </div>
      </div>
    </div>
    <div class="wizard-body">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" class="wizard-form">
        <component
          :is="currentStepComponent"
          :key="currentStep"
          :formData="formData"
          @update:formData="updateFormData"
          @next="goToNext"
          @previous="goToPrevious"
          @close="onClosed"
          @save="save"
          class="step-content"
        />
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Check } from "@element-plus/icons-vue"
import { computed, ref } from "vue"
import Info from "./info.vue"
import Designer from "./designer.vue"
import { createOrUpdateTemplateReq, template } from "@/api/template/types/template"
import { cloneDeep } from "lodash-es"
import { createTemplateApi, updateTemplateApi } from "@/api/template"
import { ElMessage, FormInstance, FormRules } from "element-plus"

const CheckIcon = Check

const steps = [
  {
    title: "填写模板信息",
    description: "基本信息设置",
    icon: Edit,
    component: Info
  },
  {
    title: "设计表单结构",
    description: "可视化表单设计",
    icon: Check,
    component: Designer
  }
]

const currentStep = ref(0)

const currentStepComponent = computed(() => steps[currentStep.value]?.component)

const formData = ref<createOrUpdateTemplateReq>({
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined,
  icon: "",
  group_id: undefined,
  workflow_id: undefined
})

const formRef = ref<FormInstance | null>(null)

const formRules = computed<FormRules>(() => {
  if (currentStep.value === 0) {
    return {
      name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
      group_id: [{ required: true, message: "请选择所属分组", trigger: "change" }],
      workflow_id: [{ required: true, message: "请选择关联流程", trigger: "change" }],
      icon: [{ required: true, message: "请选择应用图标", trigger: "change" }]
    }
  }
  return {}
})

const goToNext = () => {
  if (currentStep.value === 0) {
    formRef.value?.validate((valid: boolean, fields: any) => {
      if (!valid) {
        return console.error("表单校验不通过", fields)
      }
      goToStep(currentStep.value + 1)
    })
  } else {
    goToStep(currentStep.value + 1)
  }
}

const goToPrevious = () => {
  goToStep(currentStep.value - 1)
}

const goToStep = (stepIndex: number) => {
  if (stepIndex >= 0 && stepIndex < steps.length) {
    currentStep.value = stepIndex
  } else {
    console.log(`[v0] Invalid step index: ${stepIndex}`)
  }
}

const updateFormData = (newFormData: createOrUpdateTemplateReq) => {
  try {
    formData.value = { ...formData.value, ...newFormData }
  } catch (error) {
    console.error("Error updating form data:", error)
  }
}

const save = () => {
  const api = formData.value.id === undefined ? createTemplateApi : updateTemplateApi
  api(formData.value)
    .then(() => {
      onClosed()
      ElMessage.success("保存成功")
      emits("callback")
    })
    .catch((error) => {
      console.log("catch", error)
      ElMessage.error("保存失败，请重试")
    })
    .finally(() => {})
}

const onClosed = () => {
  emits("close", false)
}

const emits = defineEmits(["close", "callback"])

defineExpose({
  setCreateForm: () => {
    currentStep.value = 0
    formData.value = cloneDeep({
      id: undefined,
      name: "",
      desc: "",
      rules: undefined,
      options: undefined,
      icon: "",
      group_id: undefined,
      workflow_id: undefined
    })
  },
  setUpdateForm: (row: template) => {
    currentStep.value = 0
    formData.value = { ...formData.value, ...row }
  }
})
</script>

<style lang="scss" scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  height: 100vh;
}

.wizard-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.step-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 200px;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
}

.step-item.step-active .step-circle {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.step-item.step-completed .step-circle {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.step-icon {
  width: 16px;
  height: 16px;
}

.step-check-icon {
  width: 16px;
  height: 16px;
}

.step-title {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  margin-bottom: 2px;
}

.step-item.step-active .step-title {
  color: #667eea;
}

.step-description {
  font-size: 10px;
  color: #6b7280;
}

.step-connector {
  position: absolute;
  top: 16px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.step-item.step-completed .step-connector {
  background: #667eea;
}

.wizard-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.step-content {
  flex: 1;
  display: flex;
  text-align: center;
  flex-direction: column;
  padding: 10px 0px;
  min-height: 0;
}

.wizard-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .wizard-header {
    padding: 0.5rem 1rem;
  }

  .step-indicator {
    max-width: 600px;
  }

  .step-item {
    max-width: 150px;
  }

  .step-title {
    font-size: 11px;
  }

  .step-description {
    font-size: 9px;
  }
}
</style>
