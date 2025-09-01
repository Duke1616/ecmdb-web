export interface Step {
  title: string
  description: string
  icon: any
  component: any
}

export interface WizardProps<T = any> {
  steps: Step[]
  formData: T
  formRules?: FormRules | (() => FormRules)
  initialStep?: number
}

export interface WizardEmits {
  "update:formData": [data: any]
  next: []
  previous: []
  close: []
  save: []
}
