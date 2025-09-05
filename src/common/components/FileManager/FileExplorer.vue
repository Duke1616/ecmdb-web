<template>
  <div class="stable-file-explorer">
    <div class="file-explorer-header">
      <div class="header-title">
        <span class="icon">📁</span>
        <span>文件管理</span>
      </div>
      <div class="header-actions">
        <button @click="() => addFile()" class="btn btn-primary btn-sm">
          <span class="icon">➕</span>
          新建文件
        </button>
        <button @click="() => addFolder()" class="btn btn-secondary btn-sm">
          <span class="icon">📁</span>
          新建文件夹
        </button>
        <button @click="() => importProject()" class="btn btn-success btn-sm">
          <span class="icon">📥</span>
          导入项目
        </button>
      </div>
    </div>

    <div class="file-tree-container">
      <div class="file-tree">
        <FileTreeNode
          v-for="file in files"
          :key="file.id"
          :file="file"
          :current-file-id="currentFileId"
          :expanded-folders="expandedFolders"
          :level="0"
          @select-file="selectFile"
          @toggle-folder="toggleFolder"
          @rename-file="renameFile"
          @delete-file="deleteFile"
          @context-menu="handleContextMenu"
        />
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="contextMenuStyle" @click.stop>
      <div v-if="contextMenuData?.type === 'folder'" class="context-menu-item" @click="handleContextCommand('newFile')">
        <span class="icon">📄</span>
        新建文件
      </div>
      <div
        v-if="contextMenuData?.type === 'folder'"
        class="context-menu-item"
        @click="handleContextCommand('newFolder')"
      >
        <span class="icon">📁</span>
        新建文件夹
      </div>
      <div
        v-if="contextMenuData?.type === 'file' || contextMenuData?.type === 'folder'"
        class="context-menu-item"
        @click="handleContextCommand('rename')"
      >
        <span class="icon">✏️</span>
        重命名
      </div>
      <div
        v-if="contextMenuData?.type === 'file' || contextMenuData?.type === 'folder'"
        class="context-menu-item"
        @click="handleContextCommand('delete')"
      >
        <span class="icon">🗑️</span>
        删除
      </div>
    </div>

    <!-- 遮罩层，用于关闭右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu-overlay" @click="closeContextMenu" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import FileTreeNode from "./FileTreeNode.vue"

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
  files: FileNode[]
  currentFileId: string
}

interface Emits {
  (e: "update:files", files: FileNode[]): void
  (e: "file-select", file: FileNode): void
  (e: "file-create", file: FileNode): void
  (e: "file-rename", file: FileNode): void
  (e: "file-delete", file: FileNode): void
  (e: "import-project"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contextMenuVisible = ref(false)
const contextMenuData = ref<FileNode | null>(null)
const contextMenuStyle = ref({})

// 展开的文件夹状态
const expandedFolders = ref<Set<string>>(new Set(["root"]))

// 选择文件
const selectFile = (file: FileNode) => {
  if (file.type === "file") {
    emit("file-select", file)
  } else if (file.type === "folder") {
    // 点击文件夹名称也可以展开/折叠
    toggleFolder(file.id)
  }
}

// 切换文件夹展开状态
const toggleFolder = (folderId: string) => {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
}

// 右键菜单
const handleContextMenu = (event: MouseEvent, data: FileNode) => {
  event.preventDefault()
  contextMenuData.value = data
  contextMenuVisible.value = true

  contextMenuStyle.value = {
    position: "fixed",
    left: event.clientX + "px",
    top: event.clientY + "px",
    zIndex: 9999
  }
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuData.value = null
}

// 导入项目
const importProject = () => {
  emit("import-project")
}

// 右键菜单命令
const handleContextCommand = (command: string) => {
  if (!contextMenuData.value) return

  switch (command) {
    case "newFile":
      addFile(contextMenuData.value.id)
      break
    case "newFolder":
      addFolder(contextMenuData.value.id)
      break
    case "rename":
      renameFile(contextMenuData.value)
      break
    case "delete":
      deleteFile(contextMenuData.value)
      break
  }

  closeContextMenu()
}

// 添加文件
const addFile = (parentId?: string) => {
  const fileName = prompt("请输入文件名:", "new_file.py")
  if (fileName) {
    const newFile: FileNode = {
      id: `file_${Date.now()}`,
      name: fileName,
      type: "file",
      content: "",
      language: getLanguageFromFileName(fileName),
      parentId: parentId || "root"
    }

    // 创建新的文件列表副本
    const newFiles = JSON.parse(JSON.stringify(props.files))
    0
    if (parentId) {
      // 添加到指定父节点
      const addToParent = (files: FileNode[], targetId: string): boolean => {
        for (const file of files) {
          if (file.id === targetId) {
            if (!file.children) file.children = []
            file.children.push(newFile)
            return true
          }
          if (file.children && addToParent(file.children, targetId)) {
            return true
          }
        }
        return false
      }
      addToParent(newFiles, parentId)
    } else {
      // 添加到根节点
      newFiles.push(newFile)
    }

    emit("update:files", newFiles)
    emit("file-create", newFile)
  }
}

// 添加文件夹
const addFolder = (parentId?: string) => {
  const folderName = prompt("请输入文件夹名:", "new_folder")
  if (folderName) {
    const newFolder: FileNode = {
      id: `folder_${Date.now()}`,
      name: folderName,
      type: "folder",
      children: [],
      parentId: parentId || "root"
    }

    // 创建新的文件列表副本
    const newFiles = JSON.parse(JSON.stringify(props.files))

    if (parentId) {
      // 添加到指定父节点
      const addToParent = (files: FileNode[], targetId: string): boolean => {
        for (const file of files) {
          if (file.id === targetId) {
            if (!file.children) file.children = []
            file.children.push(newFolder)
            return true
          }
          if (file.children && addToParent(file.children, targetId)) {
            return true
          }
        }
        return false
      }
      addToParent(newFiles, parentId)
    } else {
      // 添加到根节点
      newFiles.push(newFolder)
    }

    emit("update:files", newFiles)
    emit("file-create", newFolder)
  }
}

// 重命名文件
const renameFile = (file: FileNode) => {
  const newName = prompt("请输入新文件名:", file.name)
  if (newName && newName !== file.name) {
    // 创建新的文件列表副本
    const newFiles = JSON.parse(JSON.stringify(props.files))

    // 在副本中查找并更新文件
    const updateFileInTree = (files: FileNode[], targetId: string): boolean => {
      for (const f of files) {
        if (f.id === targetId) {
          f.name = newName
          if (f.type === "file") {
            f.language = getLanguageFromFileName(newName)
          }
          return true
        }
        if (f.children && updateFileInTree(f.children, targetId)) {
          return true
        }
      }
      return false
    }

    updateFileInTree(newFiles, file.id)
    emit("update:files", newFiles)
    emit("file-rename", { ...file, name: newName })
  }
}

// 删除文件
const deleteFile = (file: FileNode) => {
  if (confirm(`确定要删除文件 "${file.name}" 吗？`)) {
    // 创建新的文件列表副本
    const newFiles = JSON.parse(JSON.stringify(props.files))

    const removeFromTree = (files: FileNode[], targetId: string): boolean => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].id === targetId) {
          files.splice(i, 1)
          return true
        }
        if (files[i].children && removeFromTree(files[i].children!, targetId)) {
          return true
        }
      }
      return false
    }

    removeFromTree(newFiles, file.id)
    emit("update:files", newFiles)
    emit("file-delete", file)
  }
}

// 根据文件名获取语言
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    vue: "vue",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml"
  }
  return languageMap[ext || ""] || "text"
}
</script>

<style lang="scss" scoped>
.stable-file-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  min-height: 0;
}

.file-explorer-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: #374151;

    .icon {
      font-size: 16px;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.file-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.file-tree {
  .file-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin: 2px 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f1f5f9;
    }

    &.active {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .folder-toggle {
      display: flex;
      align-items: center;
      margin-right: 8px;
      cursor: pointer;
      user-select: none;

      .arrow {
        font-size: 12px;
        color: #6b7280;
        margin-right: 4px;
        transition: transform 0.2s ease;
        display: inline-block;

        &.expanded {
          transform: rotate(90deg);
        }
      }

      .folder-icon {
        font-size: 16px;
      }
    }

    .file-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .file-name {
      flex: 1;
      font-size: 14px;
      color: #374151;
    }

    .file-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .file-actions {
      opacity: 1;
    }
  }

  .children {
    margin-left: 16px;
  }
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 150px;

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    color: #374151;
    transition: background-color 0.2s;

    &:hover {
      background: #f1f5f9;
    }

    .icon {
      font-size: 14px;
    }
  }
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &.btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;

    &:hover {
      background: #2563eb;
    }
  }

  &.btn-secondary {
    background: #6b7280;
    color: white;
    border-color: #6b7280;

    &:hover {
      background: #4b5563;
    }
  }

  &.btn-success {
    background: #10b981;
    color: white;
    border-color: #10b981;

    &:hover {
      background: #059669;
    }
  }

  &.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }
}

.btn-icon {
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background: #f3f4f6;
  }
}
</style>
