<template>
  <div class="code-with-files-page">
    <!-- 文件管理模式 -->
    <div class="file-editor">
      <div class="file-manager-container">
        <FileManager
          ref="fileManagerRef"
          :initialFiles="projectFiles"
          :projectName="formData.identifier || 'Untitled Project'"
          @update:files="handleFilesUpdate"
          @file-change="handleFileChange"
          @project-save="handleProjectSave"
          @import-project="handleImportProject"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <FormActions
      :show-previous="true"
      :show-save="true"
      :show-cancel="true"
      :show-next="false"
      previous-text="← 上一步"
      save-text="💾 保存"
      cancel-text="❌ 取消"
      @previous="previous"
      @save="save"
      @cancel="close"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import FileManager from "@@/components/FileManager/index.vue"
import FormActions from "@@/components/FormActions/index.vue"
import { useFormHandler } from "@@/composables/useFormHandler"

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
  formData: {
    name: string
    code: string
    language: string
    [key: string]: any
  }
}

interface Emits {
  (e: "update:formData", data: any): void
  (e: "next"): void
  (e: "previous"): void
  (e: "close"): void
  (e: "save"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileManagerRef = ref()
const projectFiles = ref<FileNode[]>([])

// 使用 useFormHandler 处理表单逻辑
const {
  previous: originalPrevious,
  save: handleSave,
  close,
  updateFormData,
  setFormData
} = useFormHandler(props.formData, emit, "codebook")

// 初始化项目文件
const initializeProjectFiles = () => {
  if (projectFiles.value.length === 0) {
    // 初始化项目文件
    projectFiles.value = [
      {
        id: "root",
        name: props.formData.identifier || "Untitled Project",
        type: "folder",
        children: [
          {
            id: "main",
            name: `main.${getFileExtension(props.formData.language)}`,
            type: "file",
            content: props.formData.code || "",
            language: props.formData.language || "python",
            parentId: "root"
          }
        ]
      }
    ]
  }
}

// 组件挂载时初始化项目文件
nextTick(() => {
  initializeProjectFiles()
})

// 处理文件更新
const handleFilesUpdate = (files: FileNode[]) => {
  projectFiles.value = files
  // 更新主文件内容
  const mainFile = findMainFile(files)
  if (mainFile) {
    updateFormDataWithFile(mainFile)
  }
}

// 处理文件变化
const handleFileChange = (file: FileNode) => {
  // 当文件管理模式中的文件发生变化时，同步更新 formData
  if (file.type === "file") {
    updateFormDataWithFile(file)
  }
}

// 处理项目保存
const handleProjectSave = (files: FileNode[]) => {
  console.log(files)
}

// 处理导入项目
const handleImportProject = () => {
  // 创建文件输入元素
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".json"
  input.style.display = "none"

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedData = JSON.parse(content)

          // 验证导入的数据格式
          if (Array.isArray(importedData)) {
            projectFiles.value = importedData
          }
        } catch (error) {
          console.error("导入失败:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

// 查找主文件
const findMainFile = (files: FileNode[]): FileNode | null => {
  for (const file of files) {
    if (file.type === "file") {
      return file
    }
    if (file.children) {
      const found = findMainFile(file.children)
      if (found) return found
    }
  }
  return null
}

// 获取文件扩展名
const getFileExtension = (language: string): string => {
  const extMap: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    vue: "vue",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    markdown: "md",
    sql: "sql",
    shell: "sh",
    yaml: "yml"
  }
  return extMap[language] || "txt"
}

// 更新表单数据的公共函数
const updateFormDataWithFile = (file: FileNode) => {
  setFormData({
    ...props.formData,
    code: file.content || "",
    language: file.language || props.formData.language
  })
  updateFormData()
}

// 保存当前代码到 formData
const saveCurrentCode = () => {
  // 优先从 FileManager 获取文件，否则使用 projectFiles
  const files = (fileManagerRef.value?.getFiles && fileManagerRef.value.getFiles()) || projectFiles.value
  const mainFile = findMainFile(files)

  if (mainFile) {
    updateFormDataWithFile(mainFile)
  }
}

// 重写 previous 函数，添加保存逻辑
const previous = () => {
  saveCurrentCode()
  originalPrevious()
}

// 保存
const save = () => {
  saveCurrentCode()
  handleSave()
}

// 监听项目文件变化，通知 FileManager 更新
watch(
  () => projectFiles.value,
  (newFiles) => {
    if (newFiles.length > 0 && fileManagerRef.value && typeof fileManagerRef.value.updateFiles === "function") {
      fileManagerRef.value.updateFiles(newFiles)
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.code-with-files-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  width: 100%;
  max-width: none;
  margin: 0;
  text-align: left;
}

.file-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.file-manager-container {
  flex: 1;
  margin: 0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;
}
</style>
