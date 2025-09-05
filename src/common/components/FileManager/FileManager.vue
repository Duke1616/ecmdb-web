<template>
  <div class="stable-file-manager">
    <div class="file-manager-layout">
      <!-- 左侧文件树 -->
      <div class="file-tree-panel" :style="{ width: leftPanelWidth + 'px' }">
        <FileExplorer
          :files="files"
          :current-file-id="currentFileId"
          @update:files="handleFilesUpdate"
          @file-select="handleFileSelect"
          @file-create="handleFileCreate"
          @file-rename="handleFileRename"
          @file-delete="handleFileDelete"
          @import-project="handleImportProject"
        />
      </div>

      <!-- 拖拽分割条 -->
      <div class="resize-handle" @mousedown="startResize" />

      <!-- 右侧代码编辑器 -->
      <div class="editor-panel" :style="{ width: `calc(100% - ${leftPanelWidth}px - 8px)` }">
        <MultiFileEditor
          :files="files"
          :current-file-id="currentFileId"
          @update:files="handleFilesUpdate"
          @file-update="handleFileUpdate"
          @file-select="handleFileSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import FileExplorer from "./FileExplorer.vue"
import MultiFileEditor from "./MultiFileEditor.vue"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  language?: string
  children?: FileNode[]
  parentId?: string
}

interface Props {
  initialFiles?: FileNode[]
  projectName?: string
}

interface Emits {
  (e: "update:files", files: FileNode[]): void
  (e: "file-change", file: FileNode): void
  (e: "project-save", files: FileNode[]): void
  (e: "import-project"): void
}

const props = withDefaults(defineProps<Props>(), {
  initialFiles: () => [],
  projectName: "Untitled Project"
})

const emit = defineEmits<Emits>()

const files = ref<FileNode[]>([])
const currentFileId = ref<string>("")

// 拖拽相关状态
const leftPanelWidth = ref(300)
const isResizing = ref(false)

// 初始化文件结构
const initializeFiles = () => {
  if (props.initialFiles.length > 0) {
    files.value = [...props.initialFiles]
  } else {
    // 默认文件结构
    files.value = [
      {
        id: "root",
        name: props.projectName,
        type: "folder",
        children: [
          {
            id: "main",
            name: "main.py",
            type: "file",
            content: '# 主程序入口\nprint("Hello, World!")',
            language: "python",
            parentId: "root"
          },
          {
            id: "utils",
            name: "utils",
            type: "folder",
            children: [
              {
                id: "helper",
                name: "helper.py",
                type: "file",
                content: "# 辅助函数\ndef helper_function():\n    pass",
                language: "python",
                parentId: "utils"
              }
            ],
            parentId: "root"
          }
        ]
      }
    ]
  }
}

// 处理文件更新
const handleFilesUpdate = (newFiles: FileNode[]) => {
  // 避免循环更新，只在文件结构真正改变时更新
  if (JSON.stringify(files.value) !== JSON.stringify(newFiles)) {
    files.value = newFiles
    emit("update:files", newFiles)
  }
}

// 处理文件选择
const handleFileSelect = (file: FileNode) => {
  currentFileId.value = file.id
  emit("file-change", file)
}

// 处理文件创建
const handleFileCreate = (file: FileNode) => {
  console.log("创建文件:", file)
}

// 处理文件重命名
const handleFileRename = (file: FileNode) => {
  console.log("重命名文件:", file)
}

// 处理文件删除
const handleFileDelete = (file: FileNode) => {
  console.log("删除文件:", file)
}

// 处理导入项目
const handleImportProject = () => {
  emit("import-project")
}

// 处理文件更新
const handleFileUpdate = (file: FileNode) => {
  // 更新文件内容
  const updateFileInTree = (files: FileNode[], targetFile: FileNode): boolean => {
    for (const f of files) {
      if (f.id === targetFile.id) {
        // 只在内容真正改变时更新
        if (f.content !== targetFile.content || f.language !== targetFile.language) {
          Object.assign(f, targetFile)
          return true
        }
        return false
      }
      if (f.children && updateFileInTree(f.children, targetFile)) {
        return true
      }
    }
    return false
  }

  const updated = updateFileInTree(files.value, file)
  if (updated) {
    emit("update:files", files.value)
  }
}

// 获取所有文件内容
const getAllFilesContent = (): FileNode[] => {
  const result: FileNode[] = []

  const traverse = (files: FileNode[]) => {
    for (const file of files) {
      if (file.type === "file") {
        result.push({
          id: file.id,
          name: file.name,
          type: "file",
          content: file.content || "",
          language: file.language || "text"
        })
      }
      if (file.children) {
        traverse(file.children)
      }
    }
  }

  traverse(files.value)
  return result
}

// 导出项目
const exportProject = () => {
  const projectData = {
    name: props.projectName,
    files: files.value,
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${props.projectName}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导入项目
const importProject = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string)
        if (projectData.files) {
          files.value = projectData.files
          currentFileId.value = ""
          emit("update:files", files.value)
        }
      } catch (error) {
        console.error("导入项目失败:", error)
      }
    }
    reader.readAsText(file)
  }
}

// 保存项目
const saveProject = () => {
  emit("project-save", files.value)
}

// 拖拽处理函数
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  e.preventDefault()

  const startX = e.clientX
  const startWidth = leftPanelWidth.value

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return

    const deltaX = e.clientX - startX
    const newWidth = startWidth + deltaX

    // 限制最小和最大宽度
    const minWidth = 200
    const maxWidth = window.innerWidth - 200

    leftPanelWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
}

// 监听文件变化
watch(
  () => props.initialFiles,
  () => {
    initializeFiles()
  },
  { immediate: true }
)

// 暴露方法
defineExpose({
  exportProject,
  importProject,
  saveProject,
  getFiles: () => files.value,
  getCurrentFile: () => files.value.find((f) => f.id === currentFileId.value),
  getAllFilesContent
})
</script>

<style lang="scss" scoped>
.stable-file-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  min-height: 500px;
}

.file-manager-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.file-tree-panel {
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  max-width: 80%;
}

.resize-handle {
  width: 8px;
  background: #e2e8f0;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background: #cbd5e1;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 100%;
    background: #94a3b8;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  background: white;
  min-width: 200px;
}
</style>
