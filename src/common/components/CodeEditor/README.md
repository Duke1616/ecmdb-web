# CodeEditor 代码编辑器

这是一个基于 CodeMirror 的代码编辑器组件，提供语法高亮、主题切换、语言支持等功能。

## 组件结构

```
CodeEditor/
├── index.vue              # 主入口组件
├── editor.vue             # 编辑器核心实现
├── toolbar.vue            # 工具栏组件
├── preview.vue            # 预览组件
├── themes.ts              # 主题配置
├── languages.ts           # 语言配置
├── lang-code/             # 语言代码模板
│   ├── javascript/
│   ├── python/
│   └── shell/
└── README.md             # 说明文档
```

## 主要功能

- **语法高亮**：支持多种编程语言的语法高亮
- **主题切换**：支持明暗主题切换
- **语言支持**：支持 JavaScript、Python、Shell 等多种语言
- **代码预览**：支持代码预览功能
- **撤销重做**：支持撤销和重做操作
- **格式化**：支持代码格式化

## 使用方法

```vue
<template>
  <CodeMirror
    v-model:code="code"
    v-model:language="language"
    :is-create="false"
  />
</template>

<script setup>
import CodeMirror from '@@/components/CodeEditor'

const code = ref('console.log("Hello, World!")')
const language = ref('javascript')
</script>
```

## 依赖

- `vue-codemirror`：Vue 3 的 CodeMirror 封装
- `@codemirror/view`：CodeMirror 视图层
- `@codemirror/state`：CodeMirror 状态管理