# WizardContainer 通用向导容器组件

## 概述

`WizardContainer` 是一个通用的多步骤向导容器组件，用于创建分步骤的表单流程。它提供了完整的步骤指示器、步骤内容容器和通用样式。

## 特性

- 🎯 步骤指示器：显示当前步骤和完成状态
- 🔄 步骤导航：支持上一步、下一步操作
- 📝 表单集成：与 Element Plus 表单组件无缝集成
- 🎨 统一样式：提供一致的视觉体验
- 📱 响应式设计：支持不同屏幕尺寸
- 🔧 高度可定制：支持自定义步骤配置和验证规则

## 使用方法

### 基本用法

```vue
<template>
  <WizardContainer
    :steps="steps"
    :formData="formData"
    :formRules="formRules"
    @update:formData="updateFormData"
    @next="goToNext"
    @previous="goToPrevious"
    @close="onClosed"
    @save="save"
    ref="wizardRef"
  />
</template>

<script setup lang="ts">
import WizardContainer from "@/common/components/WizardContainer/index.vue"

const steps = [
  {
    title: "第一步",
    description: "第一步描述",
    icon: EditIcon,
    component: StepOneComponent
  },
  {
    title: "第二步",
    description: "第二步描述",
    icon: CheckIcon,
    component: StepTwoComponent
  }
]

const formData = ref({})
const wizardRef = ref()

// 事件处理
const updateFormData = (data) => {
  formData.value = { ...formData.value, ...data }
}

const goToNext = () => {
  wizardRef.value?.goToNext()
}

const goToPrevious = () => {
  wizardRef.value?.goToPrevious()
}
</script>
```

### 步骤配置

每个步骤需要包含以下属性：

```typescript
interface Step {
  title: string        // 步骤标题
  description: string  // 步骤描述
  icon: any           // 步骤图标组件
  component: any      // 步骤内容组件
}
```

### 表单验证规则

支持静态规则或动态规则函数：

```typescript
// 静态规则
const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
}

// 动态规则函数
const formRules = () => {
  if (currentStep === 0) {
    return { name: [{ required: true, message: "请输入名称", trigger: "blur" }] }
  }
  return {}
}
```

## 事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| `update:formData` | 表单数据更新 | `data: any` |
| `next` | 下一步 | - |
| `previous` | 上一步 | - |
| `close` | 关闭 | - |
| `save` | 保存 | - |

## 暴露的方法

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `goToNext()` | 跳转到下一步 | - |
| `goToPrevious()` | 跳转到上一步 | - |
| `setStep(step: number)` | 设置当前步骤 | `step: number` |
| `currentStep` | 当前步骤索引 | - |
| `formRef` | 表单引用 | - |

## 样式定制

组件使用 SCSS 编写，支持通过 CSS 变量和深度选择器进行样式定制：

```scss
:deep(.wizard-container) {
  // 自定义样式
}

:deep(.step-indicator) {
  // 自定义步骤指示器样式
}
```

## 相关组件和工具

- `useFormHandler`: 表单处理逻辑组合式函数
- `FormActions`: 表单操作按钮组件
- `useWizard`: 向导逻辑组合式函数
- `wizard-steps.ts`: 通用步骤配置常量
- `form-rules.ts`: 通用表单验证规则

## 最佳实践

1. **步骤数量**: 建议控制在 3-5 个步骤内，避免用户疲劳
2. **步骤命名**: 使用清晰、简洁的标题和描述
3. **图标选择**: 选择语义明确的图标，提升用户体验
4. **表单验证**: 在第一步进行必要的表单验证
5. **数据同步**: 确保步骤间数据正确传递和同步
