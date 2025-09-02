import { computed, ref } from "vue"
import { FormRules } from "element-plus"
import type { Step } from "@/common/types/wizard"

interface UseWizardOptions<T> {
  steps: Step[]
  initialFormData: T
  formRules?: FormRules | (() => FormRules)
  initialStep?: number
}

export function useWizard<T>(options: UseWizardOptions<T>) {
  const { steps, initialFormData, formRules, initialStep = 0 } = options

  const currentStep = ref(initialStep)
  const formData = ref<T>(initialFormData)
  const wizardRef = ref()

  const currentStepComponent = computed(() => steps[currentStep.value]?.component)

  const computedFormRules = computed<FormRules>(() => {
    if (typeof formRules === "function") {
      return formRules()
    }
    return formRules || {}
  })

  const goToNext = () => {
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    }
  }

  const goToPrevious = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      currentStep.value = step
    }
  }

  const updateFormData = (data: Partial<T>) => {
    formData.value = { ...formData.value, ...data }
  }

  const resetForm = () => {
    currentStep.value = initialStep
    formData.value = { ...initialFormData }
  }

  const setForm = (data: T) => {
    currentStep.value = initialStep
    formData.value = { ...data }
  }

  return {
    // 状态
    currentStep,
    formData,
    wizardRef,
    currentStepComponent,
    computedFormRules,

    // 方法
    goToNext,
    goToPrevious,
    goToStep,
    updateFormData,
    resetForm,
    setForm
  }
}
