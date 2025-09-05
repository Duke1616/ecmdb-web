# CodeMirror 文件管理系统

这是一个基于 CodeMirror 的多文件代码编辑器系统，支持文件目录层级管理、多文件编辑、项目导入导出等功能。

## 组件结构

### 核心组件

1. **FileExplorer.vue** - 左侧文件树组件
   - 文件/文件夹的增删改查
   - 右键菜单操作
   - 文件类型图标显示
   - 拖拽排序（可扩展）

2. **MultiFileCodeEditor.vue** - 右侧多文件代码编辑器
   - 文件标签页管理
   - 代码编辑器集成
   - 文件切换和内容同步
   - 代码格式化和清空功能

3. **FileManager.vue** - 文件管理器主组件
   - 整合文件树和代码编辑器
   - 文件操作逻辑处理
   - 项目数据管理
   - 导入导出功能

### 集成组件

4. **advanced-code.vue** - 高级代码编辑页面
   - 完整的项目文件管理
   - 项目导入导出
   - 与现有 codebook 系统集成

5. **code-with-files.vue** - 混合模式代码编辑页面
   - 简单模式：单文件编辑
   - 文件管理模式：多文件项目管理
   - 模式切换功能

## 使用方法

### 基本使用

```vue
<template>
  <FileManager
    :initial-files="projectFiles"
    :project-name="projectName"
    @update:files="handleFilesUpdate"
    @file-change="handleFileChange"
    @project-save="handleProjectSave"
  />
</template>

<script setup>
import FileManager from '@@/components/CodeMirror/FileManager.vue'

const projectFiles = ref([
  {
    id: 'root',
    name: 'My Project',
    type: 'folder',
    children: [
      {
        id: 'main',
        name: 'main.py',
        type: 'file',
        content: 'print("Hello, World!")',
        language: 'python',
        parentId: 'root'
      }
    ]
  }
])

const handleFilesUpdate = (files) => {
  console.log('Files updated:', files)
}

const handleFileChange = (file) => {
  console.log('File changed:', file)
}

const handleProjectSave = (files) => {
  console.log('Project saved:', files)
}
</script>
```

### 在 codebook 中使用

```vue
<template>
  <div class="codebook-page">
    <!-- 基本信息页面 -->
    <InfoPage v-if="currentStep === 0" />
    
    <!-- 代码编辑页面 - 选择模式 -->
    <CodeWithFiles v-if="currentStep === 1" />
  </div>
</template>

<script setup>
import CodeWithFiles from './modal/code-with-files.vue'
</script>
```

## 功能特性

### 文件管理
- ✅ 创建文件和文件夹
- ✅ 重命名文件/文件夹
- ✅ 删除文件/文件夹
- ✅ 文件类型自动识别
- ✅ 语言自动推断

### 代码编辑
- ✅ 多文件标签页切换
- ✅ 实时代码同步
- ✅ 代码格式化
- ✅ 语法高亮
- ✅ 代码清空

### 项目管理
- ✅ 项目导入/导出
- ✅ JSON 格式存储
- ✅ 项目结构保持
- ✅ 文件内容保存

### 用户体验
- ✅ 响应式设计
- ✅ 现代化 UI
- ✅ 右键菜单
- ✅ 键盘快捷键支持
- ✅ 拖拽操作（可扩展）

## 数据结构

### FileNode 接口

```typescript
interface FileNode {
  id: string           // 唯一标识
  name: string         // 文件名
  type: 'file' | 'folder'  // 类型
  content?: string     // 文件内容（仅文件）
  language?: string    // 编程语言（仅文件）
  children?: FileNode[] // 子文件（仅文件夹）
  parentId?: string    // 父级ID
}
```

### 项目文件示例

```json
[
  {
    "id": "root",
    "name": "My Project",
    "type": "folder",
    "children": [
      {
        "id": "main",
        "name": "main.py",
        "type": "file",
        "content": "# 主程序入口\nprint('Hello, World!')",
        "language": "python",
        "parentId": "root"
      },
      {
        "id": "utils",
        "name": "utils",
        "type": "folder",
        "children": [
          {
            "id": "helper",
            "name": "helper.py",
            "type": "file",
            "content": "# 辅助函数\ndef helper():\n    pass",
            "language": "python",
            "parentId": "utils"
          }
        ],
        "parentId": "root"
      }
    ]
  }
]
```

## 扩展功能

### 可扩展的功能点

1. **文件拖拽排序**
   - 实现文件夹内文件排序
   - 跨文件夹拖拽移动

2. **文件搜索**
   - 全局文件搜索
   - 文件名模糊匹配

3. **版本控制**
   - 文件修改历史
   - 版本对比功能

4. **协作功能**
   - 多用户实时编辑
   - 文件锁定机制

5. **插件系统**
   - 自定义文件类型支持
   - 扩展编辑器功能

## 注意事项

1. **性能优化**
   - 大文件内容懒加载
   - 文件树虚拟滚动
   - 代码编辑器按需加载

2. **数据安全**
   - 定期自动保存
   - 数据备份机制
   - 错误恢复处理

3. **兼容性**
   - 浏览器兼容性
   - 移动端适配
   - 键盘导航支持

## 更新日志

### v1.0.0
- 基础文件管理功能
- 多文件代码编辑器
- 项目导入导出
- 与 codebook 系统集成
