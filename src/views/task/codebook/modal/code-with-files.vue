<template>
  <div class="code-with-files-page">
    <!-- 模式切换器 -->
    <div class="mode-switcher">
      <div class="mode-options">
        <label class="mode-option">
          <input type="radio" v-model="editorMode" value="simple" @change="handleModeChange" />
          <span>简单模式</span>
        </label>
        <label class="mode-option">
          <input type="radio" v-model="editorMode" value="advanced" @change="handleModeChange" />
          <span>文件管理模式</span>
        </label>
      </div>
    </div>

    <!-- 简单模式 -->
    <div v-if="editorMode === 'simple'" class="simple-editor">
      <div class="editor-container">
        <div class="editor-wrapper">
          <EditorToolbar
            :language="formData.language || 'python'"
            :file-name="formData.name || 'untitled'"
            @theme-change="handleThemeChange"
            @format="formatCode"
            @clear="clearCode"
          />

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
import { ref, watch } from "vue"
import CodeMirror from "@@/components/CodeEditor/index.vue"
import FileManager from "@@/components/FileManager/index.vue"
import FormActions from "@@/components/FormActions/index.vue"
import EditorToolbar from "@@/components/EditorToolbar/index.vue"
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

const editorMode = ref<"simple" | "advanced">("simple")
const codeMirrorRef = ref()
const fileManagerRef = ref()
const projectFiles = ref<FileNode[]>([])

// 处理模式切换
const handleModeChange = () => {
  if (editorMode.value === "advanced" && projectFiles.value.length === 0) {
    // 初始化项目文件
    projectFiles.value = [
      {
        id: "root",
        name: props.formData.name || "Untitled Project",
        type: "folder",
        children: [
          {
            id: "main",
            name: `${props.formData.name || "main"}.${getFileExtension(props.formData.language)}`,
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

// 处理代码更新
const handleCodeUpdate = (newCode: string) => {
  emit("update:formData", { ...props.formData, code: newCode })
}

// 处理语言更新
const handleLanguageUpdate = (newLanguage: string) => {
  emit("update:formData", { ...props.formData, language: newLanguage })
}

// 处理文件更新
const handleFilesUpdate = (files: FileNode[]) => {
  projectFiles.value = files
  // 更新主文件内容
  const mainFile = findMainFile(files)
  if (mainFile) {
    emit("update:formData", {
      ...props.formData,
      code: mainFile.content || "",
      language: mainFile.language || "python"
    })
  }
}

// 处理文件变化
const handleFileChange = (file: FileNode) => {
  console.log("文件变化:", file)
}

// 处理项目保存
const handleProjectSave = (files: FileNode[]) => {
  console.log("项目保存:", files)
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
            console.log("项目导入成功:", importedData)
          } else {
            console.error("无效的项目文件格式")
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

// 格式化代码
const formatCode = () => {
  if (codeMirrorRef.value) {
    codeMirrorRef.value.formatCode()
  }
}

// 清空代码
const clearCode = () => {
  emit("update:formData", { ...props.formData, code: "" })
}

// 处理主题切换
const handleThemeChange = (theme: string) => {
  if (editorMode.value === "simple" && codeMirrorRef.value) {
    codeMirrorRef.value.handleThemeChange?.(theme)
  }
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

// 使用 useFormHandler 处理表单逻辑
const { localFormData, updateFormData, next, previous, save: handleSave, close } = useFormHandler(
  props.formData,
  emit,
  "codebook"
)

// 保存
const save = () => {
  if (editorMode.value === "advanced" && fileManagerRef.value) {
    // 获取所有文件内容
    const files = fileManagerRef.value.getFiles()
    const mainFile = findMainFile(files)
    if (mainFile) {
      emit("update:formData", {
        ...props.formData,
        code: mainFile.content || "",
        language: mainFile.language || "python"
      })
    }
  }
  handleSave()
}

// 监听表单数据变化
watch(
  () => props.formData,
  (newData) => {
    if (editorMode.value === "advanced" && projectFiles.value.length > 0) {
      // 更新主文件内容
      const mainFile = findMainFile(projectFiles.value)
      if (mainFile) {
        mainFile.content = newData.code || ""
        mainFile.language = newData.language || "python"
      }
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
  text-align: left; /* 确保内容左对齐 */
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


.code-editor {
  flex: 1;
  min-height: 400px;
}

.advanced-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  text-align: left; /* 确保文件管理器左对齐 */
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
  text-align: left; /* 确保文件管理器内容左对齐 */
}

</style>
