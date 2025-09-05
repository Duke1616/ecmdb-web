# FileManager 文件管理系统

这是一个完整的文件目录管理系统，支持多文件编辑、文件树管理、项目导入导出等功能。

## 组件结构

```
FileManager/
├── index.vue              # 入口组件
├── FileManager.vue        # 主文件管理器组件
├── FileExplorer.vue       # 文件树浏览器
├── FileTreeNode.vue       # 文件树节点（递归组件）
├── MultiFileEditor.vue    # 多文件编辑器
└── README.md             # 说明文档
```

## 主要功能

- **文件树管理**：支持文件夹的创建、删除、重命名
- **多文件编辑**：支持同时打开多个文件进行编辑
- **标签页切换**：点击标签页可以切换编辑的文件
- **拖拽调整**：可以拖拽中间分割条调整文件树和编辑器的宽度
- **项目导入导出**：支持整个项目的导入和导出
- **代码高亮**：基于 CodeMirror 的语法高亮

## 使用方法

```vue
<template>
  <FileManager
    :initialFiles="files"
    :projectName="projectName"
    @update:files="handleFilesUpdate"
    @file-change="handleFileChange"
    @project-save="handleProjectSave"
  />
</template>

<script setup>
import FileManager from "@@/components/FileManager"

const files = ref([])
const projectName = ref("My Project")

const handleFilesUpdate = (newFiles) => {
  files.value = newFiles
}

const handleFileChange = (file) => {
  console.log("当前文件:", file)
}

const handleProjectSave = (files) => {
  console.log("保存项目:", files)
}
</script>
```

## 依赖组件

- `CodeEditor`：代码编辑器核心组件
- `Element Plus`：UI 组件库
