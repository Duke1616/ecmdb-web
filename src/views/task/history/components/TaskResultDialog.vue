<template>
  <FormDialog
    v-model="visible"
    :title="dialogTitle"
    :subtitle="dialogSubtitle"
    width="60%"
    :close-on-click-modal="closeOnClickModal"
    :header-icon="headerIcon"
    :show-footer="isEditable"
    :confirm-text="isEditable ? '保存' : '关闭'"
    :confirm-loading="saving"
    :footer-info-text="editTipText"
    @closed="handleClosed"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="task-result-container">
      <!-- 代码编辑器 -->
      <div v-if="language !== 'json'" class="code-editor-container">
        <prism-editor
          class="code-editor"
          v-model="result"
          :readonly="!isEditable"
          :highlight="highlighter"
          line-numbers
          :line-numbers-min="1"
        />
      </div>

      <!-- JSON 编辑器 -->
      <div v-if="language === 'json'" class="json-editor-container">
        <div class="json-editor-header" v-if="isEditable">
          <div class="json-tools">
            <el-button size="small" @click="formatJson" :icon="MagicStick"> 格式化 </el-button>
            <el-button size="small" @click="compressJson" :icon="Minus"> 压缩 </el-button>
            <el-button size="small" @click="expandNestedJson" :icon="View"> 展开嵌套 </el-button>
            <el-button size="small" @click="copyJson" :icon="CopyDocument"> 复制 </el-button>
          </div>
          <div class="json-info">
            <el-tag size="small" type="info"> {{ getJsonSize() }} 字符 </el-tag>
          </div>
        </div>
        <vue-json-pretty
          :deep="isEditable ? 2 : 3"
          v-model:data="result"
          :editable="isEditable"
          :showLineNumber="true"
          :showLine="true"
          :showLength="true"
          :showDoubleQuotes="false"
          :showSelectController="isEditable"
          :path="isEditable ? 'root' : 'res'"
          :highlightMouseoverNode="true"
          :customValueFormatter="customValueFormatter"
          :expandDepth="1"
          :showIcon="true"
          :nodeClickable="true"
        />
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/themes/prism-dark.css"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import { FormDialog } from "@@/components/Dialogs"
import { View, Setting, DataAnalysis, MagicStick, Minus, CopyDocument } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

interface Props {
  modelValue: boolean
  result: any
  language: string
  type: "input" | "output" | "args" | "variables"
  taskId?: number
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "update:result", value: any): void
  (e: "closed"): void
  (e: "save", data: { taskId: number; result: any; type: string }): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const result = ref<any>(props.result)
const saving = ref<boolean>(false)

// 监听外部数据变化
watch(
  () => props.result,
  (newValue) => {
    result.value = newValue
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  result,
  (newValue) => {
    emits("update:result", newValue)
  },
  { deep: true }
)

const dialogTitle = computed(() => {
  const titleMap = {
    input: "任务输入",
    output: "任务输出",
    args: "任务参数",
    variables: "任务变量"
  }
  return titleMap[props.type] || "任务详情"
})

const dialogSubtitle = computed(() => {
  const subtitleMap = {
    input: "查看任务的输入代码",
    output: "查看任务的执行结果",
    args: "编辑任务的执行参数",
    variables: "编辑任务的执行变量"
  }
  return subtitleMap[props.type] || "任务详情信息"
})

const headerIcon = computed(() => {
  const iconMap = {
    input: View,
    output: View,
    args: Setting,
    variables: DataAnalysis
  }
  return iconMap[props.type] || View
})

const isEditable = computed(() => {
  return props.type === "args" || props.type === "variables"
})

const editTipText = computed(() => {
  return props.type === "args" ? "修改参数后点击保存按钮" : "修改变量后点击保存按钮"
})

const closeOnClickModal = computed(() => {
  return !isEditable.value
})

const highlighter = (code: string) => {
  switch (props.language) {
    case "json":
      return highlight(code, languages.bash)
    case "python":
      return highlight(code, languages.python)
    case "shell":
      return highlight(code, languages.bash)
    case "javascript":
      return highlight(code, languages.javascript)
    default:
      return highlight(code, languages.bash)
  }
}

const handleConfirm = async () => {
  if (isEditable.value && props.taskId) {
    saving.value = true
    try {
      emits("save", {
        taskId: props.taskId,
        result: result.value,
        type: props.type
      })
      visible.value = false
    } finally {
      saving.value = false
    }
  } else {
    visible.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClosed = () => {
  emits("closed")
}

// JSON 处理工具方法
const getJsonSize = () => {
  try {
    return JSON.stringify(result.value).length
  } catch {
    return 0
  }
}

const formatJson = () => {
  try {
    const formatted = JSON.stringify(result.value, null, 2)
    result.value = JSON.parse(formatted)
    ElMessage.success("JSON 格式化完成")
  } catch (error) {
    ElMessage.error("JSON 格式化失败")
  }
}

const compressJson = () => {
  try {
    const compressed = JSON.stringify(result.value)
    result.value = JSON.parse(compressed)
    ElMessage.success("JSON 压缩完成")
  } catch (error) {
    ElMessage.error("JSON 压缩失败")
  }
}

const copyJson = async () => {
  try {
    const jsonString = JSON.stringify(result.value, null, 2)
    await navigator.clipboard.writeText(jsonString)
    ElMessage.success("JSON 已复制到剪贴板")
  } catch (error) {
    ElMessage.error("复制失败")
  }
}

const expandNestedJson = () => {
  try {
    const expanded = expandNestedJsonStrings(result.value)
    result.value = expanded
    ElMessage.success("嵌套 JSON 已展开")
  } catch (error) {
    ElMessage.error("展开嵌套 JSON 失败")
  }
}

// 递归展开嵌套的 JSON 字符串
const expandNestedJsonStrings = (obj: any): any => {
  if (typeof obj === "string") {
    // 尝试解析 JSON 字符串
    if (obj.startsWith("{") || obj.startsWith("[")) {
      try {
        const parsed = JSON.parse(obj)
        return expandNestedJsonStrings(parsed)
      } catch {
        return obj
      }
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => expandNestedJsonStrings(item))
  }

  if (obj && typeof obj === "object") {
    const expanded: any = {}
    for (const [key, value] of Object.entries(obj)) {
      expanded[key] = expandNestedJsonStrings(value)
    }
    return expanded
  }

  return obj
}

const customValueFormatter = (value: any) => {
  if (typeof value === "string") {
    // 如果是 JSON 字符串，尝试解析并格式化
    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed, null, 2)
      } catch {
        // 如果不是有效 JSON，按普通字符串处理
        if (value.length > 100) {
          return value.substring(0, 100) + "..."
        }
        return value
      }
    }
    // 普通长字符串截断
    if (value.length > 100) {
      return value.substring(0, 100) + "..."
    }
  }
  return value
}
</script>

<style scoped lang="scss">
.task-result-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.code-editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.code-editor {
  height: 100%;
  font-family: "Fira Code", "Monaco", "Consolas", "Courier New", monospace;

  :deep(.prism-editor__line-numbers) {
    background: #2d3748;
    color: #a0aec0;
  }

  :deep(.prism-editor__code) {
    background: #1a202c;
    color: #e2e8f0;
  }
}

.json-editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.json-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  flex-shrink: 0;

  .json-tools {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;

    .el-button {
      font-size: 11px;
      padding: 3px 6px;
      height: auto;
      min-width: auto;
      white-space: nowrap;
    }
  }

  .json-info {
    .el-tag {
      font-size: 11px;
      padding: 2px 6px;
    }
  }
}

:deep(.vjs-tree) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: "Monaco", "Consolas", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;

  .vjs-tree-node {
    margin: 2px 0;
  }

  .vjs-tree-content {
    .vjs-tree-content-value {
      word-break: break-all;
      max-width: 100%;
    }
  }
}

// 移除了编辑提示样式，因为现在使用 FormDialog 的 footer-info
</style>
