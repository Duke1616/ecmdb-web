<template>
  <div class="editor-toolbar">
    <div class="toolbar-actions">
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

      <!-- 操作按钮 -->
      <button @click="handleFormat" class="btn btn-format" :disabled="disabled">
        <span class="btn-icon">✏️</span>
        <span class="btn-text">格式化</span>
      </button>

      <button @click="handleClear" class="btn btn-clear" :disabled="disabled">
        <span class="btn-icon">🗑️</span>
        <span class="btn-text">清空</span>
      </button>

      <button @click="handlePreview" class="btn btn-preview" :disabled="disabled">
        <span class="btn-icon">{{ props.showPreview ? '📝' : '👁️' }}</span>
        <span class="btn-text">{{ props.showPreview ? '编辑' : '预览' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import * as themes from "../CodeEditor/themes"
import { useTheme, Theme } from "@@/composables/theme"

interface Props {
  language?: string
  fileName?: string
  disabled?: boolean
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: "text",
  fileName: "untitled",
  disabled: false
})

const emit = defineEmits<{
  "theme-change": [theme: string]
  format: []
  clear: []
  preview: []
}>()

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
    console.log("Available themes:", themes)
    const themeKeys = Object.keys(themes)
    console.log("Theme keys:", themeKeys)

    if (themeKeys.length > 0) {
      themeOptions.value = ["default", ...themeKeys]
      console.log("Final theme options:", themeOptions.value)
    }
  } catch (error) {
    console.error("Error loading themes:", error)
  }
}

// 处理主题切换
const handleThemeChange = (theme: string) => {
  currentTheme.value = theme
  emit("theme-change", theme)
}

// 处理格式化
const handleFormat = () => {
  if (!props.disabled) {
    emit("format")
  }
}

// 处理清空
const handleClear = () => {
  if (!props.disabled) {
    emit("clear")
  }
}

const handlePreview = () => {
  if (!props.disabled) {
    emit("preview")
  }
}

// 组件挂载时加载主题选项
onMounted(() => {
  loadThemeOptions()
})
</script>

<style lang="scss" scoped>
.editor-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  flex-shrink: 0;

  .toolbar-actions {
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

.btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 12px;
  }

  .btn-text {
    font-size: 12px;
  }
}

.btn-format {
  &:hover:not(:disabled) {
    background: #f0f9ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }
}

.btn-clear {
  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #f87171;
    color: #dc2626;
  }
}

.btn-preview {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;

  &:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }
}
</style>
