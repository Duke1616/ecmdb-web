# Workflow Common Components

这个目录包含了工作流属性配置对话框的通用组件，用于统一设计风格和减少代码重复。

## 组件列表

### PropertyContainer
通用的属性对话框容器，包含头部、内容和底部按钮区域。

**Props:**
- `title: string` - 对话框标题
- `subtitle: string` - 对话框副标题  
- `iconName: string` - 图标名称
- `theme: 'green' | 'blue' | 'orange' | 'purple' | 'cyan'` - 主题颜色
- `showFooter: boolean` - 是否显示底部按钮区域
- `dialogClass: string` - 自定义对话框类名
- `headerClass: string` - 自定义头部类名

**Events:**
- `@confirm` - 确认按钮点击事件
- `@cancel` - 取消按钮点击事件

**Slots:**
- `default` - 主要内容区域
- `footer` - 底部按钮区域（可选）

### FormSection
表单区域组件，提供统一的背景色、圆角和标题样式。

**Props:**
- `title: string` - 区域标题
- `icon: string` - 标题图标（默认: '📝'）

**Slots:**
- `default` - 表单内容

### FormHelp
帮助文本组件，提供统一的帮助信息样式。

**Props:**
- `text: string` - 帮助文本内容

## 使用示例

### 基础用法

```vue
<template>
  <PropertyContainer
    title="节点配置"
    subtitle="配置节点属性"
    icon-name="user"
    theme="blue"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <el-form ref="formRef" :model="form" :rules="rules">
      <FormSection title="基本信息" icon="📝">
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入节点名称" />
          <FormHelp text="节点名称用于标识审批步骤" />
        </el-form-item>
      </FormSection>
      
      <FormSection title="配置选项" icon="⚙️">
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="form.enabled" />
          <FormHelp text="开启后该节点将参与工作流执行" />
        </el-form-item>
      </FormSection>
    </el-form>
  </PropertyContainer>
</template>

<script setup lang="ts">
import { PropertyContainer, FormSection, FormHelp } from '@/common/components/workflow/PropertySetting'

const form = reactive({
  name: ''
})

const handleConfirm = () => {
  // 处理确认逻辑
}

const handleCancel = () => {
  // 处理取消逻辑
}
</script>
```

### 自定义底部按钮

```vue
<template>
  <PropertyContainer
    title="自定义对话框"
    subtitle="带自定义按钮"
    icon-name="setting"
    theme="purple"
  >
    <!-- 内容 -->
    
    <template #footer>
      <el-button @click="handleSave">保存</el-button>
      <el-button @click="handlePreview">预览</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </PropertyContainer>
</template>
```

## 主题颜色

- `green`: 绿色主题 (#10b981) - 适用于开始节点
- `blue`: 蓝色主题 (#3b82f6) - 适用于用户节点  
- `orange`: 橙色主题 (#f59e0b) - 适用于条件节点
- `purple`: 紫色主题 (#8b5cf6) - 适用于自动化节点
- `cyan`: 青色主题 (#06b6d4) - 适用于连线配置

## 迁移指南

### 从现有组件迁移

1. **替换容器结构**：
   ```vue
   <!-- 旧代码 -->
   <div class="property-dialog">
     <div class="dialog-header">...</div>
     <div class="dialog-content">...</div>
     <div class="dialog-footer">...</div>
   </div>
   
   <!-- 新代码 -->
   <PropertyContainer title="..." subtitle="..." icon-name="..." theme="...">
     <!-- 内容 -->
   </PropertyContainer>
   ```

2. **保留现有表单结构**：
   - 保持原有的 `el-form`、`el-form-item` 等结构
   - 保持原有的样式类名和自定义组件
   - 只需要替换外层的容器结构

## 注意事项

1. 组件使用 TypeScript 编写，提供完整的类型支持
2. 样式使用 SCSS 编写，支持主题定制
3. 使用 `v-bind` 实现动态主题颜色
4. 遵循 Vue 3 Composition API 最佳实践
5. 只抽取了头部和底部按钮，保持内容区域的灵活性
