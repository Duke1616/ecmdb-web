# useFormHandler 使用说明

## 概述

`useFormHandler` 是一个简单、实用的表单处理组合式函数，专门为流程创建页面设计。它提供了基本的表单数据管理、页面导航和确认对话框功能。

## 特性

- **简单易用**：API 简洁，学习成本低
- **页面类型配置**：支持 `info`、`lf`、`setting` 三种页面类型
- **自动数据同步**：自动更新父组件的数据
- **统一确认对话框**：每种页面都有对应的取消确认提示

## 基本用法

### 1. 导入和配置

```typescript
import { useFormHandler } from "./composables/useFormHandler"

const {
  localFormData,
  updateFormData,
  next,
  previous,
  save,
  close,
  setFormData
} = useFormHandler(props.formData, emits, "info")
```

### 2. 页面类型

#### Info 页面（基本信息）
```typescript
useFormHandler(props.formData, emits, "info")
```

#### LF 页面（流程设计）
```typescript
useFormHandler(props.formData, emits, "lf")
```

#### Setting 页面（配置设置）
```typescript
useFormHandler(props.formData, emits, "setting")
```

## 返回的属性和方法

### 数据属性
- `localFormData`: 本地表单数据引用

### 方法
- `updateFormData()`: 更新表单数据并同步到父组件
- `next()`: 下一步（自动保存数据）
- `previous()`: 上一步（自动保存数据）
- `save()`: 保存（自动保存数据）
- `close()`: 关闭确认对话框
- `setFormData(newData)`: 设置表单数据

## 事件处理

### 基本事件
```typescript
const emits = defineEmits(["update:formData", "next", "previous", "close", "save"])

// 在模板中使用
<FormActions 
  @next="next" 
  @previous="previous" 
  @save="save" 
  @cancel="close" 
/>
```

## 最佳实践

### 1. 数据同步
```typescript
// 监听父组件数据变化
watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)
```

### 2. 表单验证
```typescript
// 在 next 方法中手动验证
const handleNext = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    // 验证通过，调用 next
    next()
  } catch (error) {
    console.log("表单校验失败:", error)
  }
}
```

### 3. 数据保存
```typescript
// 自动保存数据变更
const handleInputChange = () => {
  updateFormData()
}
```

## 注意事项

1. **页面类型**：确保设置正确的页面类型，这会影响确认对话框的文案
2. **事件发射器**：确保 `emits` 包含必要的事件方法
3. **表单验证**：表单验证需要在调用 `next` 之前手动执行
4. **数据同步**：使用 `setFormData` 来同步父组件的数据变化

## 设计理念

这个版本的 `useFormHandler` 遵循以下设计原则：

- **简单优先**：只提供必要的功能，避免过度设计
- **职责单一**：专注于表单数据管理和事件发射
- **易于理解**：API 设计直观，代码可读性强
- **灵活使用**：不强制特定的验证或保存逻辑，让开发者自由控制
