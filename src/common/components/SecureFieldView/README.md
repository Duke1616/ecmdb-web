# SecureFieldView 安全字段查看组件

一个用于安全字段查看的通用组件，支持查看、复制和自动关闭功能。

## 功能特性

- 🔒 安全内容查看
- 📋 一键复制到剪贴板
- ⏰ 自动关闭倒计时
- 🎨 美观的 UI 设计
- 📱 响应式布局
- 🔐 支持隐藏敏感内容
- 📄 支持仅复制模式

## 使用方法

### 基础用法

```vue
<template>
  <SecureFieldView
    :content="secureContent"
    :is-displaying="isDisplaying"
    @view-click="handleViewClick"
    @display-change="handleDisplayChange"
    @copy="handleCopy"
  />
</template>

<script setup>
import { ref } from 'vue'
import SecureFieldView from '@/common/components/SecureFieldView/index.vue'

const secureContent = ref('')
const isDisplaying = ref(false)

const handleViewClick = () => {
  // 处理查看按钮点击
  // 通常在这里调用 API 获取安全数据
  isDisplaying.value = true
}

const handleDisplayChange = (displaying) => {
  // 处理显示状态变化
  isDisplaying.value = displaying
}

const handleCopy = (content) => {
  // 处理复制事件
  console.log('复制内容:', content)
}
</script>
```

### 高级用法

```vue
<template>
  <SecureFieldView
    :content="secureContent"
    :is-displaying="isDisplaying"
    :auto-close-time="5"
    :enable-auto-close="true"
    @view-click="handleViewClick"
    @display-change="handleDisplayChange"
    @copy="handleCopy"
  />
</template>
```

### 隐藏敏感内容模式

```vue
<template>
  <SecureFieldView
    :content="secureContent"
    :is-displaying="isDisplaying"
    :show-content="false"
    @view-click="handleViewClick"
    @display-change="handleDisplayChange"
    @copy="handleCopy"
  />
</template>
```

### 仅复制模式

```vue
<template>
  <SecureFieldView
    :content="secureContent"
    :copy-only="true"
    @copy="handleCopy"
  />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| content | string | '' | 安全内容 |
| isDisplaying | boolean | false | 是否正在显示内容 |
| autoCloseTime | number | 3 | 自动关闭时间（秒） |
| enableAutoClose | boolean | true | 是否启用自动关闭 |
| showContent | boolean | true | 是否显示敏感内容 |
| copyOnly | boolean | false | 是否只显示复制按钮 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| view-click | - | 点击查看按钮时触发 |
| display-change | isDisplaying: boolean | 显示状态变化时触发 |
| copy | content: string | 复制内容时触发 |

## 样式定制

组件使用 scoped CSS，可以通过以下 CSS 变量进行定制：

```scss
.secure-field-view {
  --secure-button-color: #409eff;
  --secure-content-bg: #f8f9fa;
  --secure-text-color: #495057;
  --countdown-color: #6c757d;
}
```

## 注意事项

1. 组件会自动处理剪贴板复制，支持现代浏览器的 `navigator.clipboard` API 和降级方案
2. 自动关闭功能使用 `setInterval` 实现，组件销毁时会自动清理定时器
3. 建议将显示状态存储在数据对象中，以便在页面切换时保持状态
