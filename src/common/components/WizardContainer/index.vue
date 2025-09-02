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
      <el-form ref="formRef" :model="formData" :rules="computedFormRules" label-width="auto" class="wizard-form">
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
import { Check } from "@element-plus/icons-vue"
import { computed, ref } from "vue"
import { FormInstance, FormRules } from "element-plus"
import type { WizardProps } from "@/common/types/wizard"

const CheckIcon = Check

interface Props extends WizardProps {}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 0
})

const emits = defineEmits<{
  "update:formData": [data: any]
  next: []
  previous: []
  close: []
  save: []
}>()

const currentStep = ref(props.initialStep)
const formRef = ref<FormInstance | null>(null)

const currentStepComponent = computed(() => props.steps[currentStep.value]?.component)

const computedFormRules = computed<FormRules>(() => {
  if (typeof props.formRules === "function") {
    return props.formRules()
  }
  return props.formRules || {}
})

const goToNext = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
}

const goToPrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const updateFormData = (data: any) => {
  emits("update:formData", data)
}

const onClosed = () => {
  emits("close")
}

const save = () => {
  emits("save")
}

// 暴露方法给父组件
defineExpose({
  currentStep,
  formRef,
  goToNext,
  goToPrevious,
  setStep: (step: number) => {
    if (step >= 0 && step < props.steps.length) {
      currentStep.value = step
    }
  }
})
</script>

<style lang="scss" scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000; /* 确保在菜单栏之上 */
  background: #fff; /* 确保完全覆盖底层内容 */
}

.wizard-header {
  padding: 20px 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
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

.wizard-form {
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
</style>
