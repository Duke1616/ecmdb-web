<template>
  <div class="code-with-files-page">
    <!-- 模式切换器 -->
    <div class="mode-switcher">
      <div class="mode-options">
        <label class="mode-option">
          <input 
            type="radio" 
            v-model="editorMode" 
            value="simple" 
            @change="handleModeChange"
          >
          <span>简单模式</span>
        </label>
        <label class="mode-option">
          <input 
            type="radio" 
            v-model="editorMode" 
            value="advanced" 
            @change="handleModeChange"
          >
          <span>文件管理模式</span>
        </label>
      </div>
    </div>

    <!-- 简单模式 -->
    <div v-if="editorMode === 'simple'" class="simple-editor">
      <div class="editor-container">
        <div class="editor-wrapper">
          <div class="editor-header">
            <div class="editor-info">
              <span class="language-badge">{{ formData.language || 'python' }}</span>
              <span class="file-name">{{ formData.name || 'untitled' }}</span>
            </div>
            <div class="editor-actions">
              <button @click="formatCode" class="btn btn-sm">
                ✏️ 格式化
              </button>
              <button @click="clearCode" class="btn btn-sm">
                🗑️ 清空
              </button>
            </div>
          </div>
          
          <div class="code-editor">
            <CodeMirror
              ref="codeMirrorRef"
              :code="formData.code || ''"
              :language="formData.language || 'python'"
              :is-create="true"
              @update:code="handleCodeUpdate"
              @update:language="handleLanguageUpdate"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 文件管理模式 -->
    <div v-else class="advanced-editor">
      <div class="file-manager-container">
        <FileManager
          ref="fileManagerRef"
          :initialFiles="projectFiles"
          :projectName="formData.name || 'Untitled Project'"
          @update:files="handleFilesUpdate"
          @file-change="handleFileChange"
          @project-save="handleProjectSave"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="previous" class="btn btn-secondary">
        ← 上一步
      </button>
      <button @click="save" class="btn btn-primary">
        💾 保存
      </button>
      <button @click="close" class="btn btn-secondary">
        ❌ 取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CodeMirror from '@@/components/CodeMirror/index.vue'
import FileManager from '@@/components/CodeMirror/FileManager.vue'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  language?: string
  children?: FileNode[]
  parentId?: string
}

interface Props {
  formData: {
    name: string
    code: string
    language: string
    [key: string]: any
  }
}

interface Emits {
  (e: 'update:formData', data: any): void
  (e: 'next'): void
  (e: 'previous'): void
  (e: 'close'): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editorMode = ref<'simple' | 'advanced'>('simple')
const codeMirrorRef = ref()
const fileManagerRef = ref()
const projectFiles = ref<FileNode[]>([])

// 处理模式切换
const handleModeChange = () => {
  if (editorMode.value === 'advanced' && projectFiles.value.length === 0) {
    // 初始化项目文件
    projectFiles.value = [
      {
        id: 'root',
        name: props.formData.name || 'Untitled Project',
        type: 'folder',
        children: [
          {
            id: 'main',
            name: `${props.formData.name || 'main'}.${getFileExtension(props.formData.language)}`,
            type: 'file',
            content: props.formData.code || '',
            language: props.formData.language || 'python',
            parentId: 'root'
          }
        ]
      }
    ]
  }
}

// 处理代码更新
const handleCodeUpdate = (newCode: string) => {
  emit('update:formData', { ...props.formData, code: newCode })
}

// 处理语言更新
const handleLanguageUpdate = (newLanguage: string) => {
  emit('update:formData', { ...props.formData, language: newLanguage })
}

// 处理文件更新
const handleFilesUpdate = (files: FileNode[]) => {
  projectFiles.value = files
  // 更新主文件内容
  const mainFile = findMainFile(files)
  if (mainFile) {
    emit('update:formData', { 
      ...props.formData, 
      code: mainFile.content || '',
      language: mainFile.language || 'python'
    })
  }
}

// 处理文件变化
const handleFileChange = (file: FileNode) => {
  console.log('文件变化:', file)
}

// 处理项目保存
const handleProjectSave = (files: FileNode[]) => {
  console.log('项目保存:', files)
}

// 查找主文件
const findMainFile = (files: FileNode[]): FileNode | null => {
  for (const file of files) {
    if (file.type === 'file') {
      return file
    }
    if (file.children) {
      const found = findMainFile(file.children)
      if (found) return found
    }
  }
  return null
}

// 格式化代码
const formatCode = () => {
  if (codeMirrorRef.value) {
    codeMirrorRef.value.formatCode()
  }
}

// 清空代码
const clearCode = () => {
  emit('update:formData', { ...props.formData, code: '' })
}

// 获取文件扩展名
const getFileExtension = (language: string): string => {
  const extMap: Record<string, string> = {
    'python': 'py',
    'javascript': 'js',
    'typescript': 'ts',
    'vue': 'vue',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'markdown': 'md',
    'sql': 'sql',
    'shell': 'sh',
    'yaml': 'yml'
  }
  return extMap[language] || 'txt'
}

// 上一步
const previous = () => {
  emit('previous')
}

// 保存
const save = () => {
  if (editorMode.value === 'advanced' && fileManagerRef.value) {
    // 获取所有文件内容
    const files = fileManagerRef.value.getFiles()
    const mainFile = findMainFile(files)
    if (mainFile) {
      emit('update:formData', { 
        ...props.formData, 
        code: mainFile.content || '',
        language: mainFile.language || 'python'
      })
    }
  }
  emit('save')
}

// 关闭
const close = () => {
  emit('close')
}

// 监听表单数据变化
watch(() => props.formData, (newData) => {
  if (editorMode.value === 'advanced' && projectFiles.value.length > 0) {
    // 更新主文件内容
    const mainFile = findMainFile(projectFiles.value)
    if (mainFile) {
      mainFile.content = newData.code || ''
      mainFile.language = newData.language || 'python'
    }
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.code-with-files-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.mode-switcher {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  
  .mode-options {
    display: flex;
    gap: 24px;
    
    .mode-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
      
      input[type="radio"] {
        margin: 0;
      }
      
      &:hover {
        color: #1d4ed8;
      }
    }
  }
}

.simple-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  
  .editor-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .language-badge {
      padding: 4px 8px;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .file-name {
      font-weight: 600;
      color: #374151;
    }
  }
  
  .editor-actions {
    display: flex;
    gap: 8px;
  }
}

.code-editor {
  flex: 1;
  min-height: 400px;
}

.advanced-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.file-manager-container {
  flex: 1;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.action-buttons {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
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
  
  &.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>