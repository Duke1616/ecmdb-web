<template>
  <div class="stable-multi-file-editor">
    <!-- 文件标签页 -->
    <div class="editor-tabs" v-if="openFiles.length > 0">
      <div class="tabs-container">
        <div
          v-for="file in openFiles"
          :key="file.id"
          class="tab-item"
          :class="{ active: currentFileId === file.id }"
          @click="switchToFile(file)"
        >
          <span class="tab-icon">📄</span>
          <span class="tab-name">{{ file.name }}</span>
          <button @click.stop="closeFile(file)" class="tab-close" title="关闭文件">✕</button>
        </div>
      </div>
    </div>

    <!-- 代码编辑器区域 -->
    <div class="editor-container">
      <div v-if="currentFile" class="editor-wrapper">
        <div class="editor-header">
          <div class="file-info">
            <span class="file-name">{{ currentFile.name }}</span>
            <span class="file-language">{{ currentFile.language || "text" }}</span>
          </div>
          <div class="editor-actions">
            <!-- 主题选择 -->
            <div class="theme-selector">
              <label class="theme-label">主题</label>
              <el-select
                v-model="currentTheme"
                size="small"
                placeholder="选择主题"
                @change="handleThemeChange"
                class="theme-select"
                :teleported="false"
              >
                <el-option v-for="option in themeOptions" :key="option" :label="option" :value="option" />
              </el-select>
            </div>

            <button @click="formatCode" class="btn btn-sm">
              <span class="icon">✏️</span>
              格式化
            </button>
            <button @click="clearCode" class="btn btn-sm">
              <span class="icon">🗑️</span>
              清空
            </button>
          </div>
        </div>

        <div class="code-editor">
          <CodeEditor
            ref="codeMirrorRef"
            :code="currentFile.content || ''"
            :language="currentFile.language || 'text'"
            :is-create="false"
            :project-files="props.files"
            @update:code="handleCodeUpdate"
            @update:language="handleLanguageUpdate"
          />
        </div>
      </div>

      <div v-else class="empty-editor">
        <div class="empty-content">
          <div class="empty-icon">📄</div>
          <p>选择一个文件开始编辑</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import CodeEditor from "../CodeEditor/index.vue"
import * as themes from "../CodeEditor/themes"
import { useTheme, Theme } from "@@/composables/theme"

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
  (e: "file-update", file: FileNode): void
  (e: "file-select", file: FileNode): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const codeMirrorRef = ref()

// 主题相关
const currentTheme = ref(useTheme().theme.value === Theme.Dark ? "oneDark" : "default")

// 硬编码主题选项，确保有选项显示
const themeOptions = ref([
  "default",
  "oneDark",
  "materialDark",
  "nord",
  "amy",
  "ayuLight",
  "barf",
  "bespin",
  "birdsOfParadise",
  "boysAndGirls",
  "clouds",
  "cobalt",
  "coolGlow",
  "dracula",
  "espresso",
  "noctisLilac",
  "rosePineDawn",
  "smoothy",
  "solarizedLight",
  "tomorrow"
])


// 动态加载主题选项
const loadThemeOptions = () => {
  try {
    const themeKeys = Object.keys(themes)
    if (themeKeys.length > 0) {
      themeOptions.value = ["default", ...themeKeys]
    }
  } catch (error) {
    console.error("Error loading themes:", error)
  }
}

// 组件挂载时加载主题选项
loadThemeOptions()

// 打开的文件列表
const openFiles = ref<FileNode[]>([])

// 当前文件
const currentFile = computed(() => {
  return openFiles.value.find((file) => file.id === props.currentFileId)
})

// 获取所有文件
const getAllFiles = (files: FileNode[]): FileNode[] => {
  const result: FileNode[] = []

  const traverse = (fileList: FileNode[]) => {
    for (const file of fileList) {
      if (file.type === "file") {
        result.push(file)
      }
      if (file.children) {
        traverse(file.children)
      }
    }
  }

  traverse(files)
  return result
}

// 监听文件变化
watch(
  () => props.files,
  (newFiles) => {
    const allFiles = getAllFiles(newFiles)

    // 更新打开的文件列表
    openFiles.value = openFiles.value.filter((openFile) => allFiles.some((file) => file.id === openFile.id))

    // 如果当前文件被删除，关闭它
    if (props.currentFileId && !allFiles.some((file) => file.id === props.currentFileId)) {
      openFiles.value = openFiles.value.filter((file) => file.id !== props.currentFileId)
    }
  },
  { immediate: true }
)

// 添加文件到打开列表的函数
const addFileToOpenFiles = (fileId: string) => {
  if (fileId) {
    const allFiles = getAllFiles(props.files)
    const file = allFiles.find((f) => f.id === fileId)
    if (file && !openFiles.value.some((f) => f.id === file.id)) {
      openFiles.value.push(file)
    }
  }
}

// 监听当前文件ID变化
watch(
  () => props.currentFileId,
  (newFileId) => {
    addFileToOpenFiles(newFileId)
  },
  { immediate: true }
)

// 切换到文件
const switchToFile = (file: FileNode) => {
  if (file.type === "file") {
    // 通知父组件切换文件
    emit("file-select", file)
  }
}

// 关闭文件
const closeFile = (file: FileNode) => {
  const index = openFiles.value.findIndex((f) => f.id === file.id)
  if (index > -1) {
    openFiles.value.splice(index, 1)

    // 如果关闭的是当前文件，切换到其他文件
    if (props.currentFileId === file.id) {
      if (openFiles.value.length > 0) {
        const nextFile = openFiles.value[0]
        // 这里应该通知父组件切换文件
      }
    }
  }
}

// 处理代码更新
const handleCodeUpdate = (newCode: string) => {
  if (currentFile.value) {
    currentFile.value.content = newCode
    emit("file-update", currentFile.value)
  }
}

// 处理语言更新
const handleLanguageUpdate = (newLanguage: string) => {
  if (currentFile.value) {
    currentFile.value.language = newLanguage
    emit("file-update", currentFile.value)
  }
}

// 格式化代码
const formatCode = () => {
  if (codeMirrorRef.value) {
    codeMirrorRef.value.formatCode()
  }
}

// 清空代码
const clearCode = () => {
  if (currentFile.value) {
    currentFile.value.content = ""
    emit("file-update", currentFile.value)
  }
}

// 处理主题切换
const handleThemeChange = (theme: string) => {
  currentTheme.value = theme
  // 通知 CodeEditor 更新主题
  if (codeMirrorRef.value) {
    codeMirrorRef.value.handleThemeChange?.(theme)
  }
}

// 保存所有文件
const saveAllFiles = () => {
}

// 暴露方法
defineExpose({
  formatCode,
  clearCode,
  saveAllFiles,
  getOpenFiles: () => openFiles.value,
  getCurrentFile: () => currentFile.value
})
</script>

<style lang="scss" scoped>
.stable-multi-file-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 0;
}

.editor-tabs {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.tabs-container {
  display: flex;
  overflow-x: auto;
  padding: 0 8px;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin: 4px 2px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  max-width: 200px;

  &:hover {
    background: #f1f5f9;
  }

  &.active {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .tab-icon {
    margin-right: 8px;
    font-size: 14px;
  }

  .tab-name {
    flex: 1;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    margin-left: 8px;
    padding: 2px 4px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 3px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;

    &:hover {
      background: #f3f4f6;
    }
  }

  &:hover .tab-close {
    opacity: 1;
  }
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;

  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .file-name {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .file-language {
      padding: 2px 8px;
      background: #e5e7eb;
      border-radius: 4px;
      font-size: 12px;
      color: #6b7280;
    }
  }

  .editor-actions {
    display: flex;
    gap: 8px;
    align-items: center;

    .theme-selector {
      display: flex;
      align-items: center;
      gap: 6px;

      .theme-label {
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;
      }

      .theme-select {
        min-width: 100px;

        :deep(.el-input__wrapper) {
          border-radius: 4px;
          border: 1px solid #d1d5db;
          box-shadow: none;
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }
        }
      }
    }
  }
}

.code-editor {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.code-mirror) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.editor) {
    flex: 1;
    min-height: 0;
  }

  :deep(.cm-editor) {
    height: 100% !important;
    border-radius: 0;

    /* 自定义滚轮样式 */
    .cm-scroller {
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        transition: background 0.3s ease;

        &:hover {
          background: #94a3b8;
        }
      }
    }
  }
}

.empty-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;

  .empty-content {
    text-align: center;
    color: #6b7280;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #d1d5db;
    }

    p {
      margin: 0;
      font-size: 16px;
    }
  }
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

  &.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }

  .icon {
    font-size: 12px;
  }
}
</style>
